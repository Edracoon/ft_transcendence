import { UserStatus } from '../database/entities/user.entity';

class UserSocket {
  idSockets: Set<string>;
  status: UserStatus;
  constructor(idSocket: string, status: UserStatus = UserStatus.ON) {
    this.status = status;
    this.idSockets = new Set([idSocket]);
  }
}

export class UserStore {
  userSockets: Map<number, UserSocket>;
  constructor() {
    this.userSockets = new Map();
  }
  addSocket(idUser: number, idSocket: string) {
    if (!this.userSockets.has(idUser))
      this.userSockets.set(idUser, new UserSocket(idSocket, UserStatus.ON));
    else this.userSockets.get(idUser).idSockets.add(idSocket);
  }

  delSocket(idUser: number, idSocket: string) {
    this.userSockets.get(idUser).idSockets.delete(idSocket);
    if (!this.userSockets.get(idUser).idSockets.size)
      this.userSockets.delete(idUser);
  }

  setStatus(id: number, status: UserStatus) {
    this.userSockets.get(id).status = status;
  }

  getStatus(id: number) {
    return this.userSockets.get(id)?.status || UserStatus.OFF;
  }

  getUser(id: number) {
    return this.userSockets.get(id);
  }
}
