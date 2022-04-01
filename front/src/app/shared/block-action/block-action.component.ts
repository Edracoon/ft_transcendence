import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { User } from 'src/app/models/user';
import { ChatService } from 'src/app/services/chat.service';
import { UserService } from '../../services/user.service';
import { Scavenger } from '@wishtack/rx-scavenger';

@Component({
  selector: 'app-block-action',
  templateUrl: './block-action.component.html',
  styleUrls: ['./block-action.component.scss'],
})
export class BlockActionComponent implements OnInit, OnDestroy {
  @Input() user_id!: number;
  currentUser?: User;

  private _scavenger = new Scavenger(this);

  constructor(
    private userService: UserService,
    private chatService: ChatService
  ) {
    this.currentUser = this.userService.currentUser;
    this.userService.onUserChanged
      .pipe(this._scavenger.collect())
      .subscribe((user) => (this.currentUser = user));
  }

  ngOnInit(): void {}

  toggleBlock(event: Event) {
    let button = event.target as HTMLButtonElement;
    button.disabled = true;
    this.chatService.toggleBlock(this.user_id).subscribe(() => {
      this.userService.uploadCurrentUser();
      button.disabled = false;
    });
  }
  getBlockLabel() {
    return this.currentUser?.blacklist?.find((user) => user.id == this.user_id)
      ? 'Unblock'
      : 'Block';
  }

  ngOnDestroy(): void {
    this._scavenger.unsubscribe();
  }
}
