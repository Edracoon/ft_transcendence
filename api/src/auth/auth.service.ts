import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import * as base32 from 'hi-base32';
import * as Crypto from 'crypto';
import { catchError, firstValueFrom, map, throwError } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from 'unique-names-generator';
import { User } from 'src/database/entities/user.entity';
import { Setting } from 'src/database/entities/setting.entity';
import { Ladder } from 'src/database/entities/ladder.entity';
import { JwtDto } from 'src/dto/jwt.dto';
import { Achievement } from 'src/database/entities/achievement.entity';
import { getManager } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  login(req: Request, res: Response, code: string) {
    return this.httpService
      .post('https://api.intra.42.fr/oauth/token', {
        grant_type: 'authorization_code',
        client_id: process.env.FORTY_TWO_CLIENT_ID,
        client_secret: process.env.FORTY_TWO_SECRET,
        code: code,
        redirect_uri:
          'http://' + process.env.INF_HOST + ':' + process.env.INF_PORT + '/',
      })
      .pipe(
        map(async (ax_res: any) => {
          const data = ax_res.data;
          const { user, firstLog, mfa, accessToken, refreshToken } =
            await this.fortyTwoLogin(data);
          return { token: accessToken, firstLog, mfa };
        }),
        catchError((e) => {
          console.log('error : ', e);
          return throwError(() => e);
        }),
      );
  }

  async fortyTwoLogin(data: any) {
    const token_42_infos = await this.getFortyTwoTokenInfos(data.access_token);
    return firstValueFrom(
      this.userService.getUserInfos(token_42_infos.id).pipe(
        map(async (ax_res) => {
          let user: User = ax_res;
          let firstLog = false;
          let isLogged = true;

          if (!user) {
            const random_nickname = uniqueNamesGenerator({
              dictionaries: [adjectives, animals],
              separator: ' ',
              style: 'capital',
              length: 2,
            });

            let achievement: Achievement = await getManager().findOne(
              Achievement,
              1,
            );

            let newUser = new User(
              token_42_infos.id,
              random_nickname,
              this.userService.getRandomAvatar().avatar,
              [achievement],
            );
            firstLog = true;
            this.userService.createUser(newUser);
            user = newUser;
          } else if (user.setting.mfa) isLogged = false;

          let payload = new JwtDto();
          payload = {
            id: token_42_infos.id,
            refreshToken: data.refresh_token,
            isLogged,
          };

          const new_token = this.createJwt(payload, token_42_infos.expire_in);

          return {
            user,
            firstLog,
            mfa: user.setting.mfa,
            accessToken: new_token,
            refreshToken: data.refresh_token,
          };
        }),
        catchError((e: any) => {
          if (e && e.response && e.response.data)
            throw new HttpException(
              e.response.data
                ? e.response.data
                : 'Cannot get user informations from the database',
              e.response.status
                ? e.response.status
                : HttpStatus.INTERNAL_SERVER_ERROR,
            );
          throw new HttpException(
            'Cannot get user informations from the database',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
  }

  getFortyTwoTokenInfos(token: string) {
    const headers = { Authorization: `bearer ${token}` };
    return firstValueFrom(
      this.httpService
        .get('https://api.intra.42.fr/oauth/token/info', { headers })
        .pipe(
          map((res) => {
            const data = res.data;
            return {
              id: data.resource_owner_id,
              expire_in: data.expires_in_seconds,
            };
          }),
          catchError((e: any) => {
            if (e && e.response)
              throw new HttpException(
                e.response.data
                  ? e.response.data
                  : 'Cannot get token information from 42 API',
                e.response.status ? e.response.status : HttpStatus.BAD_GATEWAY,
              );
            else
              throw new HttpException(
                'Cannot get token information from 42 API',
                HttpStatus.BAD_GATEWAY,
              );
          }),
        ),
    );
  }

  createJwt(payload: any, expireIn: number) {
    return this.jwtService.sign(payload, { expiresIn: expireIn });
  }

  async refreshToken(req: Request, refreshToken: string) {
    return this.httpService
      .post('https://api.intra.42.fr/oauth/token', {
        client_id: process.env.FORTY_TWO_CLIENT_ID,
        client_secret: process.env.FORTY_TWO_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      })
      .pipe(
        map((ax_res) => {
          const data = ax_res.data;
          let payload = new JwtDto();
          payload = {
            id: this.userService.getIntraFromToken(req),
            refreshToken: data.refresh_token,
            isLogged: true,
          };
          const new_token = this.createJwt(payload, data.expires_in);
          return { token: new_token, refreshToken: data.refresh_token };
        }),
        catchError((e: any) => {
          if (e && e.response)
            throw new HttpException(
              e.response.data
                ? e.response.data
                : 'Cannot generate a new token from your refresh token',
              e.response.status ? e.response.status : HttpStatus.UNAUTHORIZED,
            );
          else
            throw new HttpException(
              'Cannot generate a new token from your refresh token',
              HttpStatus.UNAUTHORIZED,
            );
        }),
      );
  }

  /** Check token information and compare the date to verify token validity */
  isSignedIn(req: Request, res: Response): boolean {
    const auth: string = req.headers['authorization'];
    if (!auth) return false;
    const token: string = auth.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token);
      if (!payload) return false;
      if (!payload.isLogged) return false;
    } catch (e) {
      throw new HttpException('Token expired', HttpStatus.UNAUTHORIZED);
    }
    return true;
  }

  /** Two Factor Authentification Functions */
  generateSecret(data: string) {
    const hash = Crypto.createHash('md5').update(data).digest('hex');
    return { secret: base32.encode(hash).replace(/=/g, '') };
  }

  checkMfaCode(req: Request, code: number, secret: string) {
    const codeGen: number = this.generateCode(secret);
    const refreshToken: string =
      this.userService.getRefreshFromJwt(req).refreshToken;
    if (code == codeGen) {
      return this.refreshToken(req, refreshToken);
    }
    return { error: 'Bad code' };
  }

  generateCode(data: string) {
    let dynamicTruncationFn = (hmacValue) => {
      const offset = hmacValue[hmacValue.length - 1] & 0xf;

      return (
        ((hmacValue[offset] & 0x7f) << 24) |
        ((hmacValue[offset + 1] & 0xff) << 16) |
        ((hmacValue[offset + 2] & 0xff) << 8) |
        (hmacValue[offset + 3] & 0xff)
      );
    };

    let generatecode = (secret: string) => {
      let counter = Math.floor(Date.now() / 30000);
      const decodedSecret = base32.decode.asBytes(secret);
      const buffer = Buffer.alloc(8);
      for (let i = 0; i < 8; i++) {
        buffer[7 - i] = counter & 0xff;
        counter = counter >> 8;
      }
      const hmac = Crypto.createHmac('sha1', Buffer.from(decodedSecret));
      const hmacResult = hmac.update(buffer).digest();
      const code = dynamicTruncationFn(hmacResult);
      return code % 10 ** 6;
    };
    return generatecode(data);
  }

  // s
}
