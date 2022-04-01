import { NgModule } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { UserComponent } from './user.component';
import { ProfileComponent } from './profile/profile.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { SharedModule } from '../shared/shared.module';
import { UserRoutingModule } from './user-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { SecurePipe } from '../pipes/secure.pipe';
import { QRCodeModule } from 'angularx-qrcode';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [UserComponent, ProfileComponent, EditProfileComponent],
  imports: [
    SharedModule,
    UserRoutingModule,
    ReactiveFormsModule,
    QRCodeModule,
    NgbModule,
    FontAwesomeModule,
  ],
  providers: [CookieService],
})
export class UserModule {}
