import { escapeHtml } from "../core/dom.js";

export class SiteFooter {
  constructor({ host }) {
    this.host = host;
  }

  mount() {
    const { name, github, email, resume } = this.host;
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.dataset.shell = "";
    footer.innerHTML = `
      <div class="wrap">
        <p><span class="seal" translate="no" aria-hidden="true">道</span>© ${new Date().getFullYear()} ${escapeHtml(name)} · Painted in ink and code</p>
        <div class="footer-links">
          <a href="https://github.com/${escapeHtml(github)}" target="_blank" rel="noopener">GitHub</a>
          <a href="mailto:${escapeHtml(email)}">Email</a>
          <a href="${escapeHtml(resume)}" target="_blank" rel="noopener">Résumé (PDF)</a>
        </div>
      </div>`;
    document.body.appendChild(footer);
  }
}
