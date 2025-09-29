# RBC Roosendaal Fan Hub (Free)

A free, static website you can host on **GitHub Pages**. It includes:

- Fixtures & Results (via **free live widgets** you can paste)
- Squad (editable JSON)
- Calendar (Google Calendar embed)
- A weekly **Sunday evening** auto-rebuild workflow

> This template avoids paid services. You can enhance it later (Netlify, custom domain, etc.).

---

## 1) Publish for free on GitHub Pages

1. Create a new public repo on GitHub, e.g. `rbc-fan-site`.
2. Upload these files (or drag-drop the entire folder).
3. Go to **Settings → Pages** and set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (or `master`) / `/root`
4. Your site will be live at `https://YOUR_USER.github.io/rbc-fan-site`

> Tip: To upload quickly, unzip and drag the contents into the GitHub web UI.

---

## 2) Fixtures & Results (auto-updating)

**Recommended:** use **SofaScore Widgets** which are free and update themselves automatically.

- Open: https://corporate.sofascore.com/widgets
- Choose a **Team** widget (schedule / results / table) and search **"RBC Roosendaal"** (team id is often `2969`).
- Copy the generated `<script>...</script>` snippet and **paste it** inside `index.html` where the placeholder is.
- Publish the change — done.

**Alternatives**  
- ESPN schedule page: https://www.espn.nl/voetbal/team/speelkalender/_/id/150/rbc%20roosendaal  
- Club's own fixtures/results page (many teams): https://www.rbcvoetbal.nl/wedstrijden

> Widgets auto-update, so you don't need to "refresh" data yourself.

---

## 3) Squad

Edit `data/players.json`. Fields are straightforward:

```json
{
  "players": [{"number":9,"name":"Your Striker","position":"FW","nationality":"NL"}]
}
```

The front-end reads this file and renders player cards.

---

## 4) Calendar (Google Calendar)

1. Create a **Google Calendar** for RBC fixtures.
2. Make it **Public** (Settings → Access permissions for events → tick "Make available to public").
3. Copy the **Embed code** (Settings → Integrate calendar → "Public URL to this calendar" or "Embed code").
4. Replace the `src=` URL inside the `<iframe>` in `index.html`.

> Anyone can subscribe to the ICS/iCal link too.

---

## 5) Weekly auto-rebuild (Sunday evening)

This repo includes `.github/workflows/weekly-update.yml` that runs **every Sunday at 20:00 Europe/Amsterdam**.  
By default, it just touches a timestamp file so GitHub Pages rebuilds (useful once you add scraping or feeds).

You can later extend the job to fetch news/fixtures and write to `data/*.json` before committing.

---

## 6) (Optional) Add real news scraping

- Point a script to the official site `https://www.rbcvoetbal.nl/` and extract latest headline + link.  
- Save into `data/news.json` and load it from `assets/script.js` instead of the placeholder.

> Avoid heavy scraping; respect robots.txt and terms. When possible, prefer official widgets and public embed feeds.

---

## 7) Local testing

No build step needed. Open `index.html` directly in a browser.  
For widget scripts that require HTTPS origins, test by pushing to GitHub Pages.

---

## 8) License & attribution

- MIT license (see LICENSE)
- This is a **fan** project, not affiliated with RBC Roosendaal.
- Data sources: SofaScore Widgets, ESPN, official club pages.

_Last updated: 2025-09-29_
