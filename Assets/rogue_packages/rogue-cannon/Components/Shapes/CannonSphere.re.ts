import * as RE from 'rogue-engine';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonShape from './CannonShape';

export default class CannonSphere extends CannonShape {
  @RE.props.num() radiusOffset: number = 1;

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

  shape: CANNON.Sphere;
  bbox: THREE.Box3;

  protected createShape() {
    const scale = this.object3d.scale;
    const maxSide = Math.max(scale.x, scale.y, scale.z);

    this.shape = new CANNON.Sphere(
      this.radiusOffset * (maxSide)
    );

    this.shape.collisionResponse = this._collisionResponse;
  }
}

RE.registerComponent(CannonSphere);
