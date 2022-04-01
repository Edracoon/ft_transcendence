import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtMfaGuard } from './guards/jwtMfa.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getAll() {
    return this.appService.getAll();
  }

  @Get('test')
  getTest() {
    return this.appService.getAchievement(1);
  }

  @Get('populate')
  populate() {
    return this.appService.populate();
  }

  @Get('truncate')
  truncate() {
    return this.appService.truncate();
  }
}
