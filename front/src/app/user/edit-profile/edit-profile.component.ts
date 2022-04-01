import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Scavenger } from '@wishtack/rx-scavenger';
import { User } from 'src/app/models/user';
import { UserUpdateDto } from 'src/app/models/user-update.dto';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { GlobalService } from '../../services/global.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})
export class EditProfileComponent implements OnInit {
  constructor(
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly globalService: GlobalService,
    private readonly authService: AuthService,
    private titleService: Title
  ) {
    this.titleService.setTitle('Edit profile');
    this.user = this.userService.currentUser!;
    this.userService.onUserChanged
      .pipe(this._scavenger.collect())
      .subscribe((user) => {
        this.user = user;
        this.updateView();
      });
  }

  mfaSecret!: string;
  qrSecret!: string;
  user!: User;
  profileUpdated!: string;
  errorMessage!: string;
  timeout!: number;
  formGroup: FormGroup = new FormGroup({
    avatar: new FormControl(null, Validators.required),
    nickname: new FormControl(null, Validators.required),
    twoFA: new FormControl(null, Validators.required),
  });

  private _scavenger = new Scavenger(this);

  /** Component initialization
   * - Set the variable to display or not the informations message about the update
   * - Get request to get the token informations
   * - Get Request to get the intra id
   * - Get request to get the user with the intra_id
   * - Update the input value on front to display DB Informations
   */
  ngOnInit(): void {
    this.profileUpdated = '';
    this.errorMessage = 'Your profile has not be updated';
    if (this.user) {
      this.updateView();
    }
  }

  updateView() {
    this.formGroup.patchValue({ nickname: this.user.nickname });
    this.formGroup.patchValue({ twoFA: this.user.setting?.mfa });
    if (this.user.setting?.mfa)
      this.authService
        .getSecretMfa(this.user.nickname)
        .pipe(this._scavenger.collect())
        .subscribe((data: any) => {
          this.mfaSecret = data.secret;
          this.qrSecret = 'otpauth://totp/Infinity?secret=' + this.mfaSecret;
        });
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
    if (this.timeout) clearTimeout(this.timeout);
  }

  /** If save is click :
   * - update the user values from the inputs
   * - patch request to API with user id to update the user
   * - if update is successful : display a message on front for 5sec
   */
  onSave() {
    if (!this.formGroup.get('nickname')?.value) {
      this.profileUpdated = 'F';
      this.errorMessage = 'Update failed : nickname is required';
      return;
    }

    this.user.nickname = this.formGroup.get('nickname')?.value;
    if (this.user.nickname.length > 22) return;
    this.user.setting!.mfa = this.formGroup.get('twoFA')?.value;
    const new_user: UserUpdateDto = {
      nickname: this.user.nickname,
      avatar: this.user.avatar,
      setting: this.user.setting!,
    };

    this.userService
      .updateUser(new_user, this.user.id)
      .pipe(this._scavenger.collect())
      .subscribe({
        next: (data) => {
          if (!data) {
            this.profileUpdated = 'F';
            this.errorMessage = 'Update failed';
            this.informationMessageTimeout(this, 5000, false);
          } else {
            this.profileUpdated = 'S';
            this.userService.uploadCurrentUser();
            this.globalService.uploadLadder();
            this.informationMessageTimeout(this, 3000, true);
          }
        },
        error: (e) => {
          console.log('Update failed : ', e);
          this.profileUpdated = 'F';
          if (
            e.error.statusCode == 406 &&
            e.error.message == 'Nickname already exist'
          )
            this.errorMessage =
              'Nickname already exist, please choose another name';
          else this.errorMessage = 'Server failed to save your data';
          this.informationMessageTimeout(this, 5000, false);
        },
      });
  }

  /** If a file is choose :
   * - get file from the event
   * - update in the form group
   * - create a form data to store the file data
   * - post request to upload the file data
   * - update the src attribute of the image for the front
   * - update the user avatar url for the user
   */
  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.formGroup.patchValue({ file: file });

      if (file && file.size > 0) {
        const formData = new FormData();
        formData.append('file', file);

        this.userService
          .uploadFile(formData)
          .pipe(this._scavenger.collect())
          .subscribe((data: any) => {
            if (data) {
              const av: HTMLImageElement = document.getElementById(
                'avatar'
              ) as HTMLImageElement;
              av.src = data.path;
              this.user.avatar = data.path;
            }
          });
      }
    }
  }

  onMfaChange() {
    if (this.formGroup.get('twoFA')?.value)
      this.authService
        .getSecretMfa(this.user.id.toString())
        .pipe(this._scavenger.collect())
        .subscribe((data: any) => {
          this.mfaSecret = data.secret;
          this.qrSecret = 'otpauth://totp/Infinity?secret=' + this.mfaSecret;
        });
    else {
      this.mfaSecret = '';
      this.qrSecret = '';
    }
  }
  /**  Set a timeout to discard the information panel in front
   *  In case of first update profile : redirect to home
   */
  informationMessageTimeout(that: any, ms: number, success: boolean) {
    this.timeout = setTimeout(function () {
      that.profileUpdated = '';
      if (success) that.router.navigateByUrl('/user/show/' + that.user.id);
    }, ms);
  }

  onCopySecret() {
    navigator.clipboard.writeText(this.mfaSecret);
    const btn: HTMLButtonElement = document.getElementById(
      'copy-btn'
    ) as HTMLButtonElement;
    const btnValue = btn.innerHTML;

    btn.innerText = 'Copied ! ';
    setTimeout(() => {
      btn.innerHTML = btnValue;
    }, 2000);
  }

  onRandomAvatar() {
    this.userService
      .getRandomAvatar()
      .pipe(this._scavenger.collect())
      .subscribe((data: any) => {
        const av: HTMLImageElement = document.getElementById(
          'avatar'
        ) as HTMLImageElement;
        av.src = data.avatar;
        this.user.avatar = data.avatar;
      });
  }
}
