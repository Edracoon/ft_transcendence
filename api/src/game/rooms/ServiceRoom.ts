import { Room, Client, ServerError } from 'colyseus';
import * as jwt from 'jsonwebtoken';
import { get } from 'httpie';
import { Session, API_INF_ENDPOINT } from './GameInfos';

let users: undefined | Map<string, Session> = undefined;

export class ServiceRoom extends Room {
  private client_mapping = new Map<Client, string>();

  dump_client(): void {
    console.log('<-----------------');
    this.client_mapping.forEach((val, key) => {
      console.log('CLIENT_ID ', key.sessionId, 'USER_ID ', val);
    });
    console.log('----------------->');
  }

  onCreate(options: any) {
    console.log('ServiceRoom -> OnCreate()');
    users = options.users;
  }

  async onAuth(client, options): Promise<boolean> {
    try {
      const token: string = options.authorization.split(' ')[1];
      jwt.verify(token, 'tr_secret_key');
      return true;
    } catch (e) {
      throw new ServerError(400, 'bad access token');
    }
  }

  async onJoin(client: Client, options: any) {
    console.log('ServiceRoom -> Client Joined');
    const token: string = options.authorization.split(' ')[1];
    const user = await get(API_INF_ENDPOINT + '/api/user', {
      headers: {
        authorization: 'bearer ' + token,
      },
    });

    const player = users.get(user.data.id);

    if (player === undefined) {
      users.set(user.data.id, new Session(user, client, 'IDLE'));
    } else {
      client.send('already-connected', {});
    }
    this.client_mapping.set(client, user.data.id);
  }

  onLeave(client: Client) {
    const deleted_id = this.client_mapping.get(client);
    this.client_mapping.delete(client);
    console.log('ServiceRoom -> Client left');
    let doNotDelete = false;
    this.client_mapping.forEach((val) => {
      /* If they are multiples client connected with the 
      same account, do not delete it from users, keep the
      user until there is only 1 client linked to it */
      if (val === deleted_id) doNotDelete = true;
    });
    if (!doNotDelete) users.delete(deleted_id);
  }

  onDispose() {
    console.log('ServiceRoom -> onDispose()');
  }
}
