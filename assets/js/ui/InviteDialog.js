import { escapeHtml, glyph } from "../core/dom.js";
import { icons } from "./icons.js";

/** Contact form styled as a sect invitation. Drafts an email in the visitor's mail app. */
export class InviteDialog {
  constructor({ host, quests }) {
    this.host = host;
    this.quests = quests;
  }

  mount() {
    this.dialog = document.createElement("dialog");
    this.dialog.className = "invite";
    this.dialog.dataset.shell = "";
    this.dialog.setAttribute("aria-labelledby", "invite-title");
    this.dialog.innerHTML = this.template();
    document.body.appendChild(this.dialog);

    this.form = this.dialog.querySelector("form");
    this.note = this.dialog.querySelector(".invite-note");
    this.stamp = this.dialog.querySelector(".stamp");

    this.dialog.addEventListener("click", (event) => {
      if (event.target === this.dialog || event.target.closest("[data-action='close']")) this.close();
    });
    this.dialog.querySelector("[data-action='copy']").addEventListener("click", (event) => this.copyEmail(event.currentTarget));
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.send();
    });
  }

  template() {
    const { email, github, resume } = this.host;
    return `
      <div class="invite-card">
        <button class="invite-close" type="button" data-action="close" aria-label="Close">${icons.close}</button>
        <h2 class="h2" id="invite-title">Sect Invitation ${glyph("招贤令")}</h2>
        <p>Have an internship or a project for the Host? Write your invitation here and your mail app will open with it, ready to send.</p>
        <form novalidate>
          <div class="field"><label for="invite-name">Your name</label><input id="invite-name" name="name" autocomplete="name" placeholder="Elder Chen" required></div>
          <div class="field"><label for="invite-sect">Sect (company or organization)</label><input id="invite-sect" name="sect" autocomplete="organization" placeholder="Azure Cloud Sect, Inc."></div>
          <div class="field"><label for="invite-message">Message</label><textarea id="invite-message" name="message" placeholder="We'd like to invite you to an internship interview…" required></textarea></div>
          <div class="invite-actions">
            <button class="btn solid" type="submit" data-sound="stamp">Seal and send ${icons.arrow}</button>
            <button class="btn" type="button" data-action="close">Not now</button>
          </div>
          <p class="invite-note" aria-live="polite"></p>
        </form>
        <div class="channels">
          <div><span class="key">Email</span><code class="invite-email">${escapeHtml(email)}</code><button class="copy-btn" type="button" data-action="copy">Copy</button></div>
          <div><span class="key">GitHub</span><a href="https://github.com/${escapeHtml(github)}" target="_blank" rel="noopener">github.com/${escapeHtml(github)}</a></div>
          <div><span class="key">Résumé</span><a href="${escapeHtml(resume)}" target="_blank" rel="noopener">Open the résumé (PDF)</a></div>
        </div>
        <span class="seal stamp" translate="no" aria-hidden="true">令</span>
      </div>`;
  }

  open() {
    if (typeof this.dialog.showModal === "function") this.dialog.showModal();
    else this.dialog.setAttribute("open", "");
    this.quests.complete("invite");
    setTimeout(() => this.form.elements.name.focus(), 60);
  }

  close() {
    if (typeof this.dialog.close === "function") this.dialog.close();
    else this.dialog.removeAttribute("open");
  }

  send() {
    const name = this.form.elements.name.value.trim();
    const sect = this.form.elements.sect.value.trim();
    const message = this.form.elements.message.value.trim();
    if (!name || !message) {
      this.showNote(!name ? "Add your name so the Host knows who is calling." : "Write a short message before sealing the letter.", true);
      (!name ? this.form.elements.name : this.form.elements.message).focus();
      return;
    }
    this.showNote("");
    this.stamp.classList.remove("down");
    void this.stamp.offsetWidth;
    this.stamp.classList.add("down");

    const subject = `Sect invitation${sect ? ` from ${sect}` : ""}`;
    const body = `Hello Leslie,\n\n${message}\n\nRegards,\n${name}${sect ? `\n${sect}` : ""}`;
    setTimeout(() => {
      window.location.href = `mailto:${this.host.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      this.showNote("Your mail app should open with this letter. If nothing opened, copy the address below.");
    }, 650);
  }

  showNote(text, isError = false) {
    this.note.textContent = text;
    this.note.classList.toggle("error", isError);
  }

  copyEmail(button) {
    const done = () => {
      button.textContent = "Copied";
      setTimeout(() => (button.textContent = "Copy"), 1800);
    };
    const fallback = () => {
      const range = document.createRange();
      range.selectNodeContents(this.dialog.querySelector(".invite-email"));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = "Press Ctrl+C";
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(this.host.email).then(done, fallback);
    else fallback();
  }
}
