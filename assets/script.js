/* =========================================================
   RBC Fan Site — assets/script.js
   ========================================================= */

/* -------------------------------
   Small utilities
--------------------------------- */
function parseNLDate(dStr = "", tStr = "") {
  // dStr like "17/08/2025", tStr like "13:00" (optional)
  const [dd, mm, yyyy] = dStr.split("/").map(Number);
  if (!dd || !mm || !yyyy) return null;
  let hh = 12, mi = 0;
  if (tStr && tStr.includes(":")) {
    const [h, m] = tStr.split(":").map(s => parseInt(s, 10));
    if (!Number.isNaN(h)) hh = h;
    if (!Number.isNaN(m)) mi = m;
  }
  return new Date(yyyy, mm - 1, dd, hh, mi, 0, 0);
}

function createEl(tag, attrs = {}, html = "") {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k in el) el[k] = v;
    else el.setAttribute(k, v);
  });
  if (html) el.innerHTML = html;
  return el;
}

/* =========================================================
   Fixtures Loader (tables + Next 5)
   - expects ./data/fixtures.json
   - { cup: [...], league: [...] }
   ========================================================= */
(async function initFixtures() {
  try {
    const res = await fetch("./data/fixtures.json?v=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    function fillTable(bodyId, fixtures) {
      const tbody = document.getElementById(bodyId);
      if (!tbody) return;
      tbody.innerHTML = "";
      (fixtures || []).forEach(f => {
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

    if (data && Array.isArray(data.cup)) fillTable("cup-body", data.cup);
    if (data && Array.isArray(data.league)) fillTable("league-body", data.league);

    // ---- Next 5 wedstrijden box ----
    const nextBox = document.getElementById("next5");
    if (nextBox) {
      try {
        const today = new Date();
        const upcoming = (data.league || [])
          .filter(m => {
            const dt = parseNLDate(m.date, m.time);
            // Treat "-:-" or empty result as upcoming; also include future-dated fixtures even if result accidentally present
            const noResult = !m.result || m.result === "-:-";
            return (dt && dt >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) || noResult;
          })
          .map(m => ({ ...m, _dt: parseNLDate(m.date, m.time) || new Date(8640000000000000) })) // fallback far future
          .sort((a, b) => a._dt - b._dt)
          .slice(0, 5);

        if (!upcoming.length) {
          nextBox.innerHTML = `<p class="muted">Geen komende wedstrijden gevonden.</p>`;
        } else {
          const ul = document.createElement("ul");
          ul.style.listStyle = "none";
          ul.style.padding = "0";
          upcoming.forEach(m => {
            const when = m._dt instanceof Date && !isNaN(m._dt)
              ? new Intl.DateTimeFormat("nl-NL", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(m._dt)
              : `${m.date} ${m.time || ""}`.trim();
            const li = document.createElement("li");
            li.style.padding = ".5rem 0";
            li.style.borderBottom = "1px dashed rgba(255,255,255,.12)";
            li.innerHTML = `
              <div><span class="muted">${when}</span> • <strong style="color:var(--accent)">${m.opponent || ""}</strong> <span class="muted">(${m.place || ""})</span></div>
            `;
            ul.appendChild(li);
          });
          nextBox.innerHTML = "";
          nextBox.appendChild(ul);
        }
      } catch (err) {
        console.error("[RBC] next5 build error", err);
        nextBox.innerHTML = `<p class="muted">Kon komende wedstrijden niet laden.</p>`;
      }
    }
  } catch (e) {
    console.error("[RBC] fixtures.json load error", e);
  }
})();

/* =========================================================
   Squad Loader
   - expects ./data/players.json
   - shape: { "players": [ ... ] }
   ========================================================= */
(async function initSquad() {
  const box = document.getElementById("squad-list");
  const empty = document.getElementById("squad-empty");
  if (!box) return;
  try {
    const res = await fetch("./data/players.json?v=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const payload = await res.json();
    const list = Array.isArray(payload) ? payload : (Array.isArray(payload.players) ? payload.players : []);

    if (!list.length) {
      if (empty) empty.style.display = "block";
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach(p => {
      const card = createEl("div", { className: "player" });
      if (p.number) {
        const badge = createEl("div", { className: "badge", textContent: "#" + p.number });
        card.appendChild(badge);
      }
      const img = createEl("img", {
        alt: (p.name || "Speler") + " foto",
        loading: "lazy",
        decoding: "async",
      });
      if (p.photo) img.src = p.photo;
      img.onerror = () => { img.style.display = "none"; };

      const h3 = createEl("h3", { textContent: p.name || "Speler" });

      card.appendChild(img);
      card.appendChild(h3);
      frag.appendChild(card);
    });
    box.innerHTML = "";
    box.appendChild(frag);
  } catch (e) {
    console.error("[RBC] players.json load error", e);
    if (empty) empty.style.display = "block";
  }
})();

/* =========================================================
   Latest tweet (text-only) — robust mirrors + Atom/RSS parsing
   ========================================================= */
(async function latestTweet() {
  const host = document.getElementById("latest-x");
  if (!host) return;

  const MIRRORS = [
    "https://nitter.net",
    "https://nitter.poast.org",
    "https://nitter.fdn.fr",
    "https://nitter.privacydev.net"
  ];
  const PROXY = "https://r.jina.ai/"; // CORS-friendly proxy
  const HANDLE = "RBCvoetbal";

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
      return d?.toLocaleString?.() || "";
    }
  };

  async function fetchFromMirror(base) {
    const url = `${PROXY}${base}/@${HANDLE}/rss`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }

  function parseLatest(xml) {
    // Try RSS first
    const item = (xml.match(/<item>[\s\S]*?<\/item>/i) || [])[0];
    if (item) {
      const title = ((item.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "").trim();
      const link = ((item.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || "").trim();
      const pub  = ((item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || "").trim();
      return { title: decode(title), link: decode(link), when: pub ? new Date(pub) : null };
    }
    // Fallback: Atom
    const entry = (xml.match(/<entry>[\s\S]*?<\/entry>/i) || [])[0];
    if (entry) {
      const content = ((entry.match(/<content[^>]*>([\s\S]*?)<\/content>/i) || [])[1] || "").trim();
      const summary = ((entry.match(/<summary>([\s\S]*?)<\/summary>/i) || [])[1] || "").trim();
      const title   = ((entry.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "").trim();
      const linkTag = (entry.match(/<link\b[^>]*>/i) || [])[0] || "";
      const href    = (linkTag.match(/\bhref="([^"]+)"/i) || [])[1] || `https://twitter.com/${HANDLE}`;
      const updated = ((entry.match(/<updated>([\s\S]*?)<\/updated>/i) || [])[1] || "").trim();
      return { title: decode(content || summary || title), link: decode(href), when: updated ? new Date(updated) : null };
    }
    return null;
  }

  try {
    host.innerHTML = "Laden…";
    let xml = null;
    for (const mirror of MIRRORS) {
      try {
        xml = await fetchFromMirror(mirror);
        if (xml) break;
      } catch (_) {
        // try next mirror
      }
    }

    host.innerHTML = ""; // clear loading text

    if (!xml) {
      host.innerHTML =
        '<p class="muted">Kon live update niet laden. <a href="https://twitter.com/RBCvoetbal" target="_blank" rel="noopener">@RBCvoetbal</a></p>';
      return;
    }

    const latest = parseLatest(xml);
    if (!latest || !latest.title) {
      host.innerHTML =
        '<p class="muted">Geen update gevonden. <a href="https://twitter.com/RBCvoetbal" target="_blank" rel="noopener">Bekijk @RBCvoetbal</a></p>';
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "x-item";
    wrap.innerHTML = `
      <div>${latest.title} <a href="${latest.link}" target="_blank" rel="noopener">lees verder →</a></div>
      <div class="x-meta">${latest.when ? formatDate(latest.when) : ""} • bron: @RBCvoetbal</div>
    `;
    host.appendChild(wrap);
  } catch (err) {
    console.error("[RBC] latest tweet load error", err);
    host.innerHTML =
      '<p class="muted">Kon live update niet laden. <a href="https://twitter.com/RBCvoetbal" target="_blank" rel="noopener">Open @RBCvoetbal</a></p>';
  }
})();
