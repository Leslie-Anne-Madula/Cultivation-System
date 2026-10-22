import { content } from "../data/content.js";
import { Storage } from "../core/Storage.js";
import { EventBus } from "../core/EventBus.js";
import { RealmService } from "../services/RealmService.js";
import { GitHubService } from "../services/GitHubService.js";
import { PrivateRepoService } from "../services/PrivateRepoService.js";
import { QuestService } from "../services/QuestService.js";
import { SoundManager } from "../audio/SoundManager.js";
import { ThemeController } from "../ui/ThemeController.js";
import { Notifier } from "../ui/Notifier.js";
import { SiteHeader } from "../ui/SiteHeader.js";
import { SiteFooter } from "../ui/SiteFooter.js";
import { QuestPanel } from "../ui/QuestPanel.js";
import { InviteDialog } from "../ui/InviteDialog.js";
import { Router } from "./Router.js";

const PAGES = {
  home: () => import("../pages/HomePage.js").then((module) => module.HomePage),
  status: () => import("../pages/StatusPage.js").then((module) => module.StatusPage),
  path: () => import("../pages/PathPage.js").then((module) => module.PathPage),
  treasury: () => import("../pages/TreasuryPage.js").then((module) => module.TreasuryPage)
};

/**
 * Builds the shared services and the site shell once, then mounts and
 * unmounts page controllers as the router moves between pages.
 */
export class App {
  constructor(body = document.body) {
    this.page = body.dataset.page ?? "home";
    this.current = null;
  }

  async start() {
    this.context = this.createContext();
    this.mountShell();
    await this.mountPage(this.page);
  }

  createContext() {
    const storage = new Storage("local");
    const session = new Storage("session");
    const bus = new EventBus();
    return {
      page: this.page,
      content,
      storage,
      session,
      bus,
      realm: new RealmService(content.realm),
      github: new GitHubService({ username: content.host.github, storage, snapshot: content.githubSnapshot, listed: content.contributions }),
      privateRepos: new PrivateRepoService({ url: "assets/data/private-repos.json" }),
      quests: new QuestService({ quests: content.quests, ranks: content.visitorRanks, storage, bus }),
      theme: new ThemeController({ storage, bus }),
      sound: new SoundManager({ storage, bus }),
      notifier: new Notifier({ bus })
    };
  }

  mountShell() {
    const { context } = this;
    context.invite = new InviteDialog({ host: content.host, quests: context.quests });
    new SiteHeader(context).mount();
    new SiteFooter({ host: content.host }).mount();
    context.invite.mount();
    new QuestPanel(context).mount();
    new Router({
      ...context,
      onLeave: () => this.unmountPage(),
      onEnter: (name) => this.mountPage(name)
    }).mount(this.page);
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-invite]")) context.invite.open();
    });
  }

  async mountPage(name) {
    const loadPage = PAGES[name];
    if (!loadPage) return;
    this.page = this.context.page = name;
    const PageClass = await loadPage();
    this.current = new PageClass(this.context);
    this.current.mount();
  }

  unmountPage() {
    this.current?.unmount();
    this.current = null;
  }
}
