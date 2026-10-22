/** Derives the current cultivation stage from the programme dates. */
export class RealmService {
  constructor(realm) {
    this.realm = realm;
  }

  get progress() {
    const start = new Date(this.realm.programStart).getTime();
    const end = new Date(this.realm.programEnd).getTime();
    const value = ((Date.now() - start) / (end - start)) * 100;
    return Math.max(0, Math.min(100, value));
  }

  get stage() {
    const progress = this.progress;
    const { stages } = this.realm;
    return stages.find((stage) => progress <= stage.upTo) ?? stages[stages.length - 1];
  }

  get isReadyToBreakThrough() {
    return this.progress >= 100;
  }

  get stageLabel() {
    return this.isReadyToBreakThrough ? "Ready to Break Through" : this.stage.name;
  }

  /** Stage ranges as [from, to, stage] for drawing a segmented meter. */
  get segments() {
    let from = 0;
    return this.realm.stages.map((stage) => {
      const segment = { from, to: stage.upTo, stage };
      from = stage.upTo;
      return segment;
    });
  }
}
