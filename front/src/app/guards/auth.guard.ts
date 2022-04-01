import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {
    console.log('# Start AuthGuard');
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (!localStorage.getItem('access_token')) {
      localStorage.clear();
      this.router.navigateByUrl('/');
      return false;
    }
    try {
      this.authService.isSignedIn().subscribe({
        next: (val) => {
          if (!val) {
            this.router.navigateByUrl('/');
            return false;
          }
          return true;
        },
        error: (e) => {
          console.log('error 1: ', e);
          localStorage.clear();
          this.router.navigateByUrl('/');
          return false;
        },
      });
    } catch (e) {
      console.log('An error occured : ', e);
      localStorage.clear();
      this.router.navigateByUrl('/');
      return false;
    }
    return true;
  }
}
