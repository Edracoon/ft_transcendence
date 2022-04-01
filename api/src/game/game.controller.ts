import { UseGuards, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GameCategory } from 'src/database/entities/game.entity';
import { JwtGuard } from 'src/guards/jwt.guard';
import { GameService } from './game.service';
import { UserGateway } from '../user/user.gateway';
import { JwtMfaGuard } from 'src/guards/jwtMfa.guard';

@Controller('api/game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly userGateway: UserGateway,
  ) {}

  // @Get(':id')
  // @UseGuards(JwtGuard)
  // getGameInfo(@Param('id') id: number) {
  //   return this.gameService.getGame(id);
  // }

  @Post('create-game')
  @UseGuards(JwtGuard)
  createGame(
    @Body('category') status: GameCategory,
    @Body('winner') winner: number,
    @Body('loser') loser: number,
    @Body('score_winner') score_winner: number,
    @Body('score_loser') score_loser: number,
    // @Req() req: Request,
  ) {
    return this.gameService.createGame(
      status,
      score_winner,
      score_loser,
      winner,
      loser,
    );
  }

  @Get('ladder')
  @UseGuards(JwtMfaGuard)
  getLadder() {
    return this.gameService.getLadder();
  }
}
