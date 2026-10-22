const STORE_KEY = "quests";

/**
 * Tracks the visitor's quests. Emits:
 *  quest:completed { quest, done, total, rank, rankChanged }
 *  quest:reset
 */
export class QuestService {
  constructor({ quests, ranks, storage, bus }) {
    this.quests = quests;
    this.ranks = ranks;
    this.storage = storage;
    this.bus = bus;
  }

  get state() {
    return this.storage.read(STORE_KEY, {});
  }

  get total() {
    return this.quests.length;
  }

  get doneCount() {
    const state = this.state;
    return this.quests.filter((quest) => state[quest.id]).length;
  }

  get rank() {
    return this.rankFor(this.doneCount);
  }

  isDone(id) {
    return Boolean(this.state[id]);
  }

  rankFor(count) {
    return this.ranks.reduce((best, rank) => (count >= rank.min ? rank : best), this.ranks[0]);
  }

  complete(id) {
    const quest = this.quests.find((q) => q.id === id);
    if (!quest || this.isDone(id)) return false;
    const before = this.rank;
    this.storage.write(STORE_KEY, { ...this.state, [id]: Date.now() });
    const rank = this.rank;
    this.bus.emit("quest:completed", { quest, done: this.doneCount, total: this.total, rank, rankChanged: rank !== before });
    return true;
  }

  reset() {
    this.storage.write(STORE_KEY, {});
    this.bus.emit("quest:reset");
  }
}
