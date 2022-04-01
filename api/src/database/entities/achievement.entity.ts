import {
  Column,
  Entity,
  getManager,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { faker } from '@faker-js/faker';
import { Game, GameCategory } from './game.entity';
import { User } from './user.entity';

@Entity()
export class Achievement {
  @PrimaryColumn()
  id: number;

  @Column({
    length: 100,
  })
  title: string;

  @Column()
  image: string;

  @Column({
    length: 255,
  })
  description: string;

  @Column({
    length: 255,
  })
  condition: string;

  fct?: (game?: Game, winner?: User) => boolean;

  constructor(
    id: number,
    title: string,
    image: string,
    description: string,
    condition: string,
  ) {
    this.id = id;
    this.title = title;
    this.image = image;
    this.description = description;
    this.condition = condition;
  }
}

export const listAchiev: Achievement[] = [
  {
    id: 1,
    title: 'Welcome',
    image:
      'https://media.istockphoto.com/photos/neon-script-hello-lamp-picture-id1291410993?k=20&m=1291410993&s=612x612&w=0&h=vX-Fm_suI7iACLoVIA472XU2CKPxlaXexw550yTT5fo=',
    description: 'The most difficult is still not having it',
    condition: 'Log on website',
    fct: (game: Game, winner: User) => true,
  },
  {
    id: 2,
    title: 'Perfect Game',
    image:
      'https://media.istockphoto.com/photos/silhouette-of-businessman-holding-target-board-on-the-top-of-mountain-picture-id1283030328?k=20&m=1283030328&s=612x612&w=0&h=9fsfZMYgywbT4IOg0HdSNL2a710gGiY4kmYJS0ivP7s=',
    description: 'Thank, for tutorial',
    condition: 'Win a game in rank with a score of 11-0',
    fct: (game: Game, winner: User) =>
      game.category == GameCategory.RANKED &&
      game.score_winner == 11 &&
      !game.score_loser,
  },
  {
    id: 3,
    title: 'Tryhard is back',
    image:
      'https://media.istockphoto.com/photos/success-in-the-asphalt-road-picture-id1299174533?k=20&m=1299174533&s=612x612&w=0&h=n8Ku5aQORT4k8t6zGV-DccTKoQgAsrrGMkM_nUpzhGs=',
    description: 'You win a ranked',
    condition: 'Win a game in rank',
    fct: (game: Game, winner: User) => game.category == GameCategory.RANKED,
  },
  {
    id: 4,
    title: 'At the top',
    image:
      'https://www.incimages.com/uploaded_files/image/1920x1080/getty_513124404_200012492000928072_353033.jpg',
    description: 'You are the 1st GG, but do you have a life',
    condition: 'Be at the top of the ladder after 2 games at least',
    fct: (game: Game, winner: User) =>
      game.category == GameCategory.RANKED && winner.ladder.position == 1,
  },
  {
    id: 5,
    title: 'A war between friends',
    image:
      'https://media.istockphoto.com/photos/the-young-sports-men-tennis-players-in-play-on-black-arena-background-picture-id966182168?k=20&m=966182168&s=612x612&w=0&h=YuTtMO7BlY0ordkNfVJhxJKi3PUG7FFR44vLBghEVCI=',
    description: 'A war is never friendly',
    condition: 'Challenge a friend and win',
    fct: (game: Game, winner: User) =>
      game.category == GameCategory.DUAL &&
      Boolean(winner.friends.find((user) => user.id == game.loser.id)),
  },
  {
    id: 6,
    title: 'The faithful',
    image:
      'https://media.istockphoto.com/vectors/golden-cup-trophy-with-red-ribbon-and-winner-text-vector-illustration-vector-id1193034301?k=20&m=1193034301&s=612x612&w=0&h=EyCmYEt6p0BJeWQj0zWIBsb2vH4EvmOSBp1SjtUYbMk=',
    description: 'One of us',
    condition: 'Win 100 games',
    fct: (game: Game, winner: User) =>
      game.category == GameCategory.RANKED && winner.victories.length == 99,
  },
];
