import * as RE from 'rogue-engine';
import * as THREE from 'three';

export default class Animator extends RE.Component {
  @RE.props.list.animation() animations: THREE.AnimationClip[] = [];

  private _curAnimations: THREE.AnimationClip[] = [];

  @RE.props.data()
  data: any[] = [];

  private animationsHaveChanged() {
    if (this._curAnimations.length !== this.animations.length) return true;

    for (let i = 0; i < this._curAnimations.length; i++) {
      if (this._curAnimations[i] !== this.animations[i]) return true;
    }

    return false;
  }

  private updateConfigs() {
    const newConfigs: any[] = [];

    for (let i = 0; i < this.animations.length; i++) {
      if (this.data[i]) {
        newConfigs[i] = this.data[i];
        continue;
      }

      newConfigs[i] = {
        actionName: i.toString(),
        playOnce: false,
        maxWeight: 1,
        duration: 1,
        speed: 1,
      };
    }

    this._curAnimations = this.animations.slice();

    this.data.splice(0);
    newConfigs.forEach(config => this.data.push(config));

    // this.activeAction && this.activeAction.reset();

    this._mixer = this._mixer = new THREE.AnimationMixer(this.object3d);
    this.animations.forEach((clip, i) => {
      const action = this._mixer.clipAction(clip);
      clip.name = this.data[i].actionName;
      this.data[i].playOnce && action.setLoop(THREE.LoopOnce, 0);
      this.actions[this.data[i].actionName] = {action, config: this.data[i]};
    });
  }

  private _selected = 0;

  @RE.props.select()
  get selected() {
    this.selectedOptions.splice(0, this.selectedOptions.length, ...this.animations.map((_, i) => i.toString() ));
    this.isReady && this.animationsHaveChanged() && this.updateConfigs();

    return this._selected;
  }

  editorUpdate: {stop: () => void} | undefined;

  set selected(value: number) {
    this._selected = value;
    this.updateAnimationConfigInputs();
    // this.activeAction && this.activeAction.reset();
    this.animationsHaveChanged() && this.updateConfigs();
    if (this.playLabel === "Stop" && !RE.Runtime.isRunning) {
      this.playAction();
    }
  }

  private updateAnimationConfigInputs() {
    this.data = this.data;
    const activeConfig = this.data[this._selected];
    this.actionName = activeConfig.actionName;
    this.playOnce = activeConfig.playOnce;
    this.duration = activeConfig.duration;
    this.speed = activeConfig.speed;
  }

  selectedOptions: string[] = this.animations.map((elem, i) => i.toString() );

  @RE.props.text()
  get actionName() {
    const activeConfig = this.data[this.selected];

    return activeConfig ? activeConfig.actionName : "";
  }

  set actionName(value: string) {
    if (this.selected < 0) return;
    const activeConfig = this.data[this.selected];

    if (!activeConfig) return;

    activeConfig.actionName = value;
  }

  @RE.props.checkbox()
  get playOnce() {
    const activeConfig = this.data[this.selected];

    return activeConfig ? activeConfig.playOnce : false;
  }

  set playOnce(value: boolean) {
    if (this.selected < 0) return;
    const activeConfig = this.data[this.selected];

    if (!activeConfig) return;

    activeConfig.playOnce = value;
  }

  @RE.props.num()
  get duration() {
    const activeConfig = this.data[this.selected];

    return activeConfig ? activeConfig.duration : 1;
  }

  set duration(value: number) {
    if (this.selected < 0) return;
    const activeConfig = this.data[this.selected];

    if (!activeConfig) return;

    activeConfig.duration = value;
  }

  @RE.props.num()
  get speed() {
    const activeConfig = this.data[this.selected];

    return activeConfig ? activeConfig.speed : 1;
  }

  set speed(value: number) {
    if (this.selected < 0) return;
    const activeConfig = this.data[this.selected];

    if (!activeConfig) return;

    activeConfig.speed = Number(value);
  }

  private stopped = false;
  private stopping = false;

  get isActive() {
    return !this.stopped && !this.stopping;
  }

  stop() {
    this.stopping = true;
  }

