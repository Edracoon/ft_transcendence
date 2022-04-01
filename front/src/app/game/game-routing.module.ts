import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameComponent } from './game.component';
import { SoloComponent } from './solo/solo.component';
import { PongComponent } from './pong/pong.component';
import { PlayersComponent } from './players/players.component';
import { GameRecapComponent } from './game-recap/game-recap.component';
import { RankedComponent } from './ranked/ranked.component';
import { AcceptComponent } from './accept/accept.component';
import { GameRecapSoloComponent } from './game-recap-solo/game-recap-solo.component';
import { DuelComponent } from './duel/duel.component';

const routes: Routes = [
  { path: 'solo', component: SoloComponent },
  { path: 'game-recap', component: GameRecapComponent },
  { path: 'game-recap-solo', component: GameRecapSoloComponent },
  { path: 'ranked', component: RankedComponent },
  { path: 'duel', component: DuelComponent },
  { path: 'play', component: PongComponent },
  { path: 'accept', component: AcceptComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GameRoutingModule {}
