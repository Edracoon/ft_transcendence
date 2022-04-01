export enum NotifType {
  BAN = 'BAN',
  MUTE = 'MUTE',
  UNBAN = 'UNBAN',
  UNMUTE = 'UNMUTE',
  ROOM = 'ROOM',
}

export interface ChatNotif {
  type: NotifType;
  metadata: any;
}
