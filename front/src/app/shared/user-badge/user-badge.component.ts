import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { User } from 'src/app/models/user';
import { UserService } from '../../services/user.service';
import { UserSocketService } from '../../services/user-socket.service';
import { Subscription, first } from 'rxjs';
import { Scavenger } from '@wishtack/rx-scavenger';

export interface BadgeEvent {
  elmt: HTMLElement;
  event: any;
  user: User;
}

export enum BadgeSize {
  SMALL,
  MEDUIM,
  BIG,
}

export interface BadgeOption {
  size?: BadgeSize;
  nickname?: boolean;
  status?: boolean;
  truncate?: boolean;
}

@Component({
  selector: 'app-user-badge',
  templateUrl: './user-badge.component.html',
  styleUrls: ['./user-badge.component.scss'],
})
export class UserBadgeComponent implements OnInit, OnDestroy {
  @Input() user!: User;
  currentUser?: User;

  private _scavenger: Scavenger = new Scavenger(this);

  @Input() option: BadgeOption = {};

  @Output() badgeEvent = new EventEmitter<BadgeEvent>();

  constructor(private userService: UserService) {
    this.currentUser = this.userService.currentUser;
    this.userService.onUserChanged
      .pipe(this._scavenger.collect())
      .subscribe((user) => {
        this.currentUser = user;
      });
  }

  ngOnInit(): void {
    this.option = {
      ...{
        size: BadgeSize.SMALL,
        nickname: true,
        status: true,
        truncate: false,
      },
      ...this.option,
    };
  }

  onClick(elmt: HTMLElement, event: any, user: User) {
    this.badgeEvent.emit({ elmt, event, user });
  }

  isFriend() {
    return (
      this.currentUser?.friends?.find((user) => this.user.id == user.id) ||
      this.user.id == this.currentUser?.id
    );
  }

  isBlocked() {
    return this.currentUser?.blacklist?.find((user) => this.user.id == user.id);
  }

  getAvatar() {
    if (!this.isBlocked()) return this.user.avatar;
    return '/assets/images/blacklist.png';
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }
}
