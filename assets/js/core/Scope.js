/** Collects listeners and cleanups so a page can release everything when it leaves. */
export class Scope {
  constructor() {
    this.cleanups = [];
    this.disposed = false;
  }

  on(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this.add(() => target.removeEventListener(type, handler, options));
    return handler;
  }

  subscribe(bus, event, handler) {
    this.add(bus.on(event, handler));
  }

  timeout(fn, ms) {
    const id = setTimeout(fn, ms);
    this.add(() => clearTimeout(id));
    return id;
  }

  add(cleanup) {
    this.cleanups.push(cleanup);
  }

  dispose() {
    this.disposed = true;
    while (this.cleanups.length) this.cleanups.pop()();
  }
}
