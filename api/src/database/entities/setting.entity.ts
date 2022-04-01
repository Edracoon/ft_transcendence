import { Column, Entity, OneToOne, PrimaryColumn } from 'typeorm';

@Entity()
export class Setting {
  @PrimaryColumn()
  id: number;

  @Column({
    default: false,
  })
  mfa: boolean;

  @Column({
    default: '',
  })
  mfa_key: string;

  constructor(id: number) {
    this.id = id;
  }
}
