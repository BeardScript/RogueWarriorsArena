import * as RE from 'rogue-engine';

export default class CharacterStatus extends RE.Component {
  @RE.props.text() tag = "";
  @RE.props.num() hp = 100;
  @RE.props.num() curHP = 100;

  isDead = false;
  isDamaged = false;

  applyDamage(amount: number) {
    this.curHP -= amount;

    if (this.curHP <= 0) {
      this.curHP = 0;
      this.isDead = true;
      return;
    }

    this.isDamaged = true;
    RE.onNextFrame(() => RE.onNextFrame(() => this.isDamaged = false));
  }
}

RE.registerComponent(CharacterStatus);
