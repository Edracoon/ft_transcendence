import { Component, OnInit, AfterViewInit } from '@angular/core';
import {
  faComments,
  faCommentSlash,
  faCrown,
  faPingPongPaddleBall,
  faTrophy,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { Scavenger } from '@wishtack/rx-scavenger';
import { Room, RoomType } from 'src/app/models/chat';
import { Ladder } from 'src/app/models/ladder';
import { User } from 'src/app/models/user';
import { ChatService } from 'src/app/services/chat.service';
import { GlobalService } from 'src/app/services/global.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
})
export class StatsComponent implements OnInit {
  private _scavenger = new Scavenger(this);
  rooms: Room[] = [];
  user?: User;
  ladders: Ladder[];

  gameIcon = faTrophy;
  usersIcon = faUsers;
  percentIcon = faCrown;
  playIcon = faPingPongPaddleBall;
  channelsIcon = faComments;

  constructor(
    private readonly globalService: GlobalService,
    private readonly chatService: ChatService,
    private readonly userService: UserService
  ) {
    this.rooms = this.chatService.rooms;
    this.user = this.userService.currentUser;
    this.chatService.onRoomsChanged
      .pipe(this._scavenger.collect())
      .subscribe((rooms: Room[]) => {
        this.rooms = rooms;
      });
    this.userService.onUserChanged
      .pipe(this._scavenger.collect())
      .subscribe((user: User) => {
        this.user = user;
      });
    this.ladders = this.globalService.ladders;
    this.globalService.onLaddersChanged
      .pipe(this._scavenger.collect())
      .subscribe((ladders) => {
        this.ladders = ladders;
      });
  }

  ngOnInit(): void {}

  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }

  calculTotalGamePlayed(): number {
    let totalGamePlayed: number = 0;
    this.ladders.map((ladder: Ladder) => {
      totalGamePlayed += ladder.victories;
    });
    return totalGamePlayed;
  }

  calculPercentVictory(): number {
    if (!this.user) return 0;
    const nbVictory: number = this.user.ladder?.victories || 0;
    const nbDefeat: number = this.user.ladder?.defeats || 0;
    const total: number = nbVictory + nbDefeat ? nbVictory + nbDefeat : 1;
    return Math.floor((nbVictory * 100) / total);
  }

  calculGamesPlayed(): number {
    if (!this.user) return 0;
    const nbVictory: number = this.user.victories?.length || 0;
    const nbDefeat: number = this.user.defeats?.length || 0;
    return nbVictory + nbDefeat;
  }

  calculChannelsJoined(): number {
    if (!this.rooms) return 0;
    const channels: Room[] = this.rooms.filter(
      (room) => room.type == RoomType.CHANNEL && room.isJoin
    );
    return channels.length;
  }
}
