import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Scavenger } from '@wishtack/rx-scavenger';
import { firstValueFrom } from 'rxjs';
import { Room, RoomType } from 'src/app/models/chat';
import { User } from 'src/app/models/user';
import { ChatService } from 'src/app/services/chat.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-dm-action',
  templateUrl: './dm-action.component.html',
  styleUrls: ['./dm-action.component.scss'],
})
export class DmActionComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly chatService: ChatService,
    private readonly userService: UserService
  ) {}

  @Input() user_id!: number;

  private _scavenger = new Scavenger();

  ngOnInit(): void {}

  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }

  async onDm() {
    const user: User = await firstValueFrom(
      this.userService.getUser(this.user_id)
    );
    const roomExist: Room = await firstValueFrom(
      this.chatService.getDirectMessageRoom(this.user_id)
    );
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
}
