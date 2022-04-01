import {
  Body,
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { join } from 'path';
import { JwtGuard } from 'src/guards/jwt.guard';
import { JwtMfaGuard } from 'src/guards/jwtMfa.guard';
import { UserUpdateDto } from 'src/dto/user-update.dto';
import { UserService } from './user.service';
import { Action, ActionCategory } from '../database/entities/action.entity';
import { UserGateway } from './user.gateway';

@Controller('api/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userGateway: UserGateway,
  ) {}

  @Get()
  @UseGuards(JwtMfaGuard)
  getUserFromToken(@Req() req: Request) {
    return this.userService.getUserFromToken(req);
  }

  @Get('search')
  @UseGuards(JwtMfaGuard)
  searchByNickname(@Query('nickname') nickname: string) {
    return this.userService.searchByNickname(nickname);
  }

  /** Get the intra id from the token */
  @Get('intra')
  @UseGuards(JwtGuard)
  getIntraFromToken(@Req() req: Request) {
    return this.userService.getIntraFromToken(req);
  }

  @Get('avatar')
  @UseGuards(JwtMfaGuard)
  getAvatar(@Req() req: Request) {
    return this.userService.getAvatar(req);
  }

  @Get('nickname')
  @UseGuards(JwtMfaGuard)
  getNickname(@Req() req: Request) {
    return this.userService.getNickname(req);
  }

  @Get('friends')
  @UseGuards(JwtMfaGuard)
  getFriends(@Req() req: Request) {
    return this.userService.getFriends(req);
  }

  // Action

  @Post('add-action')
  @UseGuards(JwtMfaGuard)
  async addAction(
    @Body('category') category: ActionCategory,
    @Body('recipient_id') recepient_id: number,
    @Body('metadata') metadata: any,
    @Req() req: Request,
  ) {
    let action = await this.userService.addAction(
      category,
      this.userService.getIntraFromToken(req),
      recepient_id,
      metadata,
    );
    if (action) {
      this.userGateway.emitTo(action.recipient.id, 'notif_user', '');
      this.userGateway.emitTo(action.sender.id, 'notif_user', '');
    }
  }

  @Post('del-action')
  @UseGuards(JwtMfaGuard)
  async delAction(@Body('action') action: Action) {
    await this.userService.delAction(action);
    this.userGateway.emitTo(action.recipient.id, 'notif_user', '');
    this.userGateway.emitTo(action.sender.id, 'notif_user', '');
  }

  @Post('accept-action')
  @UseGuards(JwtMfaGuard)
  async acceptAction(@Body('action') action: Action) {
    await this.userService.acceptAction(action);
    this.userGateway.emitTo(action.sender.id, 'notif_user', '');
    this.userGateway.emitTo(action.recipient.id, 'notif_user', '');

    if (action.category == ActionCategory.ADD_FRIEND) {
      this.userGateway.emitAll('notif_user_other', action.sender.id);
      this.userGateway.emitAll('notif_user_other', action.recipient.id);
    }
  }

  @Post('del-friend')
  @UseGuards(JwtMfaGuard)
  async delFriend(@Body('friend_id') friend_id: number, @Req() req: Request) {
    let user_id = this.userService.getIntraFromToken(req);
    await this.userService.delFriend(user_id, friend_id);
    this.userGateway.emitTo(user_id, 'notif_user', '');
    this.userGateway.emitTo(friend_id, 'notif_user', '');
    this.userGateway.emitAll('notif_user_other', user_id);
    this.userGateway.emitAll('notif_user_other', friend_id);
  }

  @Patch('update-action')
  @UseGuards(JwtMfaGuard)
  async updateAction(@Body('action') action: Action, @Req() req: Request) {
    let user_id = this.userService.getIntraFromToken(req);
    if (this.userService.checkAction(action.id, user_id))
      await this.userService.updateAction(action);
  }

  /** Use multer to upload a file in the config folder (upload)
   * Return informations about the file
   */
  @Post('upload')
  @UseGuards(JwtMfaGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      originalName: file.originalname,
      path:
        'http://' +
        process.env.APP_HOST +
        ':' +
        process.env.APP_PORT +
        '/api/user/' +
        file.path,
    };
  }

  /** Render a static file (here the avatars from upload folder) */
  @Get('upload/:filename')
  // @UseGuards(JwtMfaGuard)
  getUploadedFile(@Param('filename') filename: string, @Res() res: Response) {
    const file = join(process.cwd() + '/upload/', filename);
    return res.sendFile(file, (err) => {
      if (err) {
        res.send(err);
      }
    });
  }

  /** Generate a random avatar from an API */
  @Get('random-avatar')
  @UseGuards(JwtMfaGuard)
  getRandomAvatar() {
    return this.userService.getRandomAvatar();
  }

  /** Update user informations */
  @Patch(':id')
  @UseGuards(JwtMfaGuard)
  @Header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,PUT')
  async updateUser(
    @Req() req: Request,
    @Param('id') id: number,
    @Body() new_user: UserUpdateDto,
  ) {
    if (!new_user.nickname)
      throw new HttpException(
        'Nickname cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    else if (!new_user.avatar)
      throw new HttpException('Avatar cannot be empty', HttpStatus.BAD_REQUEST);
    let data = await this.userService.updateUser(req, id, new_user);
    return data;
  }

  @Get('refresh-token')
  @UseGuards(JwtGuard)
  getRefreshFromJwt(@Req() req: Request) {
    return this.userService.getRefreshFromJwt(req);
  }

  @Get('current-user')
  @UseGuards(JwtMfaGuard)
  getCurrentUser(@Req() req: Request) {
    return this.userService.getCurrentUser(req);
  }

  @Get('achievement')
  @UseGuards(JwtMfaGuard)
  getAchievements() {
    return this.userService.getAchievements();
  }

  /** Get user from his intra id */
  @Get(':id')
  @UseGuards(JwtMfaGuard)
  getUserInfos(@Param('id') id: number, @Req() req: Request) {
    return this.userService.getUser(id, req);
  }
}
