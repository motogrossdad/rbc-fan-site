/* === Utilities === */
function parseNLDate(dateStr, timeStr) {
  // dateStr "DD/MM/YYYY", timeStr "HH:MM" or ""
  const [d,m,y] = (dateStr || '').split('/').map(Number);
  let hh = 0, mm = 0;
  if (timeStr && timeStr.includes(':')) {
    const parts = timeStr.split(':').map(Number);
    hh = parts[0] || 0; mm = parts[1] || 0;
  }
  // Construct as local time
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

    // Next 5 from cup+league (future or not-yet-played)
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
        // Show if result looks not played "-:-" OR date/time in the future
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

/* === X/Twitter On-Demand + RSS Fallback === */
(function setupTwitterOnDemand(){
  const btn = document.getElementById('load-x');
  const statusEl = document.getElementById('tw-status');
  const wrap = document.getElementById('tw-container');
  const fallbackNote = document.getElementById('tw-fallback');
  const rssList = document.getElementById('tw-rss');
  if (!btn || !wrap) return;

  async function renderRSSFallback() {
    try {
      // Use a public RSS->JSON converter (may rate limit if hammered).
      const url = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://nitter.net/RBCvoetbal/rss');
      const res = await fetch(url);
      if (!res.ok) throw new Error('RSS HTTP ' + res.status);
      const data = await res.json();
      const items = (data.items || []).slice(0,5);
      if (!items.length) throw new Error('Geen items');

      rssList.innerHTML = '';
      items.forEach(it => {
        const li = document.createElement('li');
        li.className = 'tw-item';
        // Minimal clean up of content
        const text = it.title || it.description || '';
        const link = it.link || 'https://twitter.com/RBCvoetbal';
        li.innerHTML = `<a href="${link}" target="_blank" rel="noopener">${text}</a>`;
        rssList.appendChild(li);
      });

      fallbackNote.style.display = 'block';
      rssList.style.display = 'block';
      statusEl.textContent = 'Tekstuele updates getoond (fallback).';
    } catch (err) {
      console.error('RSS fallback error:', err);
      fallbackNote.style.display = 'block';
      rssList.style.display = 'none';
      statusEl.textContent = 'Kon geen live updates laden.';
    }
  }

  function injectTimeline(){
    btn.disabled = true;
    statusEl.textContent = 'Bezig met laden…';
    fallbackNote.style.display = 'none';
    rssList.style.display = 'none';

    // Create anchor for widgets.js to transform
    const a = document.createElement('a');
    a.className = 'twitter-timeline';
    a.href = 'https://twitter.com/RBCvoetbal';
    a.setAttribute('data-height','650');
    a.setAttribute('data-theme','dark');
    a.setAttribute('data-dnt','true');
    a.setAttribute('data-chrome','noheader nofooter noborders transparent');
    a.textContent = 'Tweets by @RBCvoetbal';
    wrap.innerHTML = '';
    wrap.appendChild(a);

    let triedRSS = false;

    function tryRSSOnce() {
      if (triedRSS) return;
      triedRSS = true;
      renderRSSFallback();
      btn.disabled = false;
      btn.textContent = 'Opnieuw proberen';
    }

    // Load widgets.js (once)
    if (!document.querySelector('script[src*="platform.twitter.com/widgets.js"]')) {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://platform.twitter.com/widgets.js';
      s.charset = 'utf-8';
      s.onload = () => {
        if (window.twttr && window.twttr.widgets) window.twttr.widgets.load(wrap);
      };
      s.onerror = tryRSSOnce;
      document.body.appendChild(s);
    } else if (window.twttr && window.twttr.widgets && window.twttr.widgets.load) {
      window.twttr.widgets.load(wrap);
    }

    // If after ~6s no iframe appeared, assume 429/blocked and fallback to RSS.
    setTimeout(() => {
      const iframe = wrap.querySelector('iframe');
      if (!iframe) {
        statusEl.textContent = 'X geblokkeerd of tijdelijk beperkt – toon tekstuele updates.';
        tryRSSOnce();
      } else {
        statusEl.textContent = 'Live tweets geladen.';
      }
    }, 6000);
  }

  btn.addEventListener('click', injectTimeline);
})();
