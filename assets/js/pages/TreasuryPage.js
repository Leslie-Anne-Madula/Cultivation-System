import { Page } from "./Page.js";
import { Inventory } from "./treasury/Inventory.js";
import { ItemInspector } from "./treasury/ItemInspector.js";
import { ScrollViewer } from "./treasury/ScrollViewer.js";

export class TreasuryPage extends Page {
  mount() {
    const { context } = this;
    const $ = (selector) => document.querySelector(selector);
    const narrow = window.matchMedia("(max-width: 900px)");

    const viewer = new ScrollViewer($("[data-scroll-viewer]"));
    viewer.mount();
    const inspector = new ItemInspector($("[data-inspector]"), context, (treasure) => viewer.open(treasure));
    const inventory = new Inventory(
      { filters: $("[data-filters]"), slots: $("[data-slots]"), count: $("[data-slot-count]") },
      context,
      (treasure, byVisitor) => {
        inspector.show(treasure);
        if (!byVisitor) return;
        context.quests.complete("treasure");
        if (narrow.matches) inspector.element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    );
    inventory.render();
    inventory.select(context.content.treasures[0].id);
  }
}
