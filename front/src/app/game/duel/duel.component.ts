import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Scavenger } from '@wishtack/rx-scavenger';
import { ActionCategory } from 'src/app/models/action';
import { GameCategory } from 'src/app/models/game';
import { User } from 'src/app/models/user';
import { GameService } from 'src/app/services/game.service';
import { UserService } from 'src/app/services/user.service';
import { SearchEvent } from 'src/app/shared/search-user/search-user.component';
import { BadgeEvent } from 'src/app/shared/user-badge/user-badge.component';

@Component({
  selector: 'app-duel',
  templateUrl: './duel.component.html',
  styleUrls: ['./duel.component.scss'],
})
export class DuelComponent implements OnInit, OnDestroy {
  user!: User;
  lengthFriends!: any;
  selectedUser!: User | undefined;
  Waiting: boolean = false;
  private _scavenger = new Scavenger(this);

  customisationForm: FormGroup = new FormGroup({
    ballColor: new FormControl('#ffffff'),
    ballSpeed: new FormControl(1),
  });
  customisation = {
    ballSpeed: 1,
    ballColor: '#ffffff',
  };

  isDuelExpired: boolean = false;

  constructor(
    private userService: UserService,
    public gameService: GameService,
    private titleService: Title,
    private router: Router
  ) {
    this.titleService.setTitle('Game');
    this.user = this.userService.currentUser!;
    this.userService.onUserChanged.subscribe((user) => {
      this.user = user;
      this.lengthFriends = user.friends?.length;
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit() {
    if (this.gameService.state === 'IN_DUEL') {
      this.gameService.joinDuel(this.user.id, this.selectedUser!.id);
    } else if (this.gameService.state === 'WAITING_DUEL') {
      this.Waiting = true;
      this.selectedUser = this.gameService.onGoingDuelParams.selectedUser;
    } else if (this.gameService.state === 'WAITING_RANKED') {
      this.router.navigateByUrl('/game/ranked');
    } else if (this.gameService.state === 'IN_RANKED') {
      this.router.navigateByUrl('/game/ranked');
    }
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
    this.gameService.duelExpired = false;
  }

  onSearchEvent(searchEvent: SearchEvent) {
    this.userService.getUser(searchEvent.user.id).subscribe((user) => {
      this.selectedUser = user;
    });
    this.gameService.duelExpired = false;
  }

  onBadgeClick(badgeEvent: BadgeEvent) {
    this.gameService.duelExpired = false;
    this.selectedUser = badgeEvent.user;
  }

  onClickPlay() {
    if (this.user.id !== this.selectedUser!.id) {
      this.Waiting = true;
    } else {
      // Handle Self Targeting
      return;
    }
    /*
    Lancer la partie notification et rejoindre la gameRoom en attendant l'autre utilisateur,
    puis lancer la partie pong quand les joueurs sont prets
    */
    this.userService
      .addAction(ActionCategory.LAUNCH_DUEL, this.selectedUser!.id)
      .pipe(this._scavenger.collect())
      .subscribe(() => {
        this.userService.uploadCurrentUser();
      });
    this.gameService.onGoingDuelParams = {
      id1: this.user.id,
      id2: this.selectedUser!.id,
      selectedUser: this.selectedUser,
      customisation: this.customisation,
    };
    this.gameService.joinDuel(
      this.user.id,
      this.selectedUser!.id,
      this.customisation
    );
  }

  onClickCancelWaiting() {
    let action = this.userService.currentUser?.actions_sent?.find(
      (action) =>
        action.category == ActionCategory.LAUNCH_DUEL &&
        action.recipient.id == this.selectedUser?.id
    );
    if (action) this.userService.delAction(action).subscribe();
    this.gameService.cancel();
    this.Waiting = false;
    this.selectedUser = undefined;
  }

  onSubmit() {
    if (!this.gameService.needRefresh) {
      this.customisation.ballColor = this.customisationForm.value['ballColor'];
      this.customisation.ballSpeed = this.customisationForm.value['ballSpeed'];
      this.onClickPlay();
    }
  }
}
