import * as RE from 'rogue-engine';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonBody from '../rogue_packages/rogue-cannon/Components/CannonBody.re';
import Animator from './Animator.re';
import CharacterStatus from './CharacterStatus.re';

const actions = {
  idle: "idle",
  run: "run",
  jump: "jump",
  death: "death"
};

export default class CharacterController extends RE.Component {
  @RE.props.num() gamepadIndex = 0;
  @RE.props.num() fwdSpeed = 3;
  @RE.props.num() jumpSpeed = 5;

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

  private _characterStatus: CharacterStatus;

  get characterStatus() {
    if (!this._characterStatus) {
      this._characterStatus = RE.getComponent(CharacterStatus, this.object3d) as CharacterStatus;
    }
  
    return this._characterStatus;
  }

  get curAction() {
    return this.animator.activeAction;
  }

  isGrounded = false;
  isJumping = false;
  isDead = false;

  localFWD = new THREE.Vector3();
  appliedDirection = new THREE.Vector3();

  rayPos = new THREE.Vector3();
  raycaster = new THREE.Raycaster();

  private downDirection = new THREE.Vector3(0, -1, 0);
  private inputAngularVelocity = new CANNON.Vec3();
  private inputVelocity = new CANNON.Vec3();
  private inputDirection = new THREE.Vector3();

  get gamepad() {
    return RE.Input.gamepads[this.gamepadIndex];
  }

  isDamaged = false;

  update() {
    if (!this.rigidbody) return;

    if (!this.animator) return;

    if (!this.isDead && this.characterStatus.isDead) this.setDead();

    if (this.isDead || this.isDamaged) {
      this.rigidbody.body.velocity.x = 0;
      this.rigidbody.body.velocity.z = 0;
      return;
    }

    if (this.characterStatus.isDamaged && !this.isDamaged) {
      this.setDamaged();
    }

    this.object3d.getWorldDirection(this.localFWD);

    this.groundCheck();

    if (this.curAction && this.curAction.loop !== THREE.LoopRepeat && this.curAction !== this.getAction(actions.jump)) return;

    this.inputVelocity.setZero();

    this.setRotation();
    this.inputVelocity.z = this.inputDirection.length();

    if (this.inputVelocity.z > 0 && this.animator.getWeight(actions.run) === 0 && this.isGrounded && !this.isJumping) {
      this.animator.mix(actions.run, 0.1);
    }

    if (this.curAction === this.getAction(actions.run)) {
      this.getAction(actions.run).setEffectiveWeight(this.inputVelocity.z);
    }

    if (this.inputVelocity.z === 0 && this.animator.getWeight(actions.idle) === 0 && !this.isJumping) {
      this.animator.mix(actions.idle, 0.1);
    }

    this.inputVelocity.scale(this.fwdSpeed, this.inputVelocity);

    if (this.isGrounded && this.getJumpInput()) {
      this.jump();
    }

    this.translate();
  }

  getAction(actionName: string) {
    return this.animator.getAction(actionName);
  }

  setDead() {
    this.isDead = true;
    this.inputVelocity.setZero();
    this.getAction(actions.death).clampWhenFinished = true;
    this.animator.mix(actions.death, 0.1);
    this.animator.stop();
  }

  setDamaged() {
    this.isDamaged = true;
    this.inputVelocity.setZero();
    // this.getAction("damaged").clampWhenFinished = true;
    this.animator.mix("damaged", 0.1);
    // this.animator.stop();
    setTimeout(() => {
      // this.animator.resume();
      this.isDamaged = false;
      !this.isDead && this.animator.mix(actions.idle, 0.1);
    }, 300);
  }

  getHorizontal() {
    if (RE.Input.keyboard.getKeyPressed("KeyA")) return -1;
    if (RE.Input.keyboard.getKeyPressed("KeyD")) return 1;

    if (this.gamepad && Math.abs(this.gamepad.getAxis(0)) > 0) {
      return this.gamepad.getAxis(0);
    }

    return 0;
  }

  getVertical() {
    if (RE.Input.keyboard.getKeyPressed("KeyW")) return -1;
    if (RE.Input.keyboard.getKeyPressed("KeyS")) return 1;

    if (this.gamepad && Math.abs(this.gamepad.getAxis(1)) > 0) {
      return this.gamepad.getAxis(1);
    }

    return 0;
  }

  getJumpInput() {
    return RE.Input.keyboard.getKeyDown("Space") || this.gamepad && this.gamepad.getButtonDown(0);
  }

  translate() {
    this.rigidbody.body.angularVelocity.y = this.inputAngularVelocity.y;

    this.rigidbody.body.vectorToWorldFrame(this.inputVelocity, this.inputVelocity);

    this.rigidbody.body.velocity.x = this.inputVelocity.x;
    this.rigidbody.body.velocity.z = this.inputVelocity.z;
  }

  groundCheck() {
    this.rayPos.copy(this.object3d.position).addScalar(0.1);

    this.raycaster.set(this.rayPos, this.downDirection);
    this.raycaster.far = 0.6;
    const targets = RE.getComponents(CannonBody).filter(comp => comp.object3d !== this.object3d).map(comp => comp.object3d);

    if (targets) {
      let intersections = this.raycaster.intersectObjects(targets, true);

      if (intersections.length === 0) {
        this.rayPos.addScaledVector(this.localFWD, 0.7);
        this.raycaster.set(this.rayPos, this.downDirection)

        intersections = this.raycaster.intersectObjects(targets, true);
      }

      if (intersections.length === 0) {
        this.rayPos.addScaledVector(this.localFWD, -0.7);
        this.raycaster.set(this.rayPos, this.downDirection)

        intersections = this.raycaster.intersectObjects(targets, true);
      }

      if (intersections.length > 0) {
        this.isGrounded = true;
        this.isJumping = false;
      } else {
        this.isGrounded = false;
      }
    }
  }

  jump() {
    this.getAction(actions.jump).clampWhenFinished = true;
    this.animator.mix(actions.jump, 0.05);
    this.isJumping = true;

    this.rigidbody.body.position.y += 0.6;
    this.rigidbody.body.velocity.y = this.jumpSpeed;
  }

  setRotation() {
    const hAxis = this.getHorizontal();
    const vAxis = this.getVertical();

    this.inputDirection.set(hAxis, 0, vAxis);
    this.inputDirection.length() > 1 && this.inputDirection.normalize();

    this.appliedDirection.copy(this.object3d.position).add(this.inputDirection);
    if (this.inputDirection.length() > 0) this.object3d.lookAt(this.appliedDirection);

    this.rigidbody.setQuaternion(this.object3d.quaternion);
  }
}

RE.registerComponent(CharacterController);
