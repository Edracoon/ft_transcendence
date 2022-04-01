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
import { Request, Response } from 'express';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const req: Request = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();

    if (!req.headers['authorization']) return false;

    const token: string = (req.headers['authorization'] as string).split(
      ' ',
    )[1];
    try {
      const payload = this.jwtService.verify(token);
      if (!payload) return false;
    } catch (e) {
      throw new HttpException('Token expired', HttpStatus.UNAUTHORIZED);
    }
    return super.canActivate(context);
  }
}
