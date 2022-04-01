import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Scavenger } from '@wishtack/rx-scavenger';
import { ChatScope, Config, Room, RoomType } from 'src/app/models/chat';
import { User } from 'src/app/models/user';
import { ChatService } from 'src/app/services/chat.service';
import { SearchEvent } from '../../shared/search-user/search-user.component';

@Component({
  selector: 'app-create-channel',
  templateUrl: './create-channel.component.html',
  styleUrls: ['./create-channel.component.scss'],
})
export class CreateChannelComponent implements OnInit {
  selectedUsers: User[] = [];
  constructor(
    private readonly route: ActivatedRoute,
    private readonly chatService: ChatService,
    private readonly router: Router
  ) {}

  formGroup: FormGroup = new FormGroup({
    name: new FormControl(null, Validators.required),
    topic: new FormControl(null),
    scope: new FormControl(null),
    password: new FormControl(null),
  });
  error: string = '';

  private _scavenger = new Scavenger(this);

  ngOnInit(): void {
    const name = this.route.snapshot.paramMap.get('name');
    if (name) this.formGroup.patchValue({ name: name });
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }

  onCreate() {
    if (!this.formGroup.get('name')?.value) {
      this.error = "The channel's name is required";
      setTimeout(() => {
        this.error = '';
      }, 5000);
      return;
    }
    let config: Config = {
      name: this.formGroup.get('name')?.value,
      topic: this.formGroup.get('topic')?.value,
      scope: this.formGroup.get('scope')?.value,
      password: this.formGroup.get('password')?.value,
    };
    if (config.scope) config.scope = ChatScope.PRIVATE;
    else config.scope = ChatScope.PUBLIC;

    if (config.scope === ChatScope.PUBLIC && config.password)
      config.scope = ChatScope.PROTECTED;
    const newChannel: Room = {
      type: RoomType.CHANNEL,
    };
    this.chatService
      .createConfig(config)
      .pipe(this._scavenger.collect())
      .subscribe({
        next: (data: Config) => {
          if (!data) {
            return;
          }
          newChannel.config = data;
          this.chatService
            .createChannel(newChannel)
            .pipe(this._scavenger.collect())
            .subscribe((val: Room) => {
              this.chatService
                .saveUsersSendInvitation(this.selectedUsers, val.id!)
                .pipe(this._scavenger.collect())
                .subscribe(() => {
                  this.chatService.uploadCurrentRooms();
                  this.chatService.uploadOneFullRoom(val.id!);
                  this.router.navigateByUrl('/chat/' + val.id);
                });
            });
        },
        error: (e) => {
          if (
            e.error.statusCode == 406 &&
            e.error.message == 'Chat name already exist'
          )
            this.error = e.error.message + ', please change it';
        },
      });
  }

  onSearchEvent(searchEvent: SearchEvent) {
    this.selectedUsers.push(searchEvent.user);
  }
}
