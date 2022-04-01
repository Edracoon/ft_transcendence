import { Component, OnInit, AfterViewInit } from '@angular/core';
import { GameService } from 'src/app/services/game.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-ranked',
  templateUrl: './ranked.component.html',
  styleUrls: ['./ranked.component.scss'],
})
export class RankedComponent implements OnInit, AfterViewInit {
  constructor(
    public router: Router,
    public gameService: GameService,
    private titleService: Title
  ) {
    this.titleService.setTitle('Game');
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.gameService.state !== 'IN_ACCEPT' && !this.gameService.needRefresh)
      this.gameService.joinMatchMaking();
  }

  OnClickLeaveMatchMaking() {
    this.gameService.cancel();
  }
}
