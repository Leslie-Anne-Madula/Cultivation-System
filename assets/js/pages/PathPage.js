import { Page } from "./Page.js";
import { Handscroll } from "./path/Handscroll.js";

export class PathPage extends Page {
  mount() {
    new Handscroll(document.querySelector("[data-handscroll]"), this.context).mount();
  }
}
