import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export type CollisionEvent = {body: CANNON.Body, target: CANNON.Body, contact: CANNON.ContactEquation};

let world: CANNON.World = new CANNON.World();

export function getWorld() {
  return world;
}

export function setWorld(newWorld: CANNON.World) {
  world = newWorld;
}

export function copyThreeV3(vector3: THREE.Vector3, target: CANNON.Vec3) {
  target.set(vector3.x, vector3.y, vector3.z);
}

export function copyThreeQuaternion(quaternion: THREE.Quaternion, target: CANNON.Quaternion) {
  const q = quaternion;
  target.set(q.x, q.y, q.z, q.w);
}

export function copyCannonV3(vector3: CANNON.Vec3, target: THREE.Vector3) {
  target.set(vector3.x, vector3.y, vector3.z);
}

export function copyCannonQuaternion(quaternion: CANNON.Quaternion, target: THREE.Quaternion) {
  const q = quaternion;
  target.set(q.x, q.y, q.z, q.w);
}
