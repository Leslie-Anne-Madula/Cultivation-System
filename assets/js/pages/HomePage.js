import { Page } from "./Page.js";
import { HomeScene } from "./home/HomeScene.js";
import { FallingNeedles } from "./home/FallingNeedles.js";
import { AwakeningSequence } from "./home/AwakeningSequence.js";
import { prefersReducedMotion } from "../core/motion.js";

export class HomePage extends Page {
  mount() {
    const { realm, session } = this.context;
    this.hero = document.querySelector(".hero");
    document.querySelectorAll("[data-realm-stage]").forEach((element) => (element.textContent = realm.stageLabel));

    new HomeScene(this.hero, this.context).mount();
    new FallingNeedles(this.hero.querySelector(".scene-needles"), this.context).start();
    this.bindSun();

    if (!session.read("awakened", false) && !prefersReducedMotion()) {
      session.write("awakened", true);
      new AwakeningSequence(this.context).run().then(() => this.afterAwakening(700));
    } else {
      this.afterAwakening(1200);
    }
  }

  afterAwakening(delay) {
    const { quests, notifier } = this.context;
    this.hero.classList.add("intro");
    this.scope.timeout(() => {
      if (!quests.complete("awaken")) return;
      this.scope.timeout(() => notifier.show("New quests have appeared. Open the quest log at the bottom left to follow them.", { glyph: "任", label: "Quest", duration: 7000 }), 1600);
    }, delay);
  }

  bindSun() {
    const sun = this.hero.querySelector(".sun");
    const { notifier, theme } = this.context;
    let rays = 0;
    sun.addEventListener("click", () => {
      sun.classList.remove("absorbing");
      void sun.offsetWidth;
      sun.classList.add("absorbing");
      rays += 1;
      if (rays === 1) {
        const message = theme.isDark ? "You drew in a thread of moonlight. Yin qi +1." : "You absorbed a ray of the morning sun. Yang qi +1.";
        notifier.show(message, { glyph: theme.isDark ? "阴" : "阳", cue: "none" });
      }
      if (rays === 5) {
        notifier.show("Hidden achievement: Sun Gazer. Five rays absorbed. Rest your eyes, fellow Daoist.", { glyph: "阳", label: "Hidden achievement", duration: 7000, cue: "quest" });
      }
    });
  }
}
