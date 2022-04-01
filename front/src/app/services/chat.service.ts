import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  catchError,
  config,
  first,
  firstValueFrom,
  map,
  Observable,
  of,
  Subject,
  tap,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { ChatModule } from '../chat/chat.module';
import { Config, Message, Room, UserRoom, RoomRole } from '../models/chat';
import { User } from '../models/user';
import { UserService } from './user.service';
import { UserSocketService } from './user-socket.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  endpoint: string = environment.API_INFINITY + '/api/chat/';

  fullRooms: Map<number, Room | undefined> = new Map();
  onFullRoomsChanged: Map<number, Subject<Room>> = new Map();

  rooms: Room[] = [];
  onRoomsChanged = new Subject<Room[]>();

  constructor(
    private readonly httpClient: HttpClient,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly userSocketService: UserSocketService
  ) {
    console.log('# Start ChatService');
    this.uploadCurrentRooms();
    this.userSocketService.listen('notif_chat').subscribe((room_id) => {
      this.uploadCurrentRooms();
      if (room_id && this.fullRooms.has(Number(room_id)))
        this.uploadOneFullRoom(Number(room_id));
    });
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(result as T);
    };
  }

  checkPasswordOnJoin(password: string, room_id: number) {
    return this.httpClient
      .post<boolean>(this.endpoint + 'room' + '/config' + '/check-password', {
        password,
        room_id,
      })
      .pipe(catchError(this.handleError<boolean>('checkPasswordOnJoin')));
  }

  uploadCurrentRooms() {
    this.userService.getIntraFromToken().subscribe((id: number) => {
      this.httpClient
        .get<Room[]>(this.endpoint + 'user/' + id + '/room')
        .pipe(catchError(this.handleError<Room[]>('uplaodCurrebtRooms')))
        .subscribe((rooms: Room[]) => {
          this.rooms = rooms;
          this.onRoomsChanged.next(rooms);
          this.rooms.sort((a, b) => {
            if (a.isJoin && !b.isJoin) return -1;
            else if (b.isJoin && !a.isJoin) return 1;
            return 0;
          });
        });
    });
  }

  uploadOneFullRoom(room_id: number) {
    this.getRoom(room_id)
      .pipe(catchError(this.handleError<Room>('uploadOneFullRoom')))
      .subscribe((room) => {
        if (this.fullRooms.has(room_id)) {
          this.fullRooms.set(room_id, room);
          this.onFullRoomsChanged.get(room_id)?.next(room);
        }
      });
  }

  setOneFullRoom(room_id: number) {
    if (!this.onFullRoomsChanged.has(room_id)) {
      this.fullRooms.set(room_id, undefined);
      this.onFullRoomsChanged.set(room_id, new Subject<Room>());
    }
    this.uploadOneFullRoom(room_id);
  }

  delOneFullRoom(room_id: number) {
    this.fullRooms.delete(room_id);
    this.onFullRoomsChanged.delete(room_id);
  }

  updateConfig(config: Config) {
    return this.httpClient
      .patch(this.endpoint + 'room', config)
      .pipe(catchError(this.handleError('updateConfig')))
      .subscribe((config_updated: any) => {
        this.uploadCurrentRooms();
      });
  }

  removePassword(config: Config) {
    return this.httpClient
      .patch(this.endpoint + 'config/password', config)
      .pipe(catchError(this.handleError<Config>('removePassword')));
  }

  getDirectMessageRoom(otherUserId: number) {
    return this.httpClient
      .get<Room>(this.endpoint + 'user/' + otherUserId + '/direct')
      .pipe(catchError(this.handleError<Room>('getDirectMessageRoom')));
  }

  getRoom(room_id: number) {
    return this.httpClient.get<Room>(this.endpoint + 'room/' + room_id).pipe(
      tap((_) => console.log('get Room')),
      catchError(this.handleError<Room>('getRoom'))
    );
  }

  joinChannel(room: Room) {
    return this.httpClient
      .get(this.endpoint + 'room/' + room.id + '/join')
      .pipe(catchError(this.handleError('joinChannel')));
  }

  leaveChannel(roomId: number) {
    return this.httpClient
      .get(this.endpoint + 'room/' + roomId + '/leave')
      .pipe(catchError(this.handleError('leaveChannel')));
  }

  createChannel(newChannel: Room) {
    return this.httpClient
      .post<Room>(this.endpoint + 'room', newChannel)
      .pipe(catchError(this.handleError<Room>('createChannel')));
  }

  createConfig(config: Config) {
    return this.httpClient.post<Config>(this.endpoint + 'config', config);
  }

  getMessagesFromRoom(room_id: number) {
    return this.httpClient
      .get<Message[]>(this.endpoint + 'room/' + room_id + '/message')
      .pipe(catchError(this.handleError<Message[]>('getMessagesFromRoom')));
  }

  sendMessage(message: Message) {
    return this.httpClient
      .post<Message>(this.endpoint + 'message', message)
      .pipe(
        tap((_) => console.log('Joining a channel')),
        catchError(this.handleError<Message>('joinChannel'))
      );
  }

  getUsersRoom(room_id: number) {
    return this.httpClient
      .get<UserRoom[]>(this.endpoint + 'room/' + room_id + '/users-room')
      .pipe(
        tap((_) => console.log('get Users Room')),
        catchError(this.handleError<UserRoom[]>('getUsersRoom', []))
      );
  }

  toggleAdmin(myUserRoom_id: number, userRoom_id: number) {
    return this.httpClient
      .post<UserRoom>(this.endpoint + 'room/toggle-admin', {
        myUserRoom_id,
        userRoom_id,
      })
      .pipe(
        tap((_) => console.log('Toggle Admin')),
        catchError(this.handleError<UserRoom>('toggleAdmin'))
      );
  }

  toggleBlock(userBlocked_id: number) {
    return this.httpClient
      .post<UserRoom>(this.endpoint + 'room/toggle-block', {
        userBlocked_id,
      })
      .pipe(
        tap((_) => console.log('Toggle block')),
        catchError(this.handleError<UserRoom>('toggleBlock'))
      );
  }

  updateBanMute(
    myUserRoom_id: number,
    userRoom_id: number,
    dateTime: Date,
    type: string
  ) {
    return this.httpClient
      .post<UserRoom>(this.endpoint + 'room/mute-ban', {
        myUserRoom_id,
        userRoom_id,
        dateTime,
        type,
      })
      .pipe(
        tap((_) => console.log('update mute ban')),
        catchError(this.handleError<UserRoom>('updateMuteBan'))
      );
  }

  saveUsersSendInvitation(users: User[], room_id: number) {
    return this.httpClient
      .post(this.endpoint + 'room/invit-users', { users, room_id })
      .pipe(
        tap((_) => console.log('save Users Send Invitation')),
        catchError(this.handleError('saveUsersSendInvitation'))
      );
  }
}
