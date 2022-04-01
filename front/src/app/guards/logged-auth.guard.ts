import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class LoggedAuthGuard implements CanActivate {
  constructor(
    private readonly router: Router,
    private readonly authService: AuthService
  ) {
    console.log('# Start LoggedAuthGuard');
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    try {
      this.authService.isSignedIn().subscribe({
        next: (val) => {
          if (val) {
            this.router.navigateByUrl('/home');
            return false;
          }
          return true;
        },
        error: (e) => {
          console.log('error 1: ', e);
          this.router.navigateByUrl('/');
          return false;
        },
      });
    } catch (e) {
      console.log('An error occured : ', e);
      this.router.navigateByUrl('/');
      return false;
    }
    return true;
  }
}
