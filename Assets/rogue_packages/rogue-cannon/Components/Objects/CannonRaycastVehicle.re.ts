import * as RE from 'rogue-engine';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonBody from '../CannonBody.re';
import * as RogueCannon from '../../Lib/RogueCannon';

export default class CannonRaycastVehicle extends RE.Component {
  @RE.props.object3d() chasis: THREE.Object3D;
  @RE.props.num() mass = 500;
  @RE.props.num() suspensionStiffness = 30;
  @RE.props.num() suspensionRestLength = 0.1;
  @RE.props.num() frictionSlip = 0.7;
  @RE.props.num() dampingRelaxation: 2.3;
  @RE.props.num() dampingCompression: 4.4;
  @RE.props.num() maxSuspensionForce: 100000;
  @RE.props.num() rollInfluence: 0.01;
  @RE.props.num() maxSuspensionTravel = 0.2;
  @RE.props.num() customSlidingRotationalSpeed = -30;
  @RE.props.checkbox() useCustomSlidingRotationalSpeed = true;

  vehicle: CANNON.RaycastVehicle;

  start() {
    if (!RogueCannon.getWorld()) return;

    let body = RE.getComponent(CannonBody, this.object3d);

    if (!body) {
      body = new CannonBody("CarBody", this.object3d);
      body.mass = this.mass;
      RE.addComponent(body);
    }

    if (!this.chasis) return;

    const chassisBody = RE.getComponent(CannonBody, this.chasis);

    if (!(chassisBody instanceof CannonBody)) return;

    this.vehicle = new CANNON.RaycastVehicle({
      chassisBody: body.body,
      indexForwardAxis: 2,
      indexUpAxis: 1,
      indexRightAxis: 0,
    });

    this.vehicle.addToWorld(RogueCannon.getWorld());
  }
}

RE.registerComponent(CannonRaycastVehicle);
