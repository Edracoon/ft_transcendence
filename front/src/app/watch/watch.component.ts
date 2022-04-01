import { Component, OnDestroy, OnInit } from '@angular/core';
import { GameService } from '../services/game.service';
import { UserSocketService } from '../services/user-socket.service';
import { Scavenger } from '@wishtack/rx-scavenger';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-watch',
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.scss'],
})
export class WatchComponent implements OnInit, OnDestroy {
  rooms: any;

  private _scavanger = new Scavenger(this);
  constructor(
    private gameService: GameService,
    private userSocketService: UserSocketService,
    private titleService: Title,
    private router: Router
  ) {
    this.titleService.setTitle('Watch');
    this.userSocketService
      .listen('watch_notif')
      .pipe(this._scavanger.collect())
      .subscribe(() => {
        this.retrieveRooms();
      });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (
      this.gameService.state === 'IN_DUEL' ||
      this.gameService.state === 'IN_RANKED' ||
      this.gameService.state === 'WAITING_DUEL' ||
      this.gameService.state === 'WAITING_RANKED'  
    ) {
      this.router.navigateByUrl('/game/ranked');
    }
    this.retrieveRooms();
  }

  async retrieveRooms() {
    this.rooms = await this.gameService.getGameRooms(); /*?.filter(
      (room) => room.metadata.state == 'play'
    );*/
    console.log(this.rooms);
  }

  watchRoom(id: string) {
    if (
      this.gameService.state !== 'IN_DUEL' &&
      this.gameService.state !== 'IN_RANKED' &&
      this.gameService.state !== 'WAITING_DUEL' &&
      this.gameService.state !== 'WAITING_RANKED'  
    )
    {
      this.gameService.joinSpectator(id);
    }
  }

  ngOnDestroy(): void {
    this._scavanger.unsubscribe();
  }
}
