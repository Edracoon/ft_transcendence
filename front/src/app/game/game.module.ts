import { NgModule } from '@angular/core';
import { GameRoutingModule } from './game-routing.module';
import { GameComponent } from './game.component';
import { SharedModule } from '../shared/shared.module';
import { PlayersComponent } from './players/players.component';
import { GameRecapComponent } from './game-recap/game-recap.component';
import { PongComponent } from './pong/pong.component';
import { SoloComponent } from './solo/solo.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RankedComponent } from './ranked/ranked.component';
import { AcceptComponent } from './accept/accept.component';
import { PlayersSoloComponent } from './players-solo/players-solo.component';
import { GameRecapSoloComponent } from './game-recap-solo/game-recap-solo.component';
import { DuelComponent } from './duel/duel.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [
    GameComponent,
    PlayersComponent,
    GameRecapComponent,
    PongComponent,
    SoloComponent,
    RankedComponent,
    AcceptComponent,
    PlayersSoloComponent,
    GameRecapSoloComponent,
    DuelComponent,
  ],
  imports: [
    SharedModule,
    GameRoutingModule,
    ReactiveFormsModule,
    FontAwesomeModule,
  ],
})
export class GameModule {}
