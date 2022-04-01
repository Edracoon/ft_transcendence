import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  endpoint: string = environment.API_INFINITY + '/api/auth/';
  endpointUser: string = environment.API_INFINITY + '/api/user/';

  constructor(
    private readonly httpClient: HttpClient,
    private readonly router: Router
  ) {
    console.log('# Start AuthService');
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(result as T);
    };
  }

  /** On login go to the login from backend */

  login(code: string) {
    return this.httpClient.get(this.endpoint + '?code=' + code).pipe(
      tap((_) => console.log('getAccess')),
      catchError(this.handleError('getAccess'))
    );
  }

  getIntraFromToken() {
    return this.httpClient.get<number>(`${this.endpointUser}intra`).pipe(
      tap((_) => console.log('Fetch intra id from token')),
      catchError(this.handleError<number>('getIntraFromToken'))
    );
  }

  getRefreshFromJwt() {
    return this.httpClient.get(`${this.endpointUser}refresh-token`).pipe(
      map((data: any) => {
        return data['refreshToken'];
      }),
      catchError(this.handleError('getRefreshFromJwt'))
    );
  }

  /** Check if user is signed in */
  isSignedIn() {
    return this.httpClient.get<boolean>(`${this.endpoint}is-signed`).pipe(
      tap((_) => console.log('Signed in')),
      catchError(this.handleError<boolean>('updateUser'))
    );
  }

  saveToken(name: string, token: string) {
    localStorage.setItem(name, token);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  refreshToken(token: string) {
    return this.httpClient
      .post(`${this.endpoint}refresh-token`, { refreshToken: token })
      .pipe(
        tap((tokens: any) => {
          console.log('Token is refreshed');
          localStorage.clear();
          this.saveToken('access_token', tokens.token);
          this.saveToken('refresh_token', tokens.refreshToken);
        }),
        catchError(this.handleError('refreshToken'))
      );
  }

  getSecretMfa(data: string) {
    return this.httpClient.get(`${this.endpoint}secret-mfa?data=${data}`).pipe(
      tap((_) => console.log('Secret mfa created')),
      catchError(this.handleError('getSecretMfa'))
    );
  }

  checkMfaCode(code: number, secret: string) {
    return this.httpClient
      .get(`${this.endpoint}check-code?code=${code}&secret=${secret}`)
      .pipe(
        tap((_) => console.log('Mfa Code validated')),
        catchError(this.handleError('getSecretMfa'))
      );
  }

  logout() {
    this.router.navigateByUrl('');
    localStorage.clear();
  }
}
