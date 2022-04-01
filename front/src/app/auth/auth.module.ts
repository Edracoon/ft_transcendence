import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MfaComponent } from './mfa/mfa.component';
import { LoginComponent } from './login/login.component';
import { AuthService } from '../services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { LoadingComponent } from '../shared/loading/loading.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [MfaComponent, LoginComponent],
  providers: [AuthService],
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
})
export class AuthModule {}
