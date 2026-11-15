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
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
    footer.innerHTML = `
      <div class="wrap">
        <p><span class="seal" translate="no" aria-hidden="true">道</span>© ${new Date().getFullYear()} ${escapeHtml(name)}</p>
        <div class="footer-links">
          <a href="https://github.com/${escapeHtml(github)}" target="_blank" rel="noopener">GitHub</a>
          <a href="${gmailUrl}" target="_blank" rel="noopener">Email</a>
          <a href="${escapeHtml(resume)}" target="_blank" rel="noopener">Résumé (PDF)</a>
        </div>
      </div>`;
    document.body.appendChild(footer);
  }
}
