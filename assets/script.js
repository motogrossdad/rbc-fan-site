// assets/script.js
(function () {
  // Footer year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Very visible fallback avatar (light on dark)
  const FALLBACK_DATA_URI =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
        <rect width="100%" height="100%" fill="#eef2f7"/>
        <circle cx="150" cy="120" r="70" fill="#cfd7ea"/>
        <rect x="70" y="210" width="160" height="50" rx="25" fill="#cfd7ea"/>
      </svg>`
    );

  // If a player has no photo, use a deterministic picsum so caching isn't a problem
  const fallbackPhotoFor = (seed) => `https://picsum.photos/seed/${encodeURIComponent(seed || 'rbc')}/300`;

  function makeImg(src, alt) {
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = alt || '';
    img.src = src || FALLBACK_DATA_URI;
    // show a border so you can see the image box even on dark cards
    Object.assign(img.style, {
      width: '100%', borderRadius: '.6rem', marginBottom: '.5rem',
      aspectRatio: '1 / 1', objectFit: 'cover', border: '1px solid rgba(0,0,0,.08)'
    });
    img.addEventListener('error', () => { img.src = FALLBACK_DATA_URI; });
    return img;
  }

  async function loadPlayers() {
    const container = document.getElementById('squad-list');
    if (!container) return;

    try {
      // Important: no-store & unique query kill stale cache on GitHub Pages
      const res = await fetch(`./data/players.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`players.json HTTP ${res.status}`);
      const data = await res.json();

      if (!data || !Array.isArray(data.players)) {
        throw new Error('players.json missing "players" array');
      }

      const players = data.players.slice().sort((a, b) => (a.number || 0) - (b.number || 0));
      container.innerHTML = '';

      players.forEach((p, i) => {
        const card = document.createElement('div');
        card.className = 'player';

        const safeName = p?.name ?? `Player ${i + 1}`;
        const imgUrl = p?.photo && String(p.photo).startsWith('http')
          ? p.photo
          : fallbackPhotoFor(`${safeName}-${p?.number ?? i}`);

        const img = makeImg(imgUrl, safeName);
        const badge = `<span class="badge">${p?.position ?? ''}</span>`;
        const title = `<h3>#${p?.number ?? ''} ${safeName}</h3>`;
        const meta = `<p class="muted">${p?.nationality ?? ''}</p>`;

        card.appendChild(img);
        card.insertAdjacentHTML('beforeend', `${badge}${title}${meta}`);
        container.appendChild(card);
      });

      if (players.length === 0) {
        container.innerHTML = `<p class="muted">No players found. Check <span class="code">data/players.json</span>.</p>`;
      }
    } catch (err) {
      console.error('[RBC] Failed to load players:', err);
      const container = document.getElementById('squad-list');
      if (container) {
        container.innerHTML = `
          <p class="muted">
            Couldn’t load players. Ensure <span class="code">/data/players.json</span> exists,
            is valid JSON, and this site has that exact path.
          </p>`;
      }
    }
  }

  // Simple news placeholder
  function loadNews() {
    const list = document.getElementById('news-list');
    const stamp = document.getElementById('news-date');
    if (!list) return;
    const items = [
      { title: 'RBC update', url: 'https://www.rbcvoetbal.nl/', date: new Date().toISOString().slice(0, 10) }
    ];
    if (stamp) stamp.textContent = `Last refreshed: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}`;
    list.innerHTML = items.map(n => `<li><a target="_blank" href="${n.url}">${n.title}</a> <span class="muted">(${n.date})</span></li>`).join('');
  }

  loadPlayers();
  loadNews();
})();
