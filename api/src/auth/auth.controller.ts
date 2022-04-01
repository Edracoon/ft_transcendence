import {
  Body,
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Redirect,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { userInfo } from 'os';
import { JwtGuard } from 'src/guards/jwt.guard';
import { JwtMfaGuard } from 'src/guards/jwtMfa.guard';

import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Query('code') code: string,
  ) {
    if (code) return this.authService.login(req, res, code);
    else
      throw new HttpException(
        'Bad Request : no code provided',
        HttpStatus.BAD_REQUEST,
      );
  }

  /** Check if user is signed */
  @Get('is-signed')
  isSignedIn(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.isSignedIn(req, res);
  }

  @Get('secret-mfa')
  @UseGuards(JwtGuard)
  getMfaSecret(@Query('data') data: string) {
    return this.authService.generateSecret(data);
  }

  @Get('check-code')
  @UseGuards(JwtGuard)
  checkMfaCode(
    @Req() req: Request,
    @Query('code') code: number,
    @Query('secret') secret: string,
  ) {
    return this.authService.checkMfaCode(req, code, secret);
  }

  @Post('refresh-token')
  refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshToken(req, refreshToken);
  }
}
