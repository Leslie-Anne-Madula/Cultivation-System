import { Scope } from "../core/Scope.js";

/**
 * Base class for page controllers. Each page gets its own scope in its
 * context; everything registered there is released by unmount().
 */
export class Page {
  constructor(context) {
    this.scope = new Scope();
    this.context = { ...context, scope: this.scope };
  }

  mount() {
    throw new Error(`${this.constructor.name} must implement mount()`);
  }

  unmount() {
    this.scope.dispose();
  }
}
