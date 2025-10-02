# RBC site (clean)

Files:
- `index.html` — main page (Teletext, Fixtures from `data/rbc.ics`, Squad from `data/players.json`)
- `data/rbc.ics` — calendar in ICS format (valid, empty to start)
- `data/players.json` — list of players (empty array to start)
- `assets/script.js` — loads and renders players

## Add a fixture
Append a `VEVENT` block inside `data/rbc.ics`, e.g.:

```
BEGIN:VEVENT
UID:rbc-20251015-2000@example
DTSTAMP:20251001T080000Z
DTSTART:20251015T180000Z
DTEND:20251015T200000Z
SUMMARY:RBC vs Opponent
LOCATION:Sportpark De Luiten
END:VEVENT
```

## GitHub Pages quick deploy
1) Create a new repo, e.g. `rbc-fan-site`
2) Upload these files at the repo root
3) Settings → Pages → Build and deployment → Deploy from branch → `main` / `/ (root)`
4) Open the Pages URL (something like `https://<user>.github.io/rbc-fan-site/`)

Updating the calendar or players after publishing? Edit the files and commit — the site will update automatically.
