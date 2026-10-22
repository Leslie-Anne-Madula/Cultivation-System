import { escapeHtml, formatDate } from "../../core/dom.js";

const DAYS_PER_WEEK = 7;

/** One dot per day of GitHub activity, laid out in week columns. */
export class ContributionMap {
  constructor({ grid, months, tip, profileUrl }) {
    Object.assign(this, { grid, months, tip, profileUrl });
  }

  render(days) {
    if (!days?.length) {
      this.grid.closest(".heat-scroll").innerHTML = `<p class="heat-tip">The contribution map can't be read right now. <a href="${escapeHtml(this.profileUrl)}" target="_blank" rel="noopener">See the full record on GitHub</a>.</p>`;
      this.tip.textContent = "";
      return;
    }
    const dateOf = (day) => new Date(`${day.date}T00:00:00`);
    const padding = dateOf(days[0]).getDay();

    const cells = Array.from({ length: padding }, () => '<i class="pad"></i>');
    for (const day of days) {
      const level = Math.min(4, day.level || (day.count ? 1 : 0));
      const label = `${formatDate(dateOf(day))} · ${day.count ? `${day.count} ${day.count === 1 ? "contribution" : "contributions"}` : "no activity"}`;
      cells.push(`<i data-level="${level}" data-label="${escapeHtml(label)}" title="${escapeHtml(label)}"></i>`);
    }
    this.grid.innerHTML = cells.join("");

    const columns = Math.ceil((padding + days.length) / DAYS_PER_WEEK);
    let previousMonth = -1;
    const labels = [];
    for (let column = 0; column < columns; column++) {
      const day = days[Math.min(days.length - 1, Math.max(0, column * DAYS_PER_WEEK - padding))];
      const month = dateOf(day).getMonth();
      const showLabel = month !== previousMonth && column < columns - 1;
      labels.push(`<span>${showLabel ? dateOf(day).toLocaleDateString("en-US", { month: "short" }) : ""}</span>`);
      previousMonth = month;
    }
    this.months.innerHTML = labels.join("");

    const active = days.filter((day) => day.count > 0).length;
    this.tip.textContent = `${active} active ${active === 1 ? "day" : "days"} this year. Point at a dot to read that day.`;
    this.grid.addEventListener("mouseover", (event) => {
      const label = event.target.dataset?.label;
      if (label) this.tip.textContent = label;
    });
    const scroller = this.grid.closest(".heat-scroll");
    scroller.scrollLeft = scroller.scrollWidth;
  }
}
