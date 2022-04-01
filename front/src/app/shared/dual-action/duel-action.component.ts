import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ActionCategory } from 'src/app/models/action';
import { UserService } from 'src/app/services/user.service';
import { GameService } from 'src/app/services/game.service';
import { Scavenger } from '@wishtack/rx-scavenger';

@Component({
  selector: 'app-duel-action',
  templateUrl: './duel-action.component.html',
  styleUrls: ['./duel-action.component.scss'],
})
export class DuelActionComponent implements OnInit, OnDestroy {
  @Input() user_id?: number;
  constructor(
    private userService: UserService,
    private gameService: GameService
  ) {}

  ngOnInit(): void {}

  private _scavenger = new Scavenger(this);
  onClick() {
    this.userService
      .addAction(ActionCategory.LAUNCH_DUEL, this.user_id!)
      .pipe(this._scavenger.collect())
      .subscribe(() => {
        this.userService.uploadCurrentUser();
      });
    this.gameService.joinDuel(this.userService.currentUser!.id, this.user_id!);
  }

  alreadySendDuel() {
    return this.userService.currentUser?.actions_sent?.find(
      (action) =>
        action.category == ActionCategory.LAUNCH_DUEL &&
        action.recipient.id == this.user_id
    );
  }

  ngOnDestroy(): void {
    this._scavenger.unsubscribe();
  }
}
