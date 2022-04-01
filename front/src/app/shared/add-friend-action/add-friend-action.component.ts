import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Scavenger } from '@wishtack/rx-scavenger';
import { Action, ActionCategory } from 'src/app/models/action';
import { UserSocketService } from 'src/app/services/user-socket.service';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';

export enum FriendState {
  NOT_FRIEND = 'NOT_FRIEND',
  ADD_FRIEND = 'ADD_FRIEND',
  ACCEPT_FRIEND = 'ACCEPT_FRIEND',
  FRIEND = 'FRIEND',
}

@Component({
  selector: 'app-add-friend-action',
  templateUrl: './add-friend-action.component.html',
  styleUrls: ['./add-friend-action.component.scss'],
})
export class AddFriendActionComponent implements OnInit, OnDestroy {
  @Input() user_id!: number;
  currentUser?: User;

  friendState?: FriendState;
  FriendState = FriendState;

  private _scavenger: Scavenger = new Scavenger(this);

  constructor(private userService: UserService) {
    this.currentUser = this.userService.currentUser;
    this.updateFriendState();
    this.userService.onUserChanged
      .pipe(this._scavenger.collect())
      .subscribe((user) => {
        this.currentUser = user;
        this.updateFriendState();
      });
  }

  ngOnInit() {
    this.updateFriendState();
  }

  updateFriendState() {
    this.friendState = FriendState.NOT_FRIEND;
    if (this.currentUser?.friends?.find((user) => user.id == this.user_id))
      this.friendState = FriendState.FRIEND;
    else if (
      this.currentUser?.actions_sent?.find(
        (action) =>
          action.recipient.id == this.user_id &&
          action.category == ActionCategory.ADD_FRIEND
      )
    )
      this.friendState = FriendState.ADD_FRIEND;
    else if (
      this.currentUser?.actions_received?.find(
        (action) =>
          action.sender.id == this.user_id &&
          action.category == ActionCategory.ADD_FRIEND
      )
    )
      this.friendState = FriendState.ACCEPT_FRIEND;
  }

  addFriend(btn: HTMLButtonElement) {
    btn.disabled = true;
    this.userService
      .addAction(ActionCategory.ADD_FRIEND, this.user_id)
      .pipe(this._scavenger.collect())
      .subscribe(() => {
        this.userService.uploadCurrentUser();
        btn.disabled = false;
      });
  }

  cancelFriendAdd(btn: HTMLButtonElement) {
    btn.disabled = true;
    let action = this.currentUser?.actions_sent?.find(
      (action) =>
        action.recipient.id == this.user_id &&
        action.category == ActionCategory.ADD_FRIEND
    );
    this.userService
      .delAction(action!)
      .pipe(this._scavenger.collect())
      .subscribe(() => {
        this.userService.uploadCurrentUser();
        btn.disabled = false;
      });
  }

  acceptFriend(btn: HTMLButtonElement) {
    btn.disabled = true;
    let action = this.currentUser?.actions_received?.find(
      (action) =>
        action.sender.id == this.user_id &&
        action.category == ActionCategory.ADD_FRIEND
    );
    this.userService
      .acceptAction(action!)
      .pipe(this._scavenger.collect())
      .subscribe(() => {
        this.userService.uploadCurrentUser();
        btn.disabled = false;
      });
  }

  delFriend(btn: HTMLButtonElement) {
    btn.disabled = true;
    this.userService
      .delFriend(this.user_id)
      .pipe(this._scavenger.collect())
      .subscribe(() => {
        this.userService.uploadCurrentUser();
        btn.disabled = false;
      });
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }
}
