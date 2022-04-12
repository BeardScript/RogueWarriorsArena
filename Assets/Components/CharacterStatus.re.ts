import * as RE from 'rogue-engine';
import * as CANNON from 'cannon-es';
import Animator from './Animator.re';
import CannonBody from '../rogue_packages/rogue-cannon/Components/CannonBody.re';

export default class CharacterStatus extends RE.Component {
  @RE.props.text() tag = "";
  @RE.props.num() hp = 100;
  @RE.props.num() curHP = 100;

  isDead = false;
  isDamaged = false;

  private _rigidbody: CannonBody;

  get rigidbody() {
    if (!this._rigidbody) {
      this._rigidbody = RE.getComponent(CannonBody, this.object3d) as CannonBody;
    }
    
    return this._rigidbody;
  }

  private _animator: Animator;

  get animator() {
    if (!this._animator) {
      this._animator = RE.getComponent(Animator, this.object3d) as Animator;
    }
    
    return this._animator;
  }

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
