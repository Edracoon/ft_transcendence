import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/models/user';
import { GameService } from 'src/app/services/game.service';
import { UserService } from 'src/app/services/user.service';
import { SoloComponent } from '../solo/solo.component';

@Component({
  selector: 'app-players-solo',
  templateUrl: './players-solo.component.html',
  styleUrls: ['./players-solo.component.scss'],
})
export class PlayersSoloComponent implements OnInit {
  leftPlayer!: any;
  rightPlayer!: any;

  constructor(
    private readonly userService: UserService,
    private gameService: GameService,
    private soloComponent: SoloComponent
  ) {}

  ngOnInit(): void {
    this.userService.getIntraFromToken().subscribe({
      next: (intra_id: any) => {
        if (intra_id) {
          this.userService.getUser(intra_id).subscribe({
            next: (data: User) => {
              this.leftPlayer = data;
            },
          });
        }
      },
    });
    this.rightPlayer = {
      id: 0,
      avatar:
        'data:image/png;base64,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',
      nickname: 'InfinityBot',
      points:
        this.soloComponent.customisationForm.value['botDifficulty'] === 'EASY'
          ? 500
          : this.soloComponent.customisationForm.value['botDifficulty'] ===
            'MEDIUM'
          ? 1000
          : 1500,
    };
  }
}
