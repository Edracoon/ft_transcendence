import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Scavenger } from '@wishtack/rx-scavenger';
import { Ladder } from 'src/app/models/ladder';
import { User } from 'src/app/models/user';
import { GlobalService } from 'src/app/services/global.service';
import { UserService } from 'src/app/services/user.service';
import { BadgeEvent, BadgeSize } from '../user-badge/user-badge.component';

@Component({
  selector: 'app-ladder',
  templateUrl: './ladder.component.html',
  styleUrls: ['./ladder.component.scss'],
})
export class LadderComponent implements OnInit {
  constructor(
    private readonly globalService: GlobalService,
    private readonly userService: UserService,
    private readonly router: Router
  ) {
    this.ladders = this.globalService.ladders;
    this.globalService.onLaddersChanged
      .pipe(this._scavenger.collect())
      .subscribe((ladders) => {
        this.ladders = ladders;
        this.initData();
      });
  }

  ladders: Ladder[];
  users: User[] = [];
  sizeBadge = BadgeSize.MEDUIM;
  private _scavenger = new Scavenger();

  ngOnInit(): void {
    this.initData();
  }

  initData() {
    if (this.ladders.length > 10)
      this.ladders.splice(9, this.ladders.length - 1);
    this.users.splice(0, this.users.length);
    this.ladders.map((c_lad: Ladder) => {
      if (!c_lad || !c_lad.user) return;
      this.users.push(c_lad.user);
    });
  }

  getClassIfCurrentUser(id: number): string {
    if (id == this.userService.currentUser?.id) return 'table-success';
    return '';
  }

  onBadgeClick(event: BadgeEvent) {
    if (event.user) this.router.navigateByUrl('/user/show/' + event.user.id);
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }

  _findUserInArray(id: number) {
    return (user: User) => {
      return user.id === id;
    };
  }
}
