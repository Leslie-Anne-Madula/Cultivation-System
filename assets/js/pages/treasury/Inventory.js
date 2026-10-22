import { escapeHtml, glyph } from "../../core/dom.js";
import { treasureIcon, gradeColor } from "./treasureIcons.js";

/** Grade filters and the spatial-ring slots. Calls onSelect(treasure) when a slot is picked. */
export class Inventory {
  constructor({ filters, slots, count }, { content }, onSelect) {
    Object.assign(this, { filtersElement: filters, slotsElement: slots, countElement: count, onSelect });
    this.treasures = content.treasures;
    this.grades = content.grades;
    this.capacity = Math.max(content.inventorySlots, this.treasures.length);
  }

  render() {
    this.renderFilters();
    this.renderSlots();
    this.countElement.textContent = `${this.treasures.length} of ${this.capacity} slots filled`;
  }

  renderFilters() {
    const filters = [{ key: "all", glyph: "全", name: "All" }, ...Object.entries(this.grades).map(([key, grade]) => ({ key, ...grade }))];
    this.filtersElement.innerHTML = filters.map((filter, index) => `
      <button class="filter" type="button" data-filter="${filter.key}" data-sound="select" data-sound-index="${index}"
        aria-pressed="${filter.key === "all"}" title="${escapeHtml(filter.meaning ?? "Every treasure")}"
        style="--grade:${filter.key === "all" ? "var(--ink)" : `var(--g-${filter.key})`}">
        ${glyph(filter.glyph)}${escapeHtml(filter.name)}
      </button>`).join("");
    this.filtersElement.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (button) this.applyFilter(button.dataset.filter);
    });
  }

  applyFilter(key) {
    this.filtersElement.querySelectorAll("[data-filter]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === key)));
    this.slotsElement.querySelectorAll("[data-id]").forEach((slot) => {
      const treasure = this.find(slot.dataset.id);
      slot.classList.toggle("dim", key !== "all" && treasure.grade !== key);
    });
  }

  renderSlots() {
    const filled = this.treasures.map((treasure, index) => {
      const grade = treasure.grade ? this.grades[treasure.grade] : null;
      const label = `${treasure.item}, ${grade ? `${grade.name} grade` : "still refining"}`;
      return `
        <button class="slot${treasure.refining ? " refining" : ""}" type="button" data-id="${escapeHtml(treasure.id)}"
          data-sound="select" data-sound-index="${index}" data-hover-note="${index}"
          aria-pressed="false" aria-label="${escapeHtml(label)}" title="${escapeHtml(treasure.item)}" style="--grade:${gradeColor(treasure)}">
          <span class="slot-glow" aria-hidden="true"></span>
          <span class="slot-grade" translate="no" aria-hidden="true">${grade ? escapeHtml(grade.glyph) : "炼"}</span>
          ${treasureIcon(treasure)}
        </button>`;
    });
    const empty = Array.from({ length: this.capacity - this.treasures.length }, () => '<div class="slot empty" aria-hidden="true"><span translate="no">空</span></div>');
    this.slotsElement.innerHTML = [...filled, ...empty].join("");
    this.slotsElement.addEventListener("click", (event) => {
      const slot = event.target.closest("[data-id]");
      if (slot) this.select(slot.dataset.id, true);
    });
  }

  select(id, byVisitor = false) {
    this.slotsElement.querySelectorAll("[data-id]").forEach((slot) => slot.setAttribute("aria-pressed", String(slot.dataset.id === id)));
    this.onSelect(this.find(id), byVisitor);
  }

  find(id) {
    return this.treasures.find((treasure) => treasure.id === id);
  }
}
