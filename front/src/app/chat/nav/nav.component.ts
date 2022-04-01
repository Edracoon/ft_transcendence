import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Event, NavigationEnd, Router } from '@angular/router';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Scavenger } from '@wishtack/rx-scavenger';
import { firstValueFrom, Subscription } from 'rxjs';
import { Room, RoomType, UserRoom } from 'src/app/models/chat';
import { User } from 'src/app/models/user';
import { ChatService } from 'src/app/services/chat.service';
import { UserService } from 'src/app/services/user.service';
import { SearchEvent } from 'src/app/shared/search-user/search-user.component';
import { BadgeEvent } from 'src/app/shared/user-badge/user-badge.component';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit {
  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.rooms = this.chatService.rooms;
    this.chatService.onRoomsChanged
      .pipe(this._scavenger.collect())
      .subscribe((rooms) => {
        this.rooms = rooms;
        this.updateInfoRoom();
      });
  }

  @Input() title!: string;
  @Input() room_id?: number;
  @Input() static = false;
  rooms: Room[];
  current_room!: Room | undefined;
  selectedUser: User[] = [];
  user_id!: number;
  current_user_room!: UserRoom | undefined;
  searchBox?: HTMLInputElement;
  ban = false;
  faPlus = faPlus;

  private _scavenger = new Scavenger(this);

  getTitle() {
    if (this.static) return this.title;
    if (this.current_room?.type != RoomType.DIRECT)
      return this.current_room?.config?.name!;

    const usersRoom = this.current_room?.usersRoom;
    if (!usersRoom) return '';
    const usersRoomFilter = usersRoom.filter((data: UserRoom) => {
      return data.user.id !== this.user_id;
    });
    if (!usersRoomFilter || !usersRoomFilter[0]) return '';
    const nickname = usersRoomFilter[0].user.nickname;
    if (!nickname) return '';
    return nickname;
  }

  async ngOnInit() {
    this.user_id = await firstValueFrom(this.userService.getIntraFromToken());
    this.room_id = Number(this.route.snapshot.paramMap.get('channel'));
    this.chatService.uploadCurrentRooms();
    this.router.events
      .pipe(this._scavenger.collect())
      .subscribe((event: Event) => {
        if (event instanceof NavigationEnd) {
          const tmp_id = this.route.snapshot.paramMap.get('channel');
          if (tmp_id) this.room_id = +tmp_id;
          this.chatService.uploadCurrentRooms();
        }
      });
  }

  updateInfoRoom() {
    this.current_room = this.rooms.find((room) => room.id == this.room_id);
    this.current_user_room = this.current_room?.usersRoom?.find((userRoom) => {
      return userRoom.user.id == this.user_id;
    });
    this.ban = new Date(this.current_user_room?.ban!) > new Date();
    this.title = this.getTitle()!;
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }

  onOpenSideNav() {
    if (this.searchBox) this.searchBox.disabled = false;
    const nav = document.getElementById('sideNav') as HTMLDivElement;
    if (nav) nav.style.width = '250px';
  }

  onCloseSideNav() {
    const nav = document.getElementById('sideNav') as HTMLDivElement;
    this.selectedUser = [];
    if (nav) nav.style.width = '0';
  }

  async onSend() {
    if (!this.selectedUser[0]) return;
    const user = this.selectedUser[0];
    // Get direct rooms in rooms array
    const roomExist: Room = await firstValueFrom(
      this.chatService.getDirectMessageRoom(user.id)
    );

    this.onCloseSideNav();
    this.selectedUser = [];
    document.getElementById('modalPm')!.style.display = 'none !important';
    if (roomExist) this.router.navigateByUrl('/chat/' + roomExist.id);
    else {
      const newDirect: Room = {
        type: RoomType.DIRECT,
      };
      this.chatService
        .createChannel(newDirect)
        .pipe(this._scavenger.collect())
        .subscribe((data: Room) => {
          if (data) {
            console.log('Direct message created');
            this.chatService
              .saveUsersSendInvitation([user], data.id!)
              .pipe(this._scavenger.collect())
              .subscribe(() => {
                this.chatService.uploadCurrentRooms();
                this.chatService.uploadOneFullRoom(data.id!);
              });
            this.router.navigateByUrl('/chat/' + data.id);
          }
        });
    }
  }

  userExist(channel: Room) {
    const userRoom = channel.usersRoom?.find(this.findOtherUser());
    if (!userRoom) return false;
    const user = userRoom.user;
    if (user) return true;
    return false;
  }

  getUser(channel: Room) {
    return channel.usersRoom?.find(this.findOtherUser())!.user!;
  }

  findOtherUser() {
    return (userRoom: UserRoom) => userRoom.user.id != this.user_id;
  }

  onClickDirectMessage(event: BadgeEvent) {
    const userDm: User = event.user;

    // Get direct rooms in rooms array
    this.chatService
      .getDirectMessageRoom(userDm.id)
      .pipe(this._scavenger.collect())
      .subscribe((room: Room) => {
        if (!room) return;
        this.router.navigateByUrl('/chat/' + room.id);
      });
  }

  onSearchEvent(searchEvent: SearchEvent) {
    this.selectedUser.push(searchEvent.user);
    searchEvent.searchBox.disabled = true;
    this.searchBox = searchEvent.searchBox;
  }
}
