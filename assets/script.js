// assets/script.js
// Site basics: footer year, players with photos, simple news placeholder.

(function () {
  // --- Footer year ---
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Utilities ---
  const fallbackAvatar =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="100%" height="100%" fill="#0e1224"/>
        <circle cx="100" cy="80" r="42" fill="#1c254a"/>
        <rect x="36" y="132" width="128" height="40" rx="20" fill="#1c254a"/>
      </svg>`
    );

  function imgWithFallback(src, alt) {
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = alt || '';
    img.src = src || fallbackAvatar;
    img.onerror = () => (img.src = fallbackAvatar);
    img.style.width = '100%';
    img.style.borderRadius = '.6rem';
    img.style.marginBottom = '.5rem';
    img.style.aspectRatio = '1 / 1';
    img.style.objectFit = 'cover';
    return img;
  }

  // --- Players ---
  async function loadPlayers() {
    const list = document.getElementById('squad-list');
    if (!list) return;

    try {
      const res = await fetch('./data/players.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      list.innerHTML = '';

      // Sort by jersey number (optional; comment out if you prefer your own order)
      const players = Array.isArray(data.players) ? data.players.slice().sort((a, b) => (a.number || 0) - (b.number || 0)) : [];

      players.forEach((p) => {
        const card = document.createElement('div');
        card.className = 'player';

        // Build card content
        const img = imgWithFallback(p.photo, p.name);
        const badge = `<span class="badge">${p.position || ''}</span>`;
        const title = `<h3>#${p.number ?? ''} ${p.name ?? ''}</h3>`;
        const meta = `<p class="muted">${p.nationality || ''}</p>`;

        card.appendChild(img);
        card.insertAdjacentHTML('beforeend', `${badge}${title}${meta}`);
        list.appendChild(card);
      });

      if (players.length === 0) {
        list.innerHTML = `<p class="muted">No players found. Check <span class="code">data/players.json</span>.</p>`;
      }
    } catch (e) {
      console.error('Failed to load players:', e);
      const list = document.getElementById('squad-list');
      if (list) {
        list.innerHTML = `<p class="muted">Couldn’t load players. Make sure <span class="code">data/players.json</span> exists and is valid JSON.</p>`;
      }
    }
  }

  // --- News (placeholder you can wire up later) ---
  async function loadNews() {
    const list = document.getElementById('news-list');
    const stamp = document.getElementById('news-date');
    if (!list) return;

    try {
      // Placeholder – replace with your own data/news.json in the future
      const fallback = [
        { title: 'RBC update', url: 'https://www.rbcvoetbal.nl/', date: new Date().toISOString().slice(0, 10) }
      ];

      if (stamp) {
        stamp.textContent = `Last refreshed: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}`;
      }
      list.innerHTML = fallback
        .map((n) => `<li><a target="_blank" href="${n.url}">${n.title}</a> <span class="muted">(${n.date})</span></li>`)
        .join('');
    } catch (e) {
      console.error('Failed to load news:', e);
    }
  }

  // Kick off
  loadPlayers();
  loadNews();
})();

