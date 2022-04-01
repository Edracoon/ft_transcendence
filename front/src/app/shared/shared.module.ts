import { NgModule } from '@angular/core';
import { LoadingComponent } from './loading/loading.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { HeaderComponent } from './header/header.component';
import { NotificationComponent } from './notification/notification.component';
import { UserStatusComponent } from './user-status/user-status.component';
import { HomeComponent } from './home/home.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SearchUserComponent } from './search-user/search-user.component';
import { HighlightPipe } from '../pipes/highlight.pipe';
import { UserBadgeComponent } from './user-badge/user-badge.component';
import { BlockActionComponent } from './block-action/block-action.component';
import { AddFriendActionComponent } from './add-friend-action/add-friend-action.component';
import { HeaderLoginComponent } from './header-login/header-login.component';
import { LadderComponent } from './ladder/ladder.component';
import { HomeButtonsComponent } from './home-buttons/home-buttons.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { StatsComponent } from './stats/stats.component';
import { DmActionComponent } from './dm-action/dm-action.component';
import { DuelActionComponent } from './dual-action/duel-action.component';
import { GameStatusComponent } from './game-status/game-status.component';

@NgModule({
  declarations: [
    LoadingComponent,
    NotFoundComponent,
    HeaderComponent,
    NotificationComponent,
    UserStatusComponent,
    HomeComponent,
    SearchUserComponent,
    HighlightPipe,
    UserBadgeComponent,
    BlockActionComponent,
    AddFriendActionComponent,
    HeaderLoginComponent,
    LadderComponent,
    HomeButtonsComponent,
    StatsComponent,
    DmActionComponent,
    DuelActionComponent,
    GameStatusComponent,
  ],
  imports: [RouterModule, CommonModule, FormsModule, FontAwesomeModule],
  exports: [
    LoadingComponent,
    NotFoundComponent,
    HeaderComponent,
    NotificationComponent,
    UserStatusComponent,
    HomeComponent,
    CommonModule,
    FormsModule,
    RouterModule,
    SearchUserComponent,
    HighlightPipe,
    UserBadgeComponent,
    BlockActionComponent,
    AddFriendActionComponent,
    HeaderLoginComponent,
    LadderComponent,
    HomeButtonsComponent,
    StatsComponent,
    DmActionComponent,
    DuelActionComponent,
    GameStatusComponent,
  ],
})
export class SharedModule {}
