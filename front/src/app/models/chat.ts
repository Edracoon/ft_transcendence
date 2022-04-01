import { User, UserTest } from './user';

export enum ChatScope {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PROTECTED = 'PROTECTED',
}

export enum RoomType {
  CHANNEL = 'CHANNEL',
  DIRECT = 'DIRECT',
}

export enum RoomRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

export interface Message {
  id?: number;
  text: string;
  date: Date;
  user?: User;
}

export interface DataSocket {
  room: string;
  message: string;
}

export interface Config {
  id?: number;
  name: string;
  topic: string;
  scope: ChatScope;
  password?: string;
}

export interface RoomToDB {
  id?: number;
  type: RoomType;
  config?: number;
  users?: User[];
  messages?: Message[];
}

export interface UserRoom {
  user: User;
  role: RoomRole;
  room?: Room;
  id?: number;
  ban?: Date;
  mute?: Date;
  blocked?: boolean;
  isJoin?: boolean;
}

export interface Room {
  id?: number;
  type: RoomType;
  config?: Config;
  users?: User[];
  messages?: Message[];
  isJoin?: boolean;
  nbUsers?: number;
  usersRoom?: UserRoom[];
}

// action
