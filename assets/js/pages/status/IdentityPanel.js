import { escapeHtml, glyph } from "../../core/dom.js";

export class IdentityPanel {
  constructor(element, { content, realm }) {
    this.element = element;
    this.host = content.host;
    this.realmInfo = content.realm;
    this.realm = realm;
  }

  render() {
    const { host, realm, realmInfo } = this;
    const realmValue = realm.isReadyToBreakThrough
      ? `${escapeHtml(realmInfo.name)} · Ready to break through`
      : `${escapeHtml(realmInfo.name)} ${glyph(realmInfo.glyph + realm.stage.glyph)} · ${escapeHtml(realm.stage.name)}`;
    const rows = [
      ["名", "Host", `<span class="name">${escapeHtml(host.name)}</span>`],
      ["号", "Title", escapeHtml(host.title)],
      ["境", "Realm", realmValue],
      ["宗", "Sect", escapeHtml(host.sect)],
      ["根", "Spirit root", escapeHtml(host.spiritRoot)],
      ["道", "Dao", escapeHtml(host.dao)],
      ["态", "Condition", `<span class="condition"><i aria-hidden="true"></i>${escapeHtml(host.condition)}</span>`],
      ["地", "Domain", escapeHtml(host.location)]
    ];
    this.element.innerHTML = rows.map(([mark, label, value]) => `<div><dt>${glyph(mark)}${label}</dt><dd>${value}</dd></div>`).join("");
  }
}
