import * as RE from 'rogue-engine';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonShape from './CannonShape';

export default class CannonBox extends CannonShape {
  shape: CANNON.Box;
  @RE.props.vector3() sizeOffset: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  private _collisionResponse = true;
  @RE.props.checkbox()
  get collisionResponse() {
    return this._collisionResponse;
  };

  set collisionResponse(value: boolean) {
    this._collisionResponse = value;
    if (!this.shape) return;
    this.shape.collisionResponse = value;
  };

  worldScale = new THREE.Vector3();

  protected createShape() {
    this.object3d.getWorldScale(this.worldScale);

    this.shape = new CANNON.Box(
      new CANNON.Vec3(
        this.sizeOffset.x * (this.worldScale.x/2),
        this.sizeOffset.y * (this.worldScale.y/2),
        this.sizeOffset.z * (this.worldScale.z/2)
      )
    );

    this.shape.collisionResponse = this._collisionResponse;
  }
}

RE.registerComponent(CannonBox);
