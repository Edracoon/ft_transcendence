import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { UserSocketService } from '../../services/user-socket.service';
import { Action } from 'src/app/models/action';
import { UserService } from 'src/app/services/user.service';
import { ActionCategory } from '../../models/action';
import { Scavenger } from '@wishtack/rx-scavenger';
import { User } from 'src/app/models/user';
import { GameService } from 'src/app/services/game.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit, OnDestroy {
  changeText!: number;
  currentUser?: User;

  private _scavenger: Scavenger = new Scavenger(this);

  constructor(
    private userService: UserService,
    private gameService: GameService
  ) {
    this.currentUser = this.userService.currentUser;
    this.userService.onUserChanged
      .pipe(this._scavenger.collect())
      .subscribe((user) => (this.currentUser = user));
  }

  ngOnInit(): void {}

  getNbNotif() {
    return this.currentUser?.actions_received?.filter((action) => !action.seen)
      .length;
  }

  onNotifClick(e: Event, action: Action) {
    e.preventDefault();
    if (action.category === 'LAUNCH_DUEL') {
      this.userService.delAction(action).subscribe();
      this.gameService.joinDuel(action.sender.id, this.currentUser!.id);
    } else {
      action.seen = true;
      this.userService.updateAction(action).subscribe(() => {
        this.userService.uploadCurrentUser();
      });
    }
  }

  getActionText(action: Action) {
    let text = '';
    switch (action.category) {
      case ActionCategory.ADD_FRIEND:
        text = '"' + action.sender.nickname + '" wants to be a friend';
        break;
      case ActionCategory.JOIN_CHANNEL:
        text =
          '"' +
          action.sender.nickname +
          '" add you to channel ' +
          action.metadata.name;
        break;
      case ActionCategory.START_DM:
        text =
          '"' + action.sender.nickname + '" start with you a direct message';
        break;
      case ActionCategory.LAUNCH_DUEL:
        text = '"' + action.sender.nickname + '" sent a duel request';
        break;
      default:
        break;
    }
    return text;
  }

  getActionLink(action: Action) {
    let link = '';
    switch (action.category) {
      case ActionCategory.ADD_FRIEND:
        link += '/user/show/' + action.sender.id;
        break;
      case ActionCategory.JOIN_CHANNEL:
        link += '/chat/' + action.metadata.id;
        break;
      case ActionCategory.START_DM:
        link += '/chat/' + action.metadata.id;
        break;
      case ActionCategory.LAUNCH_DUEL:
        link += '/game/duel' /*+ action.metadata.id*/;
        break;

      default:
        break;
    }
    return link;
  }

  onDeleteAction(event: MouseEvent, action: Action) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    let btn = event.target as HTMLElement;
    btn.parentElement?.remove();
    this.userService.delAction(action).subscribe();
  }

  changeStyle(event: MouseEvent) {
    let target = event.target as HTMLElement;
    if (event.type != 'mouseover') {
      target.classList.remove('bi-x-square-fill');
      target.classList.add('bi-x-square');
    } else {
      target.classList.remove('bi-x-square');
      target.classList.add('bi-x-square-fill');
    }
  }
  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }
}
