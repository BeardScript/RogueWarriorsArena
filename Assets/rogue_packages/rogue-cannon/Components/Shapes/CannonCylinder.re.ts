import * as RE from 'rogue-engine';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonShape from './CannonShape';

export default class CannonCylinder extends CannonShape {
  shape: CANNON.Cylinder;

  @RE.props.num() radiusTopOffset = 1;
  @RE.props.num() radiusBottomOffset = 1;
  @RE.props.num() heightOffset = 1;
  @RE.props.num() segments = 100;

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

    this.shape = new CANNON.Cylinder(
      this.radiusTopOffset * this.worldScale.x,
      this.radiusBottomOffset * this.worldScale.x,
      this.heightOffset * this.worldScale.y,
      this.segments
    );

    this.shape.collisionResponse = this._collisionResponse;
  }
}

RE.registerComponent(CannonCylinder);
