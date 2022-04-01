import {
  AfterViewChecked,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ChatService } from 'src/app/services/chat.service';
import {
  ChatScope,
  Message,
  Room,
  RoomType,
  UserRoom,
} from 'src/app/models/chat';
import { ActivatedRoute, Event, NavigationEnd, Router } from '@angular/router';
import { ChatSocketService } from 'src/app/services/chat-socket.service';
import { DatePipe, ViewportScroller } from '@angular/common';
import { MessageSentDto } from 'src/app/models/message.dto';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/models/user';
import { Scavenger } from '@wishtack/rx-scavenger';
import { UserSocketService } from 'src/app/services/user-socket.service';
import { catchError, map } from 'rxjs';
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-chat-view',
  templateUrl: './chat-view.component.html',
  styleUrls: ['./chat-view.component.scss'],
})
export class ChatViewComponent implements OnInit, AfterViewChecked, OnDestroy {
  socket!: ChatSocketService;
  messageForm = new FormGroup({
    message: new FormControl('', Validators.required),
  });
  channel?: any;
  room?: Room;
  user?: User;
  isLoaded: boolean = false;
  newMessage: Boolean = false;
  private _scavenger = new Scavenger(this);
  userRoom?: UserRoom;

  scrollIconUp = faArrowUp;
  scrollIconDown = faArrowDown;
  scrollUp = false;

  constructor(
    private chatService: ChatService,
    private readonly route: ActivatedRoute,
    private readonly scroller: ViewportScroller,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly userSocketService: UserSocketService,
    private readonly datePipe: DatePipe,
    private titleService: Title
  ) {
    this.titleService.setTitle('Chat');
  }

  ngOnInit(): void {
    this.user = this.userService.currentUser;
    this.userService.onUserChanged
      .pipe(this._scavenger.collect())
      .subscribe((user) => {
        this.user = user;
      });
    this.initData();
    this.router.events
      .pipe(this._scavenger.collect())
      .subscribe((event: Event) => {
        if (event instanceof NavigationEnd) {
          this.initData();
        }
      });
  }

  isBan() {
    return new Date(this.userRoom?.ban!) > new Date();
  }

  isMute() {
    return new Date(this.userRoom?.mute!) > new Date();
  }

  configRoom() {
    this.userRoom = this.room?.usersRoom?.find((data: UserRoom) => {
      return data.user.id == this.user?.id;
    });
    if (this.userRoom && !this.isBan() && this.userRoom.isJoin) {
      this.room?.messages?.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      this.isLoaded = true;
    } else {
      this.socket.socket.disconnect();
      if (!this.isBan()) this.router.navigateByUrl('/chat');
    }
  }

  initData() {
    if (this.socket) this.socket.socket.disconnect();
    this.socket = new ChatSocketService();
    this.channel = Number(this.route.snapshot.paramMap.get('channel'));
    if (!this.channel) {
      this.router.navigateByUrl('/chat');
      return;
    }
    this.socket.join(this.channel);
    this.chatService.setOneFullRoom(this.channel);
    const roomFind = this.chatService.onFullRoomsChanged.get(this.channel);
    if (!roomFind) {
      this.router.navigateByUrl('/chat');
      return;
    }
    roomFind.pipe(this._scavenger.collect()).subscribe((room) => {
      this.room = room;
      this.configRoom();
    });
    this.socket
      .listen('message - ' + this.channel)
      .pipe(this._scavenger.collect())
      .subscribe((data: any) => {
        this.room?.messages?.push(data as Message);
        this.newMessage = true;
      });
  }

  ngAfterViewChecked() {
    if (this.newMessage && this.scroller.getScrollPosition()[1]) {
      this.scroller.scrollToAnchor('LastMessage');
      this.newMessage = false;
    }
  }

  isBlocked(message: Message) {
    if (
      this.user?.blacklist?.filter((data) => message.user?.id == data.id)
        ?.length
    )
      return true;
    return false;
  }

  onSubmit() {
    if (!this.messageForm.value.message) return;
    let msg: MessageSentDto = {
      user: this.user?.id,
      message: (this.messageForm.value.message as string).trim(),
      room: this.channel,
    };
    this.socket.sendMessage(msg);
    this.messageForm.reset();
  }

  onScrollClick() {
    if (this.scrollUp) {
      this.scrollUp = false;
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    } else {
      this.scrollUp = true;
      document.body.scrollTop = document.body.scrollHeight;
      document.documentElement.scrollTop =
        document.documentElement.scrollHeight;
    }
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    const documentMiddle =
      document.documentElement.scrollHeight / 2 - window.pageYOffset / 2;
    if (document.documentElement.scrollTop < documentMiddle)
      this.scrollUp = false;
    else if (document.documentElement.scrollTop >= documentMiddle)
      this.scrollUp = true;
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
    this.chatService.delOneFullRoom(this.channel);
  }
}
