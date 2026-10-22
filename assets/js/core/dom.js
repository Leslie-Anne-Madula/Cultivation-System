const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

/** Decorative Chinese text: brush font, excluded from translation and screen readers. */
export function glyph(text, className = "cn") {
  return `<span class="${className}" lang="zh-Hans" translate="no" aria-hidden="true">${escapeHtml(text)}</span>`;
}

export function createSvg(tag, attributes = {}, parent = null) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  parent?.appendChild(element);
  return element;
}

export function frameCorners() {
  return '<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>';
}

export function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  return new Date(value).toLocaleDateString("en-US", options);
}
