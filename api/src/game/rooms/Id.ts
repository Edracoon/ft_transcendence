import { Schema, type } from "@colyseus/schema";

export class Id extends Schema {
  constructor() {
    super();
    this.idRight = 0;
    this.idLeft = 0;
  }
  @type("number") public idLeft: number = 0;
  @type("number") public idRight: number = 0;
}
