import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { request, Request, Response } from 'express';

@Injectable()
export class JwtMfaGuard extends AuthGuard('jwt') {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const req: Request = context.switchToHttp().getRequest();
    const socket = context.switchToWs().getClient();
    let headers = req.headers;
    if (socket && socket.handshake) {
      headers = socket.handshake.headers;
    }
    if (!headers['authorization']) return false;
    const token: string = (headers['authorization'] as string).split(' ')[1];
    try {
      const payload = this.jwtService.verify(token);
      if (!payload) return false;
      if (!payload.isLogged) return false;
    } catch (e) {
      throw new HttpException('Token expired', HttpStatus.UNAUTHORIZED);
    }
    return super.canActivate(context);
  }
}
