// assets/script.js
(function () {
  // Footer year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Deterministic color from a seed (player name + number)
  function colorFromSeed(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const hue = h % 360;
    return `hsl(${hue} 60% 40%)`;
  }

  // Make an SVG <svg> element with initials (no external requests)
  function svgInitialsElement(name = "Player", seed = "rbc") {
    const parts = name.trim().split(/\s+/);
    const initials = ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
    const bg = colorFromSeed(seed);

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 600 600");
    svg.setAttribute("width", "600");
    svg.setAttribute("height", "600");
    Object.assign(svg.style, {
      width: "100%", borderRadius: ".6rem", marginBottom: ".5rem",
      aspectRatio: "1 / 1", objectFit: "cover", display: "block",
      border: "1px solid rgba(255,255,255,.1)"
    });

    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("width", "600");
    rect.setAttribute("height", "600");
    rect.setAttribute("fill", bg);

    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", "300");
    text.setAttribute("y", "312");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-family", "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif");
    text.setAttribute("font-weight", "800");
    text.setAttribute("font-size", "220");
    text.setAttribute("fill", "white");
    text.textContent = initials || "??";

    svg.appendChild(rect);
    svg.appendChild(text);
    return svg;
  }

  // Prefer p.photo (http/https). If missing, use inline SVG initials.
  function makePortrait(p, idx) {
    const seed = `${p?.name ?? "Player"}-${p?.number ?? idx}`;
    const hasPhoto = p?.photo && /^https?:\/\//.test(p.photo);

    if (!hasPhoto) return svgInitialsElement(p?.name, seed);

    const img = document.createElement("img");
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = p?.name || "Player";
    img.src = p.photo;
    Object.assign(img.style, {
      width: "100%", borderRadius: ".6rem", marginBottom: ".5rem",
      aspectRatio: "1 / 1", objectFit: "cover", border: "1px solid rgba(255,255,255,.1)"
    });
    img.addEventListener("error", () => {
      // If external photo fails, fallback to SVG initials (guaranteed to render)
      const svg = svgInitialsElement(p?.name, seed);
      img.replaceWith(svg);
    });
    return img;
  }

  async function loadPlayers() {
    const container = document.getElementById("squad-list");
    if (!container) return;

    try {
      // Bust cache to avoid stale JSON on GitHub Pages
      const res = await fetch(`./data/players.json?v=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`players.json HTTP ${res.status}`);
      const data = await res.json();
      if (!data || !Array.isArray(data.players)) throw new Error('Missing "players" array');

      const players = data.players.slice().sort((a, b) => (a.number || 0) - (b.number || 0));
      container.innerHTML = "";

      players.forEach((p, i) => {
        const card = document.createElement("div");
        card.className = "player";

        const portrait = makePortrait(p, i);
        const badge = `<span class="badge">${p?.position ?? ""}</span>`;
        const title = `<h3>#${p?.number ?? ""} ${p?.name ?? ""}</h3>`;
        const meta = `<p class="muted">${p?.nationality ?? ""}</p>`;

        card.appendChild(portrait);
        card.insertAdjacentHTML("beforeend", `${badge}${title}${meta}`);
        container.appendChild(card);
      });

      if (players.length === 0) {
        container.innerHTML = `<p class="muted">No players found. Check <span class="code">data/players.json</span>.</p>`;
      }
    } catch (err) {
      console.error("[RBC] Failed to load players:", err);
      container.innerHTML = `<p class="muted">Couldn’t load players. Make sure <span class="code">data/players.json</span> exists and is valid JSON.</p>`;
    }
  }

  // Simple news placeholder
  function loadNews() {
    const list = document.getElementById("news-list");
    const stamp = document.getElementById("news-date");
    if (!list) return;
    const items = [
      { title: "RBC update", url: "https://www.rbcvoetbal.nl/", date: new Date().toISOString().slice(0, 10) }
    ];
    if (stamp) stamp.textContent = `Last refreshed: ${new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" })}`;
    list.innerHTML = items.map(n => `<li><a target="_blank" href="${n.url}">${n.title}</a> <span class="muted">(${n.date})</span></li>`).join("");
  }

  loadPlayers();
  loadNews();
})();
