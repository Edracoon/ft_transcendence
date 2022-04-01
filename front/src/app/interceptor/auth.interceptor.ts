import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  filter,
  Observable,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment.prod';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private readonly authService: AuthService) {
    console.log('# Start AuthInterceptor');
  }

  private isRefreshing: boolean = false;
  private tokenRefresh: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token: string | null = localStorage.getItem('access_token');
    let authReq: HttpRequest<any> = request;

    if (token != null) authReq = this.addTokenHeader(request, token);

    return next.handle(authReq).pipe(
      catchError((error: any) => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          error.error.message === 'Token expired' &&
          authReq.url !== environment.API_INFINITY + '/user/is-signed' &&
          authReq.url !== environment.API_INFINITY + '/login/refresh-token'
        )
          return this.handleRefresh(authReq, next);
        return throwError(() => error);
      })
    );
  }

  addTokenHeader(request: HttpRequest<any>, token: string) {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  handleRefresh(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.tokenRefresh.next(null);

      const token = localStorage.getItem('refresh_token');

      if (token) {
        console.log('Making refresh token request...');
        return this.authService.refreshToken(token).pipe(
          switchMap((token_infos: any) => {
            this.isRefreshing = false;
            this.tokenRefresh.next(token_infos.token);
            return next.handle(this.addTokenHeader(request, token_infos.token));
          }),
          catchError((err) => {
            console.log('Error while refresh token : ', err);
            this.isRefreshing = false;
            localStorage.clear();
            return throwError(() => err);
          })
        );
      }
    }

    return this.tokenRefresh.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token)))
    );
  }
}
