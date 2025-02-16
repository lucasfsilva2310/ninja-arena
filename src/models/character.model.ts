import { Ability } from "./ability.model";

export class Character {
  hp: number = 100;
  constructor(public name: string, public abilities: Ability[]) {}

  isAlive(): boolean {
    return this.hp > 0;
  }

  takeDamage(damage: number) {
    this.hp = Math.max(0, this.hp - damage);
  }
}