  resume() {
    this.stopped = false;
    this.stopping = false;
  }

  @RE.props.button()
  play() {
    if (RE.Runtime.isRunning) return;

    if (this.playLabel === "Play" && !this.editorUpdate) {
      this.mixer;
      this.animationsHaveChanged() && this.updateConfigs();
      this.playAction();
      this.editorUpdate = RE.onUpdate(sceneController => {
        if (sceneController === RE.Runtime) return;
        // this.animationsHaveChanged() && this.stopAction() && this.updateConfigs();
        this.mixer.update(sceneController.deltaTime * this.speed);
      });
    }

    else if (this.playLabel === "Stop") {
      this.playLabel = "Play";
      this.stopAction();
      this.editorUpdate?.stop();
      this.editorUpdate = undefined;
    }
  }

  private stopAction() {
    this.mixer.existingAction(this.animations[this.selected])?.reset();
    this.mixer.stopAllAction();
  }

  private playAction() {
    this.stopAction();
    const action = this.actions[this.actionName];
    if (!this.actions[this.actionName]) return;

    this.playLabel = "Stop";
    action.action.play();
  }

  playLabel = "Play";

  private _mixer: THREE.AnimationMixer;

  actions: {[name: string]: {action: THREE.AnimationAction, config}} = {};
  activeAction: THREE.AnimationAction;

  get mixer() {
    if (!this._mixer) {
      this._mixer = new THREE.AnimationMixer(this.object3d);
      this.animations.forEach((clip, i) => {
        const action = this._mixer.clipAction(clip);
        clip.name = this.data[i].actionName;
        this.data[i].playOnce && action.setLoop(THREE.LoopOnce, 0);
        this.actions[this.data[i].actionName] = {action, config: this.data[i]};
      });
    }

    return this._mixer;
  }

  awake() {
    this.editorUpdate?.stop();
    this.editorUpdate = undefined;
  }

  start() {
    this.mixer.existingAction(this.animations[this.selected])?.reset();
    this.mixer.stopAllAction();
    const configs = this.data;
    this.animations.forEach((clip, i) => {
      const clipConfig = configs[i];
      clipConfig.duration && (clip.duration = clipConfig.duration);
      const action = this.mixer.existingAction(clip)
      if (!action) return;
      action.play() as THREE.AnimationAction;
      clipConfig.playOnce && action.setLoop(THREE.LoopOnce, 0);
      this.setWeight(action, this.selected === i ? 1 : 0);
    });

    this.mixer.removeEventListener("finished", this.animationFinished);
    this.mixer.addEventListener("finished", this.animationFinished);

    this.activeAction = this.defaultAction;
    this.mix(Object.keys(this.actions)[0]);
  }

  update() {
    if (this.stopped) return;
    this.mixer.update(RE.Runtime.deltaTime * this.actions[this.activeAction.getClip().name].config.speed);
  }

  getAction(index: number | string) {
    return this.actions[index].action;
  }

  setWeight(action: THREE.AnimationAction, weight: number) {
    action.enabled = true;
    action.time = 0;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
  }

  getWeight(actionName: string) {
    return this.getAction(actionName).getEffectiveWeight();
  }

  get defaultAction() {
    return this.getAction(this.defaultActionName)
  }

  get defaultActionName() {
    return Object.keys(this.actions)[0];
  }

  private animationFinishedListeners: (() => void)[] = [];

  onAnimationFinished(cb: () => void) {
    this.animationFinishedListeners.push(cb);
  }

  private animationFinished = () => {
    if (this.stopping) {
      this.stopped = true;
      this.stopping = false;
    }

    this.animationFinishedListeners.forEach(listener => listener());

    if (this.activeAction.loop === THREE.LoopOnce && !this.activeAction.clampWhenFinished) {
      this.mix(this.defaultActionName, 0.001, false);
    }
  }

  mix(actionName: string, transitionTime: number = 0.1, warp = true, weight = 1) {
    const action = this.getAction(actionName);

    action.reset();
    this.setWeight(action, weight);
    action.crossFadeFrom(this.activeAction, transitionTime, warp);
    this.activeAction = action;
  }
}

RE.registerComponent(Animator);
