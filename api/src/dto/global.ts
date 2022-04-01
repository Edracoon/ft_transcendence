export enum NotifType {
  BAN = 'BAN',
  MUTE = 'MUTE',
  UNBAN = 'UNBAN',
  UNMUTE = 'UNMUTE',
}

export class ChatNotif {
  type: NotifType;
  metadata: any;
  constructor(type: NotifType, metadate: any = undefined) {
    this.type = type;
    this.metadata = metadate;
  }
}
