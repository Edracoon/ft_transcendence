import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Scavenger } from '@wishtack/rx-scavenger';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-mfa',
  templateUrl: './mfa.component.html',
  styleUrls: ['./mfa.component.scss'],
})
export class MfaComponent implements OnInit {
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  mfaForm!: FormGroup;
  mfaError!: boolean;

  private _scavenger = new Scavenger(this);

  ngOnInit(): void {
    this.mfaError = false;
    this.mfaForm = this.formBuilder.group({
      mfa1: [''],
      mfa2: [''],
      mfa3: [''],
      mfa4: [''],
      mfa5: [''],
      mfa6: [''],
    });
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }

  onSubmit(): void {
    let mfa = this.mfaForm.getRawValue();
    let keys = Object.keys(mfa);
    let mfaValue = '';
    keys.forEach((key, index) => {
      mfaValue += mfa[key];
    });

    this.authService
      .getIntraFromToken()
      .pipe(this._scavenger.collect())
      .subscribe((intra) => {
        this.authService
          .getSecretMfa(intra.toString())
          .pipe(this._scavenger.collect())
          .subscribe((secret_data: any) => {
            this.authService
              .checkMfaCode(+mfaValue, secret_data.secret)
              .pipe(this._scavenger.collect())
              .subscribe((data: any) => {
                if (data.token) {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  this.authService.saveToken('access_token', data.token);
                  this.authService.saveToken(
                    'refresh_token',
                    data.refreshToken
                  );
                  this.router.navigateByUrl('/home');
                } else {
                  this.mfaError = true;
                  setTimeout(() => {
                    this.mfaError = false;
                  }, 3000);
                }
              });
          });
      });
  }
}
