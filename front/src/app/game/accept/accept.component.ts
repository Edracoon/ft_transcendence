import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { GameService } from 'src/app/services/game.service';

@Component({
  selector: 'app-accept',
  templateUrl: './accept.component.html',
  styleUrls: ['./accept.component.scss'],
})
export class AcceptComponent implements OnInit {
  constructor(
    private router: Router,
    public gameService: GameService,
    private titleService: Title
  ) {
    this.titleService.setTitle('Game');
  }

  second: number = 20;
  accepted: boolean = false;
  intervalId!: any;
  gameMode!: string;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.gameService.state === 'IN_RANKED')
      this.router.navigateByUrl('/game/ranked');
    else if (this.gameService.state === 'IN_DUEL')
      this.router.navigateByUrl('/game/duel');
    else if (this.gameService.state === 'IDLE') {
      this.router.navigateByUrl('/home');
    }
    this.gameMode = this.gameService.gameMode;
    this.intervalId = setInterval(() => {
      this.second--;
    }, 1000);
  }

  OnClickAccept() {
    if (this.gameService.state === 'IN_ACCEPT') {
      this.accepted = true;
      this.gameService.isReady();
    }
  }

  async OnClickCancel() {
    this.gameService.cancel();
  }

  async ngOnDestroy() {
    if (!this.accepted) {
      this.gameService.cancel();
    }
    clearInterval(this.intervalId);
  }
}
