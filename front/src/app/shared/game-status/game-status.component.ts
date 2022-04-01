import { Component, OnInit } from '@angular/core';
import { GameService } from 'src/app/services/game.service';

@Component({
  selector: 'app-game-status',
  templateUrl: './game-status.component.html',
  styleUrls: ['./game-status.component.scss'],
})
export class GameStatusComponent implements OnInit {
  stateString = {
    IDLE: ' ————',
    WAITING_RANKED: 'Wait R',
    WAITING_DUEL: 'Wait D',
    LOOKING: 'Watch',
    IN_RANKED: 'Ranked',
    IN_DUEL: 'Duel',
    IN_ACCEPT: 'Accept',
  };

  constructor(private gameService: GameService) {}

  ngOnInit(): void {}

  loadLogo() {
    return ['WAITING_RANKED', 'WAITING_DUEL'].includes(this.gameService.state);
  }

  loadStatus() {
    return [
      'WAITING_RANKED',
      'WAITING_DUEL',
      'IN_DUEL',
      'IN_RANKED',
      'IN_ACCEPT',
    ].includes(this.gameService.state);
  }
  getStatus() {
    return this.stateString[this.gameService.state];
  }

  getSrc() {
    return (
      'assets/images/infinity_load' + (!this.loadLogo() ? '_stop' : '') + '.gif'
    );
  }
}
