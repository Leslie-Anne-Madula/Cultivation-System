# Heavenly Dao System · Leslie Madula's portfolio

An IT portfolio told as a cultivation system. Plain HTML, CSS and JavaScript modules. No framework and no build step.

## Running it locally

The scripts are ES modules, so browsers only run them from a web server, not from a double-clicked file.

- **VS Code:** install the *Live Server* extension, open `index.html` and click **Go Live**.
- **Terminal:** run `npx serve .` in this folder and open the address it prints.

GitHub Pages serves the files correctly with no extra setup.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Awakening: the landing scene, with a "system binding" intro once per visit that waits for the visitor to press Enter |
| `status.html` | Status Window: identity, attributes, realm progress, live GitHub records, Five Element techniques |
| `path.html` | Path of Ascension: education and experience on a handscroll that unrolls as you scroll |
| `treasury.html` | Treasure Pavilion: certificates as graded treasures you can inspect and unseal |

## Project structure

```
assets/
  css/
    base.css            tokens (colours, fonts), reset, type, buttons, framed window
    components.css      header, footer, notifications, quest log, invitation, page turn
    pages/*.css         one stylesheet per page
  js/
    main.js             entry point
    boot.js             applies the saved theme before first paint
    app/App.js          builds shared services and mounts the current page
    app/Router.js       swaps pages in place so music carries on between them
    data/content.js     ALL editable content
    core/               Storage, EventBus, Scope, DOM and motion helpers
    services/           RealmService, GitHubService, PrivateRepoService, QuestService
    audio/              AudioEngine, instruments, AmbientScore (music), SoundManager
    ink/                procedural ink painter: MountainRange, Rock, PineTree
    ui/                 SiteHeader, SiteFooter, Notifier, QuestPanel, InviteDialog
    pages/              HomePage, StatusPage, PathPage, TreasuryPage and their components
  data/
    private-repos.json  private repository details, written by the sync script
  certificates/         certificate PDFs and their JPG previews
  docs/                 résumé
scripts/
  sync-private-repos.mjs       collects private repository details with your token
  private-repos.config.json    what the sync may publish
.github/workflows/
  sync-private-repos.yml       runs the sync every day on GitHub
```

Each page sets `data-page` on `<body>`. `App` reads it and loads the matching class from `pages/`. Shared services such as sound, theme, quests and GitHub are created once and passed to every page as `context`.

Links between the four pages don't reload the browser. `Router` fetches the next page, swaps its content under the ink veil and mounts its class, so music keeps playing. Each page registers its window listeners and timers on `context.scope`, which is released when the page is left. If a page can't be fetched, the router falls back to a normal page load.

## Editing content

Text that appears once, like page headings, lives in the HTML. Everything that is a list or a number lives in **`assets/js/data/content.js`**:

- `host`: name, title, email, GitHub username, résumé path.
- `realm`: the stage (Early, Middle, Late, Peak) is calculated from `programStart` and `programEnd`. Set `programEnd` to your real graduation date.
- `attributes`: radar values out of 100. They are a self-assessment, except Eloquence, which uses the EF SET score.
- `elements`: your tech stack grouped by element. `tag` is the short label under each wheel node, `domain` heads the manual, and each technique has a mastery level from 1 to 4. **Set these to your honest levels.**
- `path`: the realms on the Path page. Mark the current one with `current: true`.
- `treasures`: the certificates, listed from highest grade to lowest. The grade says how close a certificate is to IT: `heaven` for core IT, `earth` for close to it (tech business, capstone work, multimedia), `mystic` for loose ties and `yellow` for anything outside it.
- `quests` and `visitorRanks`: the visitor quest log.

### Adding a certificate

1. Put the PDF in `assets/certificates/` with a simple name, such as `my-cert.pdf`.
2. Save a JPG of its first page next to it as `my-cert.jpg`.
3. Add an entry to `treasures` with a `glyph`, a `grade` (`heaven`, `earth`, `mystic` or `yellow`) and a `form` (`pendant`, `slip`, `talisman`, `token`, `scroll` or `pill`).

For a course still in progress, set `refining: true`, use `grade: null` and leave out `image` and `pdf`. It shows as a pill refining in a cauldron until you swap in the certificate.

