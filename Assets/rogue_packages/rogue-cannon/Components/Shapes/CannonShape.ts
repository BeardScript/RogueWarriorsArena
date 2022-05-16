import * as RE from 'rogue-engine';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import CannonBody from '../CannonBody.re';

export default class CannonShape extends RE.Component {
  shape: CANNON.Shape;
  body: CANNON.Body | undefined;
  bodyComponent: CannonBody | undefined;

  localPos: THREE.Vector3 = new THREE.Vector3();
  worldPos = new THREE.Vector3();
  oldPos = new THREE.Vector3();

  localRot = new THREE.Quaternion();
  worldQuaternion = new THREE.Quaternion();

  private matrixA = new THREE.Matrix4();
  private matrixB = new THREE.Matrix4();
  private matrixC = new THREE.Matrix4();

  static findByShape(shape: CANNON.Shape) {
    let shapeComponent: undefined | CannonShape;

    RE.traverseComponents(component => {
      if (shapeComponent) return;

      if (component instanceof CannonShape && component.shape === shape) {
        shapeComponent = component;
      }
    });

    return shapeComponent;
  }

  awake() {
    this.createShape();
  }

  start() {
    if (!this.shape) return;

    this.bodyComponent = this.getBodyComponent(this.object3d);

    if (!this.bodyComponent) return;

    if (!this.bodyComponent.body) return;

    this.body = this.bodyComponent.body;

    const bodyIsShape = this.object3d === this.bodyComponent.object3d;

    this.object3d.getWorldPosition(this.worldPos);
    this.localPos.copy(this.worldPos);
    this.bodyComponent.object3d.updateWorldMatrix(true, true);
    this.bodyComponent.object3d.worldToLocal(this.localPos);

    let position = new CANNON.Vec3(
      this.localPos.x,
      this.localPos.y,
      this.localPos.z,
    );

    this.object3d.updateWorldMatrix(true, true);
    this.object3d.getWorldQuaternion(this.worldQuaternion);

    this.matrixA.makeRotationFromQuaternion(this.worldQuaternion);
    this.object3d.updateWorldMatrix(true, true);
    this.matrixB.copy(this.bodyComponent.object3d.matrixWorld).invert();
    this.matrixC.extractRotation(this.matrixB);
    this.matrixA.premultiply(this.matrixC);
    this.localRot.setFromRotationMatrix(this.matrixA);

    let rotation = new CANNON.Quaternion(
      this.localRot.x,
      this.localRot.y,
      this.localRot.z,
      this.localRot.w,
    );

    if (bodyIsShape) {
      this.body.addShape(this.shape);
    } else {
      this.body.addShape(this.shape, position, rotation);
    }
  }

  update() {
    if (!this.shape) return;
    if (!this.shape.body) return;
    if (this.shape.body.type === CANNON.BODY_TYPES.STATIC || this.shape.body.mass === 0) return

    const shapeIndex = this.shape.body?.shapes.indexOf(this.shape);
    
    if (shapeIndex === undefined) return;

    this.oldPos.copy(this.worldPos);
    this.object3d.getWorldPosition(this.worldPos);

    if (this.oldPos.equals(this.worldPos)) return;

    this.localPos.copy(this.worldPos);
    this.bodyComponent?.object3d.updateWorldMatrix(true, true);
    this.bodyComponent?.object3d.worldToLocal(this.localPos);

    this.shape.body?.shapeOffsets[shapeIndex].set(
      this.localPos.x,
      this.localPos.y,
      this.localPos.z
    );
    this.shape.updateBoundingSphereRadius();
    this.shape.body?.updateAABB();
  }

  onDisabled() {
    this.body?.removeShape(this.shape);
  }

  onBeforeObjectRemoved() {
    this.body?.removeShape(this.shape);
  }

  private getBodyComponent(object3d: THREE.Object3D): CannonBody | undefined {
    const bodyComponent = RE.getComponent(CannonBody, object3d);

    if (bodyComponent) {
      return bodyComponent;
    }

    if (!object3d.parent) return;

    return this.getBodyComponent(object3d.parent as THREE.Object3D);
  }

  protected createShape(): void {};
}
