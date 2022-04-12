import * as RE from 'rogue-engine';

export default class UIElement extends RE.Component {
  @RE.props.text() containerID = "";
  @RE.props.code("html") html = ``;

  private _container: HTMLDivElement;

  get container() {
    if (!this._container) {
      this._container = document.createElement("div");
      this._container.id = this.containerID;
    }

    return this._container;
  }

  awake() {
    this.container.innerHTML = this.html;
    RE.Runtime.uiContainer.append(this.container);
  }
}

RE.registerComponent(UIElement);