## Sound

Sound is off until the visitor turns it on with the speaker button. Browsers only allow audio after a click, so music starts on the first click after the site opens. It then continues across pages, dips gently while a page turns, and fades out and back in when the visitor switches browser tabs.

- **Music** is generated live: slow guqin phrases on the pentatonic scale over a soft drone and distant wind.
- **Tone:** every sound passes through a warm, softening filter, so nothing turns sharp. Levels live in `AudioEngine`, and each cue's volume is set in `SoundManager.createCues()`.
- **Click sounds** are declarative. Any link or button plays the cue in its `data-sound` attribute. The default is `tap`, and `none` mutes it. The cues are listed in `SoundManager.createCues()`.
- **Hover notes:** add `data-hover-note="3"` to an element to pluck a note when the pointer enters it.

## GitHub link

The Status page reads your public profile, repositories and contribution calendar when it opens. New repositories, followers and contributions appear without editing anything. Results are cached in the visitor's browser for 30 minutes. If GitHub can't be reached, the page shows `githubSnapshot` from `content.js`.

The Scroll Library has two tabs:

- **My repositories** lists repositories you own.
- **Contributed to** lists other people's repositories where you opened pull requests or issues, or pushed commits. These are found through GitHub search. Commits only count when they use an email address linked to your GitHub account.

GitHub can't see contributions to private repositories, or commits made under an unlinked email. For those, add an entry to `contributions` in `content.js`:

```js
contributions: [
  { repo: "teammate/capstone", note: "Built the attendance module for our capstone." }
],
```

## Private repositories

A website can't read private repositories by itself, and putting a token in the site's code would let anyone copy it. Instead, a small script reads your private repositories with your token and saves only safe details to `assets/data/private-repos.json`:

- repository names and owners
- descriptions and main language
- how many commits and pull requests are yours, and when the repository was last active
- your daily contribution counts, private ones included

No code is copied. Private repositories show on the Status page with a **Private** tag and no link, because visitors can't open them.

### One-time setup

1. **Create a token.** On GitHub, open Settings, then Developer settings, then Personal access tokens, then **Tokens (classic)**. Generate a new classic token, tick the `repo` scope and copy it. A classic token is needed because fine-grained tokens can't read private repositories owned by a teammate's personal account.
2. **Store it as a secret.** In the repository that hosts this site, open Settings, then Secrets and variables, then Actions. Add a repository secret named `PORTFOLIO_TOKEN` and paste the token. Add a second secret named `PORTFOLIO_AUTHOR_EMAILS` with every email you commit with, separated by commas.
3. **Run the sync.** Open the Actions tab, choose **Sync private repositories**, and press **Run workflow**. After that it runs by itself every day and commits any changes.

You can also run it on your own computer and commit the file yourself. In PowerShell:

```powershell
$env:PORTFOLIO_TOKEN = "paste-your-token-here"
$env:PORTFOLIO_AUTHOR_EMAILS = "first@example.com, second@example.com"
node scripts/sync-private-repos.mjs
```

Never save the token in a file inside this folder.

### Why the emails matter

Commits count as yours when their email is listed in `PORTFOLIO_AUTHOR_EMAILS`. Without it, the sync only counts commits whose email is linked to your GitHub account, so repositories you contributed to may be left out. Run `git config user.email` to see which address your computer commits with. Include your GitHub noreply address too, which web edits use. The emails stay in the secret or your terminal and are never written to the site.

### Choosing what appears

Edit `scripts/private-repos.config.json`:

- `hide`: repositories to keep off the site, written as `"owner/name"`.
- `showDescriptions`: set to `false` to publish names without descriptions.
- `authorEmails`: commit emails to count, as an alternative to the `PORTFOLIO_AUTHOR_EMAILS` setting. Emails listed here become public if the repository is public.

The repository names you publish become public, including your teammates' projects. Hide any your team would rather keep private.

## Hosting on GitHub Pages

1. Create a repository, for example `shenwuu.github.io`.
2. Upload the HTML files and the `assets` folder. The PDFs in the project root aren't needed, because copies live in `assets/`.
3. In the repository settings, open **Pages** and deploy from the `main` branch.

After that, every push updates the live site within a minute or two.
