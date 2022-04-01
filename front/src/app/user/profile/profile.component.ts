import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { faArrowTrendUp, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { Scavenger } from '@wishtack/rx-scavenger';
import { Ladder } from 'src/app/models/ladder';
import { User } from 'src/app/models/user';
import { GlobalService } from 'src/app/services/global.service';
import { UserService } from 'src/app/services/user.service';
import { UserSocketService } from '../../services/user-socket.service';
import { BadgeEvent } from '../../shared/user-badge/user-badge.component';
import { Achievement } from '../../models/achievement';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy, AfterViewInit {
  user?: User;
  currentUser?: User;
  eventName = 'notif_user_other';
  ladders: Ladder[];
  achievements: Achievement[] = [];

  pointsIcon = faTrophy;
  winrateIcon = faArrowTrendUp;

  private _scavenger: Scavenger = new Scavenger(this);
  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private userSocketService: UserSocketService,
    private router: Router,
    private globalService: GlobalService,
    private titleService: Title
  ) {
    this.titleService.setTitle('Profile');
    this.currentUser = this.userService.currentUser;
    this.ladders = this.globalService.ladders;
    this.globalService.onLaddersChanged
      .pipe(this._scavenger.collect())
      .subscribe((ladders) => (this.ladders = ladders));
    this.userService.onUserChanged
      .pipe(this._scavenger.collect())
      .subscribe((user) => (this.currentUser = user));
    this.userService
      .getAchievement()
      .pipe(this._scavenger.collect())
      .subscribe((achievements) => {
        this.achievements = achievements;
      });
  }

  getHideAchiev() {
    return this.achievements.filter((a) =>
      this.user?.achievements?.find((result) => a.id == result.id)
        ? false
        : true
    );
  }

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.route.paramMap
      .pipe(this._scavenger.collect())
      .subscribe((params: ParamMap) => {
        this.user = undefined;
        let user_id = Number(params.get('id'));
        this.updateUserProfile(user_id);
        this.userService
          .getIntraFromToken()
          .pipe(this._scavenger.collect())
          .subscribe((current_id) => {
            if (current_id != user_id)
              this.userSocketService
                .listen(this.eventName)
                .pipe(this._scavenger.collect())
                .subscribe((id) => {
                  if (id && id == this.user?.id)
                    this.updateUserProfile(this.user?.id!);
                });
          });
      });
  }

  updateUserProfile(user_id: number) {
    this.userService
      .getUser(user_id)
      .pipe(this._scavenger.collect())
      .subscribe((user) => {
        this.user = user;
      });
  }

  calculWinrate() {
    const victories: number = this.user?.ladder?.victories || 0;
    const defeats: number = this.user?.ladder?.defeats || 0;
    const total = victories + defeats ? victories + defeats : 1;

    return Math.floor((victories * 100) / total);
  }

  onBadgeClick(badgeEvent: BadgeEvent) {
    this.router.navigateByUrl('/user/show/' + badgeEvent.user.id);
  }

  onEditProfile() {
    this.router.navigateByUrl('user/edit-profile');
  }

  isCurrentUser() {
    return this.currentUser?.id && this.user?.id == this.currentUser?.id;
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
    this.userSocketService.removeListen(this.eventName);
  }
}
