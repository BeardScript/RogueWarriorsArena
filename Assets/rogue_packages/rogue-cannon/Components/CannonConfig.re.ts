import * as RE from 'rogue-engine';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import * as RogueCannon from '../Lib/RogueCannon';
import CannonBody from './CannonBody.re';

export default class CannonConfig extends RE.Component {
  private _defaultFriction = 0.01;
  private _defaultRestitution = 0;

  @RE.props.num() maxSubSteps: number = 1;

  @RE.props.num()
  get defaultFriction() {
    return this._defaultFriction;
  }

  set defaultFriction(value: number) {
    this._defaultFriction = value;
    RogueCannon.getWorld().defaultContactMaterial.friction = value;
  }

  @RE.props.num() 
  get defaultRestitution() {
    return this._defaultRestitution;
  }

  set defaultRestitution(value: number) {
    this._defaultRestitution = value;
    RogueCannon.getWorld().defaultContactMaterial.restitution = value;
  }

  @RE.props.vector3() gravity: THREE.Vector3 = new THREE.Vector3(0, -9.82, 0);

  private contacts: CANNON.ContactEquation[] = [];
  // At the index of the body.id we hold the CannonBody with which body is colliding.
  // private activeCollisions: (CANNON.ContactEquation[])[] = []; 
  private activeCollisions: {[id: string]: boolean} = {};

  awake() {
    RogueCannon.setWorld(new CANNON.World());
    RogueCannon.getWorld().gravity.set(this.gravity.x, this.gravity.y, this.gravity.z);
    RogueCannon.getWorld().broadphase = new CANNON.NaiveBroadphase();
    RogueCannon.getWorld().defaultContactMaterial.friction = this.defaultFriction;
    RogueCannon.getWorld().defaultContactMaterial.restitution = this.defaultRestitution;
  }

  beforeUpdate() {
    RogueCannon.getWorld().step(RE.Runtime.deltaTime, RE.Runtime.deltaTime, this.maxSubSteps || 1);
  }

  afterUpdate() {
    this.checkCollisions();
  }

  checkCollisions() {
    const contacts = RogueCannon.getWorld().contacts;

    const newContacts: CANNON.ContactEquation[] = [];

    contacts.forEach(contact => {
      newContacts[contact.id] = contact;

      const key1 = contact.bi.id + "_" + contact.bj.id;
      const key2 = contact.bj.id + "_" + contact.bi.id;

      const key1Collision = this.activeCollisions[key1];
      const key2Collision = this.activeCollisions[key2];

      if (!this.contacts[contact.id] && !key1Collision && !key2Collision) {
        this.activeCollisions[key1] = true;
        this.activeCollisions[key2] = true;
        this.sendNewCollisionEvents(contact);
      }
    });

    this.contacts.forEach(contact => {

      const key1 = contact.bi.id + "_" + contact.bj.id;
      const key2 = contact.bj.id + "_" + contact.bi.id;

      const foundActiveCollision = this.findActiveCollision(newContacts, contact);

      const newContact = newContacts[contact.id];

      if ((newContact && newContact.enabled) || foundActiveCollision) {
        this.sendOnCollisionStayEvents(contact);
      }

      if ((!newContact || (newContact && !newContact.enabled)) && !foundActiveCollision) {
        this.activeCollisions[key1] = false;
        this.activeCollisions[key2] = false;
        this.sendOnCollisionExitEvents(contact);
      }
    });

    this.contacts = newContacts;
  }

  private findActiveCollision(contactList: CANNON.ContactEquation[], sample: CANNON.ContactEquation) {
    return contactList.find(contact => {
      if (!contact || !contact.enabled) return false;
      if (contact.bi === sample.bi && contact.bj === sample.bj) return true;
      if (contact.bi === sample.bj && contact.bj === sample.bi) return true;

      return false;
    });
  }

  private sendOnCollisionStayEvents(contact: CANNON.ContactEquation) {
    const bodyA = CannonBody.findByBody(contact.bi);
    const bodyB = CannonBody.findByBody(contact.bj);

    if (!bodyB || !bodyA) return;

    bodyA.onCollisionStayListeners.forEach(cb => {
      cb({other: bodyB, contact});
    });

    bodyB.onCollisionStayListeners.forEach(cb => {
      cb({other: bodyA, contact});
    });
  }

  private sendOnCollisionExitEvents(contact: CANNON.ContactEquation) {
    const bodyA = CannonBody.findByBody(contact.bi);
    const bodyB = CannonBody.findByBody(contact.bj);

    if (!bodyB || !bodyA) return;

    bodyA.onCollisionExitListeners.forEach(cb => {
      cb({other: bodyB, contact});
    });

    bodyB.onCollisionExitListeners.forEach(cb => {
      cb({other: bodyA, contact});
    });
  }

  private sendNewCollisionEvents(contact: CANNON.ContactEquation) {
    const bodyA = CannonBody.findByBody(contact.bi);
    const bodyB = CannonBody.findByBody(contact.bj);

    if (!bodyB || !bodyA) return;

    bodyA.onCollisionEnterListeners.forEach(cb => {
      cb({other: bodyB, contact});
    });

    bodyB.onCollisionEnterListeners.forEach(cb => {
      cb({other: bodyA, contact});
    });
  }
}

RE.registerComponent( CannonConfig );
