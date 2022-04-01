import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './shared/not-found/not-found.component';
import { HomeComponent } from './shared/home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { LoggedAuthGuard } from './guards/logged-auth.guard';
import { MfaComponent } from './auth/mfa/mfa.component';
import { RulesComponent } from './shared/rules/rules.component';

const routes: Routes = [
  {
    path: 'chat',
    loadChildren: () => import('./chat/chat.module').then((m) => m.ChatModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'game',
    loadChildren: () => import('./game/game.module').then((m) => m.GameModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'watch',
    loadChildren: () =>
      import('./watch/watch.module').then((m) => m.WatchModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'user',
    loadChildren: () => import('./user/user.module').then((m) => m.UserModule),
    canActivate: [AuthGuard],
  },
  {
    path: '',
    pathMatch: 'full',
    component: LoginComponent,
    canActivate: [LoggedAuthGuard],
  },
  { path: 'two-factor-authentification', component: MfaComponent },
  {
    path: 'home',
    pathMatch: 'full',
    component: HomeComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'rules',
    pathMatch: 'full',
    component: RulesComponent,
    canActivate: [AuthGuard],
  },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
