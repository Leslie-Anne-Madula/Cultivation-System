import { Page } from "./Page.js";
import { IdentityPanel } from "./status/IdentityPanel.js";
import { RadarChart } from "./status/RadarChart.js";
import { RealmMeter } from "./status/RealmMeter.js";
import { GitHubRecords } from "./status/GitHubRecords.js";
import { ElementWheel } from "./status/ElementWheel.js";

export class StatusPage extends Page {
  mount() {
    const { context } = this;
    const $ = (selector) => document.querySelector(selector);

    new IdentityPanel($("[data-identity]"), context).render();
    new RadarChart($("[data-radar]"), $("[data-attribute-note]"), context.content.attributes).render();
    new RealmMeter($("[data-realm-meter]"), context).render();
    new GitHubRecords($("[data-records]"), context).render();
    new ElementWheel({ wheel: $("[data-wheel]"), manual: $("[data-manual]"), caption: $("[data-cycle-caption]") }, context).render();

    this.scope.timeout(() => context.quests.complete("status"), 1400);
  }
}
