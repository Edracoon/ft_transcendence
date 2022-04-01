import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Scavenger } from '@wishtack/rx-scavenger';
import { Room, RoomType } from 'src/app/models/chat';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-channels-list',
  templateUrl: './channels-list.component.html',
  styleUrls: ['./channels-list.component.scss'],
})
export class ChannelsListComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly chatService: ChatService,
    private titleService: Title
  ) {
    this.titleService.setTitle('Chat');
    this.rooms = this.chatService.rooms;
    this.displayRooms = this.chatService.rooms;
    this.chatService.onRoomsChanged
      .pipe(this._scavenger.collect())
      .subscribe((rooms) => {
        this.rooms = rooms;
        this.displayRooms = rooms;
        this.hideLoading = true;
        if (!rooms || !rooms.length) this.hideNoChannels = false;
      });
  }

  rooms!: Room[];
  displayRooms!: Room[];
  hideLoading = false;
  hideNoChannels = true;

  faPlus = faPlus;
  private _scavenger = new Scavenger(this);

  ngOnInit(): void {
    this.chatService.uploadCurrentRooms();
  }

  onSearch(event: Event) {
    const input = event.target as any;
    const val = input.value;

    this.displayRooms = this.rooms.filter(
      (el: Room) =>
        el.type === RoomType.CHANNEL &&
        el.config!.name.toLowerCase().includes(val.toLowerCase())
    );
    if (!this.displayRooms || !this.displayRooms.length)
      this.hideNoChannels = false;
    else this.hideNoChannels = true;
  }

  onAdd() {
    const name = document.getElementById('search') as HTMLInputElement;
    if (!name) this.router.navigateByUrl('/chat/create');
    if (!name.value) this.router.navigateByUrl('/chat/create');
    if (name.value) {
      const val = name.value;
      this.router.navigateByUrl('/chat/create/' + val);
    }
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }
}
