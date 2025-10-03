/* =========================================================
   RBC Fan Site — assets/script.js
   - Loads fixtures (cup + league) into tables
   - Builds “Next 5 wedstrijden” from upcoming fixtures
   - Loads squad with photos
   - Pulls latest X/Twitter post text via a CORS-friendly proxy
   ========================================================= */

/* ------------ Helpers ------------ */
const fmt = {
  pad: (n) => (n < 10 ? "0" + n : "" + n),
  // Parse "DD/MM/YYYY" and optional "HH:MM"
  toDate: (dmy, hm) => {
    if (!dmy) return null;
    const [d, m, y] = dmy.split("/").map((x) => parseInt(x, 10));
    let hh = 0, mm = 0;
    if (hm && /^\d{1,2}:\d{2}$/.test(hm.trim())) {
      const parts = hm.split(":");
      hh = parseInt(parts[0], 10) || 0;
      mm = parseInt(parts[1], 10) || 0;
    }
    // Local time
    return new Date(y, (m || 1) - 1, d || 1, hh, mm, 0, 0);
  },
  // Human readable date/time (NL)
  nice: (date) => {
    try {
      return new Intl.DateTimeFormat("nl-NL", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return date.toLocaleString();
    }
  },
};

/* =========================================================
   Fixtures Loader
   - fills #cup-body and #league-body
   - builds the “Next 5 wedstrijden” box (#next5)
   ========================================================= */
(async function initFixtures() {
  try {
    const res = await fetch("./data/fixtures.json?v=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const fixturesData = await res.json();

    /* --- Fill cup & league tables --- */
    function fillTable(bodyId, fixtures) {
      const tbody = document.getElementById(bodyId);
      if (!tbody) return;
      tbody.innerHTML = "";
      if (!Array.isArray(fixtures) || fixtures.length === 0) return;

      fixtures.forEach((f) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${f.round || ""}</td>
          <td>${f.date || ""}</td>
          <td>${f.time || ""}</td>
          <td>${f.place || ""}</td>
          <td>${f.opponent || ""}</td>
          <td>${f.result || ""}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    if (fixturesData.cup) fillTable("cup-body", fixturesData.cup);
    if (fixturesData.league) fillTable("league-body", fixturesData.league);

    /* --- Build Next 5 wedstrijden --- */
    (function fillNextFive() {
      const host = document.getElementById("next5");
      if (!host) return;

      const now = new Date();
      const rows = [];

      const pushSet = (set, tag) => {
        if (!Array.isArray(set)) return;
        set.forEach((g) => {
          const when = fmt.toDate(g.date, g.time || "00:00");
          if (!when) return;

          // Consider “upcoming” if result is "-:-" OR date is in the future
          const isUpcoming = (g.result && g.result.trim() === "-:-") || when >= now;
          if (!isUpcoming) return;

          rows.push({
            when,
            comp: tag, // "Beker" or "League"
            round: g.round || "",
            place: g.place || "",
            opponent: g.opponent || "",
          });
        });
      };

      pushSet(fixturesData.cup, "Beker");
      pushSet(fixturesData.league, "League");

      // Sort by date/time ascending
      rows.sort((a, b) => a.when - b.when);

      const next5 = rows.slice(0, 5);

      host.innerHTML = ""; // clear “Laden…”
      if (next5.length === 0) {
        host.innerHTML = `<p class="muted">Geen komende wedstrijden gevonden.</p>`;
        return;
      }

      const list = document.createElement("ul");
      list.className = "next5-list";

      next5.forEach((m) => {
        const li = document.createElement("li");
        li.className = "next5-item";
        li.innerHTML = `
          <div class="n5-left">
            <div class="n5-date">${fmt.nice(m.when)}</div>
            <div class="n5-meta">${m.comp === "Beker" ? "KNVB Beker" : "Derde Divisie B"} • Ronde ${m.round} • ${m.place === "H" ? "Thuis" : "Uit"}</div>
          </div>
          <div class="n5-right"><span class="n5-opp">${m.opponent}</span></div>
        `;
        list.appendChild(li);
      });

      host.appendChild(list);
    })();
  } catch (e) {
    console.error("[RBC] fixtures.json load error", e);
    // Graceful fallback
    const n5 = document.getElementById("next5");
    if (n5) n5.innerHTML = `<p class="muted">Kon programma niet laden.</p>`;
  }
})();

/* =========================================================
   Squad Loader
   - fills #squad-list from data/players.json
   - accepts either { players: [...] } or [...]
   ========================================================= */
(async function initSquad() {
  const box = document.getElementById("squad-list");
  const empty = document.getElementById("squad-empty");
  try {
    const res = await fetch("./data/players.json?v=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const squadData = await res.json();
    const list = Array.isArray(squadData)
      ? squadData
      : Array.isArray(squadData.players)
      ? squadData.players
      : [];

    if (!list.length) {
      if (empty) empty.style.display = "block";
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach((p) => {
      const card = document.createElement("div");
      card.className = "player";

      // #number badge
      if (p.number != null && p.number !== "") {
        const badge = document.createElement("div");
        badge.className = "badge";
        badge.textContent = "#" + p.number;
        card.appendChild(badge);
      }

      // photo
      const img = document.createElement("img");
      img.alt = (p.name || "Speler") + " foto";
      img.loading = "lazy";
      img.decoding = "async";
      img.src = p.photo || "";
      img.onerror = () => {
        // hide if broken
        img.style.display = "none";
      };

      const h3 = document.createElement("h3");
      h3.textContent = p.name || "Speler";

      card.appendChild(img);
      card.appendChild(h3);
      frag.appendChild(card);
    });

    box.appendChild(frag);
  } catch (e) {
    console.error("[RBC] players.json load error", e);
    if (empty) empty.style.display = "block";
  }
})();

/* =========================================================
   Latest tweet (text-only) via a CORS-friendly proxy
   - Avoids official widget & rate-limit issues
   - Fills #latest-x with the most recent post
   ========================================================= */
(async function latestTweet() {
  const host = document.getElementById("latest-x");
  if (!host) return;

  // HTML entity decoder
  const decode = (s = "") =>
    s
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"');

  const formatDate = (d) => {
    try {
      return new Intl.DateTimeFormat("nl-NL", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return d.toLocaleString();
    }
  };

  // Jina reader proxy to fetch Nitter RSS (CORS friendly)
  const rssURL = "https://r.jina.ai/http://nitter.net/RBCvoetbal/rss";

  try {
    const res = await fetch(rssURL, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const xml = await res.text();

    const firstItem = (xml.match(/<item>[\s\S]*?<\/item>/i) || [])[0] || "";
    const rawTitle = ((firstItem.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "").trim();
    const rawLink =
      ((firstItem.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || "https://twitter.com/RBCvoetbal").trim();
    const rawDate = ((firstItem.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || "").trim();

    host.innerHTML = ""; // clear “Laden…”

    if (!rawTitle) {
      host.innerHTML =
        '<p class="muted">Geen update gevonden. <a href="https://twitter.com/RBCvoetbal" target="_blank" rel="noopener">Bekijk @RBCvoetbal</a></p>';
      return;
    }

    const when = rawDate ? new Date(rawDate) : null;
    const title = decode(rawTitle);
    const link = decode(rawLink);

    const wrap = document.createElement("div");
    wrap.className = "x-item";
    wrap.innerHTML = `
      <div>${title} <a href="${link}" target="_blank" rel="noopener">lees verder →</a></div>
      <div class="x-meta">${when ? formatDate(when) : ""} • bron: @RBCvoetbal</div>
    `;

    host.appendChild(wrap);
  } catch (err) {
    console.error("[RBC] latest tweet load error", err);
    host.innerHTML =
      '<p class="muted">Kon live update niet laden. <a href="https://twitter.com/RBCvoetbal" target="_blank" rel="noopener">Open @RBCvoetbal</a></p>';
  }
})();

/* =========================================================
   Footer year
   ========================================================= */
(function setYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
