/* === Utilities === */
function parseNLDate(dateStr, timeStr) {
  // dateStr "DD/MM/YYYY", timeStr "HH:MM" or ""
  const [d,m,y] = (dateStr || '').split('/').map(Number);
  let hh = 0, mm = 0;
  if (timeStr && timeStr.includes(':')) {
    const parts = timeStr.split(':').map(Number);
    hh = parts[0] || 0; mm = parts[1] || 0;
  }
  return new Date(y, (m||1)-1, d||1, hh, mm, 0, 0);
}

/* === Fixtures Loader === */
(async function initFixtures(){
  try {
    const res = await fetch('./data/fixtures.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const fixtures = await res.json();

    function fillTable(bodyId, list) {
      const tbody = document.getElementById(bodyId);
      if (!tbody) return;
      tbody.innerHTML = '';
      (list || []).forEach(f => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${f.round || ''}</td>
          <td>${f.date || ''}</td>
          <td>${f.time || ''}</td>
          <td>${f.place || ''}</td>
          <td>${f.opponent || ''}</td>
          <td>${f.result || ''}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    if (fixtures.cup) fillTable('cup-body', fixtures.cup);
    if (fixtures.league) fillTable('league-body', fixtures.league);

    // Next 5 (cup + league)
    (function fillNext5(){
      const box = document.getElementById('next5');
      if (!box) return;
      box.innerHTML = '';

      const now = new Date();
      const all = []
        .concat((fixtures.cup||[]).map(x => ({...x, comp:'Beker'})))
        .concat((fixtures.league||[]).map(x => ({...x, comp:'Derde Divisie B'})));

      const upcoming = all.filter(x => {
        const dt = parseNLDate(x.date, x.time);
        const isNotPlayed = (x.result || '').includes('-:-');
        return isNotPlayed || (dt.getTime() >= now.getTime());
      }).sort((a,b) => parseNLDate(a.date,a.time) - parseNLDate(b.date,b.time))
        .slice(0,5);

      if (!upcoming.length) {
        const li = document.createElement('li');
        li.className = 'muted';
        li.textContent = 'Geen komende wedstrijden.';
        box.appendChild(li);
        return;
      }

      upcoming.forEach(x => {
        const li = document.createElement('li');
        const date = x.date || '';
        const time = x.time || '';
        const place = x.place || '';
        const opp = x.opponent || '';
        const res = x.result || '-:-';
        li.innerHTML = `
          <div><strong>${opp}</strong> <span class="muted">(${x.comp}${x.round? ' • Ronde ' + x.round : ''})</span></div>
          <div class="muted">${date}${time ? ' • ' + time : ''} • ${place ? (place === 'H' ? 'Thuis' : 'Uit') : ''} — <span>${res}</span></div>
        `;
        box.appendChild(li);
      });
    })();

  } catch (e) {
    console.error('[RBC] fixtures.json load error', e);
  }
})();

/* === Squad Loader === */
(async function initSquad(){
  const box = document.getElementById('squad-list');
  const empty = document.getElementById('squad-empty');
  try {
    const res = await fetch('./data/players.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const payload = await res.json();
    const list = Array.isArray(payload) ? payload : (Array.isArray(payload.players) ? payload.players : []);
    if (!list.length) {
      if (empty) empty.style.display='block';
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'player';

      const img = document.createElement('img');
      img.alt = (p.name || 'Speler') + ' foto';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = p.photo || '';
      img.onerror = () => { img.style.display = 'none'; };

      const h3 = document.createElement('h3');
      h3.textContent = p.name || 'Speler';

      if (p.number) {
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = '#' + p.number;
        card.appendChild(badge);
      }

      card.appendChild(img);
      card.appendChild(h3);
      frag.appendChild(card);
    });
    box.appendChild(frag);
  } catch (e) {
    console.error('[RBC] players.json load error', e);
    if (empty) empty.style.display='block';
  }
})();

/* === Latest tweet (text-only, no widget, avoids 429) === */
(async function latestTweet(){
  const host = document.getElementById('latest-x');
  if (!host) return;

  // Helper to format date nicely
  function formatDate(d){
    try {
      return new Intl.DateTimeFormat('nl-NL', {
        weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'
      }).format(d);
    } catch { return d.toLocaleString(); }
  }

  // Try fetching via a public RSS->JSON converter of Nitter (no API key).
  const url = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://nitter.net/RBCvoetbal/rss');

  try {
    const res = await fetch(url, { cache:'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const item = (data.items && data.items[0]) || null;

    host.innerHTML = ''; // clear “Laden…”

    if (!item) {
      host.innerHTML = `<p class="muted">Geen update gevonden. <a href="https://twitter.com/RBCvoetbal" target="_blank" rel="noopener">Bekijk @RBCvoetbal</a></p>`;
      return;
    }

    const text = (item.title || item.description || '').replace(/<[^>]+>/g,'').trim();
    const link = item.link || 'https://twitter.com/RBCvoetbal';
    const when = item.pubDate ? new Date(item.pubDate) : null;

    const wrap = document.createElement('div');
    wrap.className = 'x-item';
    wrap.innerHTML = `
      <div>${text} <a href="${link}" target="_blank" rel="noopener">lees verder →</a></div>
      <div class="x-meta">${when ? formatDate(when) : ''} • bron: @RBCvoetbal</div>
    `;
    host.appendChild(wrap);

  } catch (err) {
    console.error('[RBC] latest tweet load error', err);
    host.innerHTML = `<p class="muted">Kon live update niet laden. <a href="https://twitter.com/RBCvoetbal" target="_blank" rel="noopener">Open @RBCvoetbal</a></p>`;
  }
})();
