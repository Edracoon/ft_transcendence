import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Event, NavigationEnd, Router } from '@angular/router';
import { faCoffee, faGear } from '@fortawesome/free-solid-svg-icons';
import { NavigationEvent } from '@ng-bootstrap/ng-bootstrap/datepicker/datepicker-view-model';
import { Scavenger } from '@wishtack/rx-scavenger';
import { ChatScope, Config, Room, UserRoom } from 'src/app/models/chat';
import { User } from 'src/app/models/user';
import { ChatService } from 'src/app/services/chat.service';
import { UserService } from 'src/app/services/user.service';
import { SearchEvent } from 'src/app/shared/search-user/search-user.component';

@Component({
  selector: 'app-parameters',
  templateUrl: './parameters.component.html',
  styleUrls: ['./parameters.component.scss'],
})
export class ParametersComponent implements OnInit {
  faGear = faGear;
  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.rooms = this.chatService.rooms;
    this.user = this.userService.currentUser;
    this.chatService.onRoomsChanged
      .pipe(this._scavenger.collect())
      .subscribe((rooms) => {
        this.rooms = rooms;
      });
  }
  @ViewChild('password') password!: ElementRef;
  @ViewChild('topic') topicInput!: ElementRef;
  @ViewChild('errorInvit') errorInvit!: ElementRef;
  @Input() room?: Room;
  @Input() userRoom?: UserRoom;
  rooms!: Room[];
  selectedUsers: User[] = [];
  user?: User;

  hideAlert = true;
  hideAlertLeave = true;

  private _scavenger = new Scavenger(this);

  ngOnInit(): void {
    this.router.events
      .pipe(this._scavenger.collect())
      .subscribe((event: Event) => {
        if (event instanceof NavigationEnd) {
          const tmp_id = this.route.snapshot.paramMap.get('channel');
          if (tmp_id) this.room = this.rooms.find((room) => room.id == +tmp_id);
          this.userRoom = this.room?.usersRoom?.find((userRoom) => {
            return userRoom.user.id == this.user?.id;
          });
          if (this.topicInput)
            this.topicInput.nativeElement.value =
              this.room?.config?.topic || '';
        }
      });
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }

  ngAfterViewInit() {
    if (this.topicInput)
      this.topicInput.nativeElement.value = this.room?.config?.topic || '';
  }

  onHideAlertLeave() {
    this.hideAlertLeave = true;
  }

  onLeaveChannel() {
    this.hideAlertLeave = false;
  }

  onConfirmLeave() {
    this.hideAlertLeave = true;
    if (this.room && this.room.id) {
      this.chatService
        .leaveChannel(this.room.id)
        .pipe(this._scavenger.collect())
        .subscribe(() => {
          // this.chatService.uploadCurrentRooms();
          this.router.navigateByUrl('/chat');
        });
    }
    this.clearInputs();
  }

  onSaveUpdate() {
    let newConfig: Config;
    const pass: string = this.password?.nativeElement?.value || '';
    const topic =
      this.topicInput.nativeElement.value || this.room?.config?.topic;
    if (pass && this.room?.config?.scope != ChatScope.PRIVATE) {
      newConfig = {
        id: this.room?.config?.id,
        name: this.room?.config?.name!,
        topic: topic,
        scope: ChatScope.PROTECTED,
        password: pass,
      };
    } else {
      newConfig = {
        id: this.room?.config?.id,
        name: this.room?.config?.name!,
        topic: topic,
        scope: this.room?.config?.scope!,
      };
    }
    this.room!.config = newConfig;
    this.chatService.updateConfig(newConfig);
    this.onInviteUsers();
    this.chatService.uploadCurrentRooms();
    this.chatService.uploadOneFullRoom(this.room?.id!);
    this.topicInput.nativeElement.value = this.room?.config.topic;
  }

  onInviteUsers() {
    if (this.selectedUsers.length) {
      this.chatService
        .saveUsersSendInvitation(this.selectedUsers, this.room?.id!)
        .pipe(this._scavenger.collect())
        .subscribe(() => {
          this.chatService.uploadCurrentRooms();
          this.chatService.uploadOneFullRoom(this.room?.id!);
        });
    }
    this.clearInputs();
  }

  onDismiss() {
    this.clearInputs();
  }

  clearInputs() {
    this.selectedUsers.splice(0, this.selectedUsers.length);
    if (this.password) this.password['nativeElement'].value = '';
  }

  onOpenModal() {
    this.clearInputs();
  }

  onRemovePassword() {
    if (
      !this.room ||
      !this.room.config ||
      this.room.config.scope != 'PROTECTED'
    )
      return;
    this.chatService
      .removePassword(this.room?.config)
      .pipe(this._scavenger.collect())
      .subscribe((data) => {
        this.chatService.uploadCurrentRooms();
      });
  }

  onSearchEvent(searchEvent: SearchEvent) {
    let errorInvit = this.errorInvit.nativeElement as HTMLElement;
    if (
      !this.room?.usersRoom?.find(
        (userRoom) => userRoom.user.id == searchEvent.user.id && userRoom.isJoin
      )
    )
      this.selectedUsers.push(searchEvent.user);
    else {
      errorInvit.innerText = 'Already exist !';
      this.hideAlert = false;
      setTimeout(() => (this.hideAlert = true), 2000);
    }
  }
}
