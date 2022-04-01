import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserRoom, RoomRole } from 'src/app/models/chat';
import { ChatService } from 'src/app/services/chat.service';
import { UserService } from '../../services/user.service';
import { Event, ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { DateTimeEvent } from '../date-time-action/date-time-action.component';
import { Scavenger } from '@wishtack/rx-scavenger';
import { NotifType } from '../../models/notif';
import { Room } from '../../models/chat';
import {
  faArrowRightFromBracket,
  faArrowUpFromBracket,
  faBan,
  faUserXmark,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-user-room-action',
  templateUrl: './user-room-action.component.html',
  styleUrls: ['./user-room-action.component.scss'],
})
export class UserRoomActionComponent implements OnInit, OnDestroy {
  room_id!: number;
  room?: Room;
  myUserRoom!: UserRoom;

  NotifType = NotifType;
  RoomRole = RoomRole;

  faBan = faUserXmark;
  faLeave = faArrowRightFromBracket;
  private _scavenger: Scavenger = new Scavenger(this);
  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.onOpenModal();
    this.router.events
      .pipe(this._scavenger.collect())
      .subscribe((event: Event) => {
        if (event instanceof NavigationEnd) {
          this.onOpenModal();
        }
      });
  }

  toggleAdmin(event: MouseEvent, userRoom: UserRoom) {
    let button = event.target as HTMLButtonElement;
    button.disabled = true;
    this.chatService
      .toggleAdmin(this.myUserRoom.id!, userRoom.id!)
      .pipe(this._scavenger.collect())
      .subscribe(() => {
        button.disabled = false;
        userRoom.role =
          userRoom.role == RoomRole.USER ? RoomRole.ADMIN : RoomRole.USER;
      });
  }

  onOpenModal() {
    this.room_id = Number(this.route.snapshot.paramMap.get('channel'));
    this.chatService.onFullRoomsChanged
      .get(this.room_id)
      ?.pipe(this._scavenger.collect())
      .subscribe((room) => {
        this.room = room;
        this.room.usersRoom?.sort(this._sort);
        this.myUserRoom = this.room.usersRoom?.find(
          (userRoom) => userRoom.user.id == this.userService.currentUser?.id
        )!;
        if (this.myUserRoom.role == RoomRole.USER)
          this.room!.usersRoom = this.room.usersRoom?.filter(
            (userRoom) => userRoom.isJoin
          );
      });
    this.chatService.uploadOneFullRoom(this.room_id);
  }

  _sort(userRoom1: UserRoom, userRoom2: UserRoom) {
    let diff =
      userRoom1.isJoin == userRoom2.isJoin ? 0 : userRoom1.isJoin ? -1 : 1;
    if (diff) return diff;
    diff =
      Object.values(RoomRole).indexOf(userRoom2.role) -
      Object.values(RoomRole).indexOf(userRoom1.role);
    if (!diff)
      return (
        +(new Date(userRoom1.ban!) > new Date()) -
        +(new Date(userRoom2.ban!) > new Date())
      );
    return diff;
  }

  onDateTimeEvent(event: DateTimeEvent) {
    if (event.dateTime) {
      event.buttonAction.disabled = true;
      let userRoom = this.room?.usersRoom?.find(
        (userRoom) => userRoom.id == event.idEvent
      );
      if (event.type == NotifType.BAN) {
        userRoom!.ban = new Date(event.dateTime);
        userRoom!.isJoin = false;
      }
      if (event.type == NotifType.MUTE)
        userRoom!.mute = new Date(event.dateTime);
      console.log(userRoom?.mute);
      this.chatService
        .updateBanMute(
          this.myUserRoom.id!,
          event.idEvent,
          new Date(event.dateTime),
          event.type
        )
        .pipe(this._scavenger.collect())
        .subscribe();
    }
  }

  onUnBanMute(button: HTMLButtonElement, userRoom: UserRoom, type: NotifType) {
    button.disabled = true;
    if (type == NotifType.UNMUTE) userRoom!.mute = new Date();
    if (type == NotifType.UNBAN) {
      userRoom!.ban = new Date();
      userRoom.isJoin = true;
    }
    this.chatService
      .updateBanMute(this.myUserRoom.id!, userRoom.id!, new Date(), type)
      .pipe(this._scavenger.collect())
      .subscribe();
  }

  isMute(userRoom: UserRoom) {
    return new Date(userRoom.mute!) > new Date();
  }

  isBan(userRoom: UserRoom) {
    return new Date(userRoom.ban!) > new Date();
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }

  getIsJoin(usersRoom: UserRoom[]) {
    return usersRoom.filter((userRoom) => userRoom.isJoin);
  }
}
