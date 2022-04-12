import * as RE from 'rogue-engine';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonConstraint from './CannonConstraint';
import * as RogueCannon from '../../Lib/RogueCannon';

export default class CannonHingeConstraint extends CannonConstraint {
  constraint: CANNON.HingeConstraint;

  @RE.props.object3d() target: THREE.Object3D;
  @RE.props.vector3() pivotA: THREE.Vector3 = new THREE.Vector3(0.1, 0, 0);
  @RE.props.vector3() axisA: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  @RE.props.vector3() pivotB: THREE.Vector3 = new THREE.Vector3(-1, 0, 0);
  @RE.props.vector3() axisB: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  @RE.props.checkbox() collideConnected: boolean;
  @RE.props.num() maxForce: number = 1e6;

  protected createConstraint() {
    if (!this.target) throw "CannonHinge requires a target";

    const bodyA = this.getCannonBodyComponent(this.object3d).body;
    const bodyB = this.getCannonBodyComponent(this.target).body;

    this.constraint = new CANNON.HingeConstraint(bodyA, bodyB, {
      pivotA: new CANNON.Vec3(this.pivotA.x, this.pivotA.y, this.pivotA.z),
      axisA: new CANNON.Vec3(this.axisA.x, this.axisA.y, this.axisA.z),
      pivotB: new CANNON.Vec3(this.pivotB.x, this.pivotB.y, this.pivotB.z),
      axisB: new CANNON.Vec3(this.axisB.x, this.axisB.y, this.axisB.z),
      collideConnected: this.collideConnected,
      maxForce: this.maxForce,
    });

    RogueCannon.getWorld().addConstraint(this.constraint);
  }
}

RE.registerComponent(CannonHingeConstraint);
