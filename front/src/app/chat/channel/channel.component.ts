import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Scavenger } from '@wishtack/rx-scavenger';
import { map } from 'rxjs';
import { ChatScope, Room } from 'src/app/models/chat';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.scss'],
})
export class ChannelComponent implements OnInit {
  constructor(
    private readonly chatService: ChatService,
    private readonly router: Router
  ) {}

  @Input() room!: Room;
  @ViewChild('leaveAlert') leavAlert!: ElementRef;
  needPass: boolean = false;
  passForm: FormGroup = new FormGroup({
    password: new FormControl(null, Validators.required),
  });

  private _scavenger = new Scavenger(this);

  hideAlertLeave: boolean = true;

  ngOnInit(): void {}

  onJoin() {
    if (this.room.config?.scope !== ChatScope.PROTECTED) {
      this.chatService
        .joinChannel(this.room)
        .pipe(this._scavenger.collect())
        .subscribe(() => this.chatService.uploadCurrentRooms());
    } else {
      this.needPass = true;
      setTimeout(() => {
        if (!this.passForm.get('password')?.value) this.needPass = false;
      }, 8000);
    }
  }
  alert() {
    if (this.leavAlert)
      this.leavAlert.nativeElement.style.display = 'inline-block';
  }
  onLeave() {
    this.hideAlertLeave = false;
  }

  onConfirmLeave() {
    this.hideAlertLeave = true;
    if (this.room)
      this.chatService
        .leaveChannel(this.room.id!)
        .pipe(this._scavenger.collect())
        .subscribe(() => {
          this.chatService.uploadCurrentRooms();
        });
  }

  onCloseAlert() {
    this.hideAlertLeave = true;
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }

  onSendPassword() {
    let passInput = this.passForm.get('password');
    if (!passInput) return;
    let pass = passInput.value;
    if (!pass) return;
    this.passForm.patchValue({ password: '' });
    this.chatService
      .checkPasswordOnJoin(pass, this.room.id!)
      .subscribe((data) => {
        if (data) {
          this.needPass = false;
          this.chatService.uploadCurrentRooms();
        }
      });
  }
}
