import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Scavenger } from '@wishtack/rx-scavenger';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  constructor(
    private readonly authService: AuthService,
    private readonly currentRoute: ActivatedRoute,
    private readonly router: Router
  ) {}

  loading = false;

  private _scavenger = new Scavenger(this);
  ngOnInit(): void {
    this.currentRoute.queryParams
      .pipe(this._scavenger.collect())
      .subscribe((data) => {
        if (data['code']) {
          this.loading = true;
          this.authService
            .login(data['code'])
            .pipe(this._scavenger.collect())
            .subscribe((fdata: any) => {
              if (fdata && fdata['token']) {
                this.authService.saveToken('access_token', fdata['token']);
                this.authService
                  .getRefreshFromJwt()
                  .pipe(this._scavenger.collect())
                  .subscribe((refresh: any) => {
                    if (refresh)
                      this.authService.saveToken('refresh_token', refresh);
                    if (fdata.firstLog)
                      this.router.navigateByUrl('/user/edit-profile');
                    else if (fdata.mfa)
                      this.router.navigateByUrl('/two-factor-authentification');
                    else this.router.navigateByUrl('/home');
                  });
              }
            });
        }
      });
  }

  /** On click on login button make request to Back to log */
  onLogin() {
    this._scavenger.unsubscribe();
    window.location.href = `https://api.intra.42.fr/oauth/authorize?client_id=${environment.FORTY_TWO_ID}&redirect_uri=http%3A%2F%2F${environment.INF_HOST}%3A${environment.INF_PORT}%2F&response_type=code&scope=public`;
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }
}
