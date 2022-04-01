import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { GlobalService } from '../../services/global.service';
import { UserService } from '../../services/user.service';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user';
import { SearchEvent } from '../search-user/search-user.component';
import { Scavenger } from '@wishtack/rx-scavenger';
import { GameService } from 'src/app/services/game.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  title?: string;
  user?: User;

  @ViewChild('navToggle') navToggle?: ElementRef;

  private _scavenger = new Scavenger(this);

  constructor(
    private globalService: GlobalService,
    private userService: UserService,
    private authService: AuthService,
    private GameService: GameService,
    private router: Router
  ) {
    this.user = this.userService.currentUser;
    this.userService.onUserChanged
      .pipe(this._scavenger.collect())
      .subscribe((user) => {
        this.user = user;
      });
    this.globalService.getTitle().subscribe((title) => (this.title = title));
  }

  intraObs!: Subscription;
  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        let btn: HTMLButtonElement = this.navToggle?.nativeElement;
        if (btn?.attributes.getNamedItem('aria-expanded')?.value == 'true')
          btn.click();
      }
    });
  }

  onLogout() {
    this.authService.logout();
  }

  onSearchEvent(searchEvent: SearchEvent) {
    this.router.navigateByUrl('/user/show/' + searchEvent.user.id);
  }

  onClickProfile() {
    this.router.navigateByUrl('/user/show/' + this.user?.id);
  }

  ngOnDestroy() {
    this._scavenger.unsubscribe();
  }
}
