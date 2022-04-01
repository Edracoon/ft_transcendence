import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { fa1, faFlag } from '@fortawesome/free-solid-svg-icons';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.scss'],
})
export class PlayersComponent implements OnInit {
  leftPlayer: any;
  rightPlayer!: any;

  state!: string;

  constructor(private gameService: GameService, private router: Router) {}

  flagIcon = faFlag;
  ngOnInit(): void {}

  async ngAfterViewInit() {
    if (
      this.gameService.state !== 'LOOKING' &&
      this.gameService.state !== 'IN_DUEL' &&
      this.gameService.state !== 'IN_RANKED'
    ) {
      await this.router.navigateByUrl('/home');
      return;
    }
    const playersInfo = this.gameService.gameInfo;
    this.leftPlayer = playersInfo.LeftPlayer;
    this.rightPlayer = playersInfo.RightPlayer;
    this.state = this.gameService.state;
  }

  onClickGiveUp() {
    this.gameService.giveUp();
  }
}
