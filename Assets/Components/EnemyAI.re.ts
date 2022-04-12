import * as RE from 'rogue-engine';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonBody from '../rogue_packages/rogue-cannon/Components/CannonBody.re';
import CannonShape from '../rogue_packages/rogue-cannon/Components/Shapes/CannonShape';
import CharacterController from './CharacterController.re';
import Animator from './Animator.re';
import { copyThreeV3 } from '../rogue_packages/rogue-cannon/Lib/RogueCannon';

const actions = {
  idle: "idle",
  run: "run",
  attack: "attack",
  death: "death"
};

export default class EnemyAI extends RE.Component {
  @RE.props.num() speed = 12;
  @RE.props.checkbox() isAttacking = false;
  isDead = false;

  engaging: THREE.Object3D | undefined;
  focus = new THREE.Vector3();
  focusCannon = new CANNON.Vec3();
  localDirection = new THREE.Vector3();

  private _attackStartPos = new THREE.Vector3();

  private _rigidbody: CannonBody;

  get rigidbody() {
    if (!this._rigidbody) {
      this._rigidbody = RE.getComponent(CannonBody, this.object3d) as CannonBody;
      this._rigidbody.onCollide(this.onCollide);
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

  get curAction() {
    return this.animator.activeAction;
  }

  onCollide = (event: {other: CANNON.Body, contact: CANNON.ContactEquation}) => {
    if (!this.isAttacking) return;
    const shape = event.contact.si.body === this.rigidbody?.body ? event.contact.si : event.contact.sj;

    if (shape.body !== this.rigidbody?.body) return;

    const otherBodyComponent = CannonBody.findByBody(event.other);
    const shapeComponent = CannonShape.findByShape(shape);

    const characterController = RE.getComponent(CharacterController);

    if (shapeComponent?.name === "AttackRange" && otherBodyComponent?.object3d === characterController?.object3d) {
      const playerController = RE.getComponent(CharacterController, otherBodyComponent?.object3d);
      !playerController?.isDead && playerController?.setDead();
    }
  }

  setDead() {
    this.isDead = true;
    this.animator.getAction(actions.death).clampWhenFinished = true;
    this.animator.mix(actions.death);
  }

  update() {
    if (!this.rigidbody) return;

    if (this.isDead) {
      this.rigidbody.body.velocity.x = 0;
      this.rigidbody.body.velocity.z = 0;
      return;
    }

    this.rigidbody.body.velocity.x = this.focusCannon.x;
    this.rigidbody.body.velocity.z = this.focusCannon.z;

    const characterController = RE.getComponent(CharacterController);

    if (characterController && !characterController.isDead && this.object3d.position.distanceTo(characterController.object3d.position) <= 15) {
      this.engaging = characterController.object3d;
    }

    if (characterController?.isDead) {
      this.engaging = undefined;
      this.isAttacking = false;
      this.focusCannon.setZero();
    }

    if (!this.isAttacking && this.focusCannon.length() === 0 && this.curAction !== this.animator.getAction(actions.idle)) {
      this.animator.mix(actions.idle);
    }

    if (!this.isAttacking && this.focusCannon.length() > 0 && this.curAction !== this.animator.getAction(actions.run)) {
      this.animator.mix(actions.run);
    }

    if (!this.engaging) return;

    if (this.isAttacking && this._attackStartPos.distanceTo(this.object3d.position) > 12) {
      this.focusCannon.setZero();
    }

    if (this.isAttacking && this.curAction !== this.animator.getAction(actions.attack)) {
      this.engage();
    }

    if (!this.isAttacking && this.engaging) {
      this.follow();
    }

    if (this.object3d.position.distanceTo(this.engaging.position) <= 8 && !this.isAttacking) {
      this.attack();
    }
  }

  engage() {
    if (!this.engaging) return;

    this.focus.set(
      this.engaging.position.x,
      this.object3d.position.y,
      this.engaging.position.z
    );

    this.object3d.lookAt(this.focus);
    this.rigidbody.setQuaternion(this.object3d.quaternion);
  }

  follow() {
    this.engage();

    this.object3d.getWorldDirection(this.localDirection);
    copyThreeV3(this.localDirection, this.focusCannon);
    this.focusCannon.scale(this.speed, this.focusCannon);
  }

  attack() {
    this.isAttacking = true;
    this.animator.mix(actions.idle);

    this.focusCannon.setZero();
    setTimeout(() => {
      this.animator.mix(actions.attack);

      this.object3d.getWorldDirection(this.localDirection);
      this._attackStartPos.copy(this.object3d.position);

      copyThreeV3(this.localDirection, this.focusCannon);
      this.focusCannon.scale(this.speed * 3, this.focusCannon);

      setTimeout(() => {
        this.isAttacking = false;
        this.focusCannon.setZero();
      }, 1200);
    }, 200);
  }
}

RE.registerComponent(EnemyAI);
