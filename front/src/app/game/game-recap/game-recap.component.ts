import { Component, OnInit } from '@angular/core';
import { Game } from 'src/app/models/game';
import { User } from 'src/app/models/user';
import { GameService } from 'src/app/services/game.service';
import { UserService } from 'src/app/services/user.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-game-recap',
  templateUrl: './game-recap.component.html',
  styleUrls: ['./game-recap.component.scss'],
})
export class GameRecapComponent implements OnInit {
  leftPlayer!: any;
  rightPlayer!: any;
  gameEndInfo!: any;
  gameMode!: string;
  previousState!: string;
  state!: string;

  constructor(
    private readonly userService: UserService,
    private gameService: GameService,
    private router: Router,
    private titleService: Title
  ) {
    this.titleService.setTitle('Game recap');
  }

  ngOnInit(): void {}
  ngAfterViewInit() {
    if (!this.gameService.gameEndInfo) {
      this.router.navigateByUrl('404');
      return;
    }
    this.leftPlayer = this.gameService.gameInfo.LeftPlayer;
    this.rightPlayer = this.gameService.gameInfo.RightPlayer;
    this.gameEndInfo = this.gameService.gameEndInfo;
    this.gameMode = this.gameService.gameMode;
    this.previousState = this.gameService.previousState;
    this.state = this.gameService.state;
  }
}
