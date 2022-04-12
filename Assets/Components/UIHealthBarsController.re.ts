import * as RE from 'rogue-engine';
import CharacterStatus from './CharacterStatus.re';

export default class UIHealthBarsController extends RE.Component {

  get healthBar1() {
    return document.querySelector("#health-bar-1 > div") as HTMLDivElement;
  }

  get healthBar2() {
    return document.querySelector("#health-bar-2 > div") as HTMLDivElement;
  }

  get player1Status() {
    return RE.getComponentByName("Player1") as CharacterStatus;
  }

  get player2Status() {
    return RE.getComponentByName("Player2") as CharacterStatus;
  }

  p1HP = 0;
  p2HP = 0;

  update() {
    const p1 = this.player1Status;
    const p2 = this.player2Status;

    if (p1.curHP !== this.p1HP) this.updateHealthbar(this.healthBar1, p1);
    if (p2.curHP !== this.p2HP) this.updateHealthbar(this.healthBar2, p2);

    this.p1HP = p1.curHP;
    this.p2HP = p2.curHP;
  }

  updateHealthbar(healthbar: HTMLDivElement, player: CharacterStatus) {
    healthbar.style.width = ((player.curHP * 100) / player.hp) + "%";
  } 
}

RE.registerComponent(UIHealthBarsController);
