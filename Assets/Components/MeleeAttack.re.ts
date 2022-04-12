import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import * as RE from 'rogue-engine';
import Animator from './Animator.re';
import CannonShape from '../rogue_packages/rogue-cannon/Components/Shapes/CannonShape';
import CannonBody from '../rogue_packages/rogue-cannon/Components/CannonBody.re';
import CharacterController from './CharacterController.re';
import CharacterStatus from './CharacterStatus.re';

export default class MeleeAttack extends RE.Component {
  @RE.props.prefab() attackPrefab: RE.Prefab;
  @RE.props.object3d() origin: THREE.Object3D;
  @RE.props.select() selectedAction = 0;
  @RE.props.num() damage = 10;

  isAttacking = false;

  get selectedActionOptions() {
    this.animator.mixer;
    return Object.keys(this.animator.actions);
  }

  get actionName() {
    return this.selectedActionOptions[this.selectedAction];
  }

  localFWD = new THREE.Vector3();
  impulse = new CANNON.Vec3();
  attack: THREE.Object3D;

  private _animator: Animator;

  get animator() {
    if (!this._animator) {
      this._animator = RE.getComponent(Animator, this.object3d) as Animator;
    }
  
    return this._animator;
  }

  private _characterController: CharacterController;

  get characterController() {
    if (!this._characterController) {
      this._characterController = RE.getComponent(CharacterController, this.object3d) as CharacterController;
    }
  
    return this._characterController;
  }

  private _characterStatus: CharacterStatus;

  get characterStatus() {
    if (!this._characterStatus) {
      this._characterStatus = RE.getComponent(CharacterStatus, this.object3d) as CharacterStatus;
    }
  
    return this._characterStatus;
  }

  private _rigidbody: CannonBody;

  get rigidbody() {
    if (!this._rigidbody) {
      this._rigidbody = RE.getComponent(CannonBody, this.object3d) as CannonBody;
    }
    
    return this._rigidbody;
  }

  private _attackBody: CannonBody;

  get attackBody() {
    if (!this._attackBody) {
      this._attackBody = RE.getComponent(CannonBody, this.attack) as CannonBody;
      this._attackBody.onCollisionEnter(this.onCollisionEnter);
    }

    return this._attackBody;
  }

  get gamepad() {
    return this.characterController.gamepad;
  }

  disableColliders() {
    this.attackBody.body.shapes.forEach(shape => {
      (CannonShape.findByShape(shape) as CannonShape).enabled = false;
    });
  }

  enableColliders() {
    this.attackBody.body.shapes.forEach(shape => {
      (CannonShape.findByShape(shape) as CannonShape).enabled = true;
    });
  }

  getMeleeInput() {
    return RE.Input.keyboard.getKeyDown("KeyF") || this.gamepad && this.gamepad.getButtonDown(2);
  }

  onCollisionEnter = (event: {other: CannonBody, contact: CANNON.ContactEquation}) => {
    const characterStatus = RE.getComponent(CharacterStatus, event.other.object3d);
    if (characterStatus === this.characterStatus) return;
    !characterStatus?.isDead && characterStatus?.applyDamage(this.damage);
  }

  start() {
    this.attack = this.attackPrefab.instantiate();
    this.attackBody.enabled = false;
  }

  worldPos = new THREE.Vector3();
  worldQuaternion = new THREE.Quaternion();

  update() {
    if (!this.animator.isActive) return;
    if (!this.attack) return;

    this.updateColliderTransform();

    this.object3d.getWorldDirection(this.localFWD);

    if (this.animator.activeAction !== this.animator.getAction(this.actionName) && this.attackBody.enabled) {
      this.attackBody.enabled = false;
    }

    if (this.getMeleeInput() && !this.isAttacking) {
      this.isAttacking = true;
      this.animator.mix(this.actionName, 0.1, true);

      this.updateColliderTransform();

      this.attackBody.enabled = true;

      setTimeout(() => {
        this.isAttacking = false;
        this.attackBody.enabled = false;
      }, 250);
    }

    if (this.animator.activeAction === this.animator.getAction(this.actionName)) {
      this.rigidbody.body.velocity.x = this.localFWD.x;
      this.rigidbody.body.velocity.z = this.localFWD.z;
    }
  }

  private updateColliderTransform() {
    this.origin.getWorldPosition(this.worldPos);
    this.attackBody.setPosition(this.worldPos);

    this.origin.getWorldQuaternion(this.worldQuaternion);
    this.attackBody.setQuaternion(this.worldQuaternion);
  }
}

RE.registerComponent(MeleeAttack);
