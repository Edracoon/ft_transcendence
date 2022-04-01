import { Room, Client, matchMaker, ServerError } from 'colyseus';
import { get } from 'httpie';
import * as jwt from 'jsonwebtoken';
import { Session, API_INF_ENDPOINT } from './GameInfos';

interface MatchGroup {
  joinedClients: ClientInfo[];
  ready: boolean;
  averageRank: number;
}

interface ClientInfo {
  client: Client;
  waitingTime: number;
  group?: MatchGroup;
  rank?: number;
  rankRange?: number;
  confirmed: boolean;
  data?: any;
}

let users: undefined | Map<string, Session> = undefined;
let rooms: undefined | Map<string, Array<string>> = undefined;

export class MatchMakingRoom extends Room {
  // List of clients in the 'queue' MatchMaking
  AllClients: ClientInfo[] = [];

  private client_mapping = new Map<Client, string>();

  // Groups made by the MatchMaking algo that we want
  groups: MatchGroup[] = [];

  constructor() {
    super();
  }

  async onAuth(client: Client, options): Promise<boolean> {
    try {
      const token: string = options.authorization.split(' ')[1];
      jwt.verify(token, 'tr_secret_key');
      return true;
    } catch (e) {
      throw new ServerError(400, 'bad access token');
    }
  }

  onCreate(options: any) {
    users = options.users;
    rooms = options.rooms;
    this.setSimulationInterval(() => this.makeGroups(), 500);
  }

  async onJoin(client: Client, options: any) {
    console.log('New Client Joined MatchMakingRoom ! ', client.sessionId);
    const token: string = options.authorization.split(' ')[1];
    const user = await get(API_INF_ENDPOINT + '/api/user', {
      headers: {
        authorization: 'bearer ' + token,
      },
    });
    /* cancel mathmakin */
    this.onMessage('cancel', (client) => {
      const client_id = this.client_mapping.get(client);

      const player = users.get(client_id);
      if (player) {
        player.setState('IDLE');
        client.leave();
      }
    });
    const player = users.get(user.data.id);

    /* Player is IDLE, OK */
    if (player && player.stateValue === 'IDLE') {
      player.setState('WAITING_RANKED');
      const newClient = {
        client: client,
        waitingTime: 0,
        confirmed: false,
        rankRange: 0,
        data: user.data,
        rank: user.data.ladder.points,
      };
      this.AllClients.push(newClient);
      this.client_mapping.set(client, user.data.id);

      /* Player NOT IDLE, callback on stateValue */
    } else if (player) {
      const current_state = player.stateValue;
      if (current_state === 'IN_DUEL' || current_state === 'IN_RANKED') {
        player.client.send('state_incompatible', {
          state: current_state,
          roomId: player.roomId,
          sessionId: player.sessionId,
        });
      } else if (current_state === 'WAITING_DUEL') {
        player.client.send('state_incompatible', {
          state: 'WAITING_DUEL',
        });
        client.leave();
      } else if (current_state === 'WAITING_RANKED') {
        // if 2 tab for one user -> we destroy the previous client 'matchmaking'
        // to replace him by the new one then we need to send him the state 'WAITING_RANKED'
        const curr_player = this.AllClients.find(
          (cli) => cli.data.id === user.data.id,
        );
        if (curr_player) {
          curr_player.client.leave();
          this.client_mapping.delete(curr_player.client);
          this.client_mapping.set(client, curr_player.data.id);
          curr_player.client = client;
        }
      }
    } else {
      client.error(4042, 'You must connect to serviceRoom first.');
      return client.leave();
    }
  }

  createGroup() {
    const group: MatchGroup = {
      joinedClients: [],
      ready: false,
      averageRank: 0,
    };
    this.groups.push(group);
    return group;
  }

  makeGroups() {
    // Reset all groups to initialize a new pool and reset everything
    this.groups = [];

    let currentGroup: MatchGroup = this.createGroup();
    /* === Check for every client => matchable with rank and waitingTime === */
    for (let i = 0; i < this.AllClients.length; i++) {
      const client = this.AllClients[i];

      if (client.group && client.group.ready === true) continue;

      // Increment waiting time
      client.waitingTime += this.clock.deltaTime;

      // Skip clients that are already in a ready group (full group)

      // Everytime a client has waited more than 5 seconds,
      // we increment rankRange to find match eventually
      if (client.waitingTime > 3000) {
        client.rankRange += 50;
        client.waitingTime = 0;
      }

      // Handle Rank in groups
      if (currentGroup.averageRank > 0) {
      }

      // Add client to group and add group to client
      client.group = currentGroup;
      currentGroup.joinedClients.push(client);

      // We want to match 2 clients so length must be 2
      if (currentGroup.joinedClients.length === 2) {
        const rank1 = currentGroup.joinedClients[0].rank;
        const rank2 = currentGroup.joinedClients[1].rank;
        const GroupRankDiff = rank1 > rank2 ? rank1 - rank2 : rank2 - rank1;
        if (client.rankRange > GroupRankDiff) {
          currentGroup.ready = true;
          currentGroup = this.createGroup();
        }
      }
    }
    /*
     ** Now that this.groups is filled
     ** Time to check if we can create GameRooms
     ** For our clients that we matched
     */

    this.createRoomsForReadyGroups();
  }

  /* Make it async to use await and be sure the room is created before its use */
  async createRoomsForReadyGroups() {
    this.groups.map(async (group) => {
      if (group.ready) {
        const s = new Array<string>();
        const newRoom = await matchMaker.createRoom('gameRoom', {
          p1: group.joinedClients[0].data,
          p2: group.joinedClients[1].data,
          gameMode: 'RANKED',
          customisation: { ballSpeed: 1, ballColor: '#ffffff' },
        });
        group.joinedClients.map(async (client) => {
          const reservation = await matchMaker.reserveSeatFor(newRoom, {
            self: client,
          });
          client.client.send('seat', reservation);
          client.client.leave();
          const player = users.get(client.data.id);
          if (player) {
            player.setState('IN_ACCEPT');
            player.roomId = newRoom.roomId;
            player.sessionId = reservation.sessionId;
          }
          s.push(reservation.sessionId);
        });
        rooms.set(newRoom.roomId, s);
      }
    });
  }

  onLeave(client: Client) {
    const index = this.AllClients.findIndex((cli) => cli.client === client);
    if (index !== -1) this.AllClients.splice(index, 1);
    console.log('MatchMakingRoom -> Client left ! ', client.sessionId);

    const player = this.client_mapping.get(client);
    this.client_mapping.forEach((val, key) => {
      /* If they are multiples client connected with the 
      same account, do not delete it from users, keep the
      user until there is only 1 client linked to it */
      if (val === player) {
        if (key === client) {
          this.client_mapping.delete(client);
        }
      }
    });
  }

  onDispose() {
    console.log('MatchMakingRoom -> disposing...');
  }
}
