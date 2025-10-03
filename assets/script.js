/* ============================
   Fixtures Loader (+ Next 5)
   ============================ */
(async function initFixtures(){
  try {
    const res = await fetch('./data/fixtures.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    function fillTable(bodyId, fixtures) {
      const tbody = document.getElementById(bodyId);
      if (!tbody) return;
      tbody.innerHTML = '';
      fixtures.forEach(f => {
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

    // Tables
    if (data.cup) fillTable('cup-body', data.cup);
    if (data.league) fillTable('league-body', data.league);

    // Next 5 (cup + league)
    const all = []
      .concat(Array.isArray(data.league) ? data.league : [])
      .concat(Array.isArray(data.cup) ? data.cup : []);

    const parseNL = (d) => {
      // expect DD/MM/YYYY
      if (!d || typeof d !== 'string') return null;
      const [dd, mm, yyyy] = d.split('/').map(Number);
      if (!dd || !mm || !yyyy) return null;
      return new Date(yyyy, mm - 1, dd);
    };

    const now = new Date();
    const upcoming = all
      .map(f => ({ ...f, _date: parseNL(f.date) }))
      .filter(f => {
        if (!f._date) return false;
        // show if in the future OR result is blank / "-:-"
        const future = f._date >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const noScore = !f.result || f.result.trim() === '-:-';
        return future || noScore;
      })
      .sort((a,b) => (a._date - b._date))
      .slice(0,5);

    const next5 = document.getElementById('next5');
    if (next5) {
      next5.innerHTML = '';
      if (!upcoming.length) {
        next5.innerHTML = '<li class="muted">Geen komende wedstrijden gevonden.</li>';
      } else {
        upcoming.forEach(m => {
          const li = document.createElement('li');
          li.innerHTML = `
            <span>${m.date || ''} ${m.time || ''} • ${m.place || ''}</span>
            &nbsp;—&nbsp;<strong>${m.opponent || ''}</strong>
          `;
          next5.appendChild(li);
        });
      }
    }
  } catch (e) {
    console.error('[RBC] fixtures.json load error', e);
  }
})();


/* ============================
   Squad Loader
   ============================ */
(async function initSquad(){
  const box = document.getElementById('squad-list');
  const empty = document.getElementById('squad-empty');
  try {
    const res = await fetch('./data/players.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const payload = await res.json();
    const list = Array.isArray(payload) ? payload : (Array.isArray(payload.players) ? payload.players : []);

    if (!list.length) {
      if (empty) empty.style.display = 'block';
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

    if (box) box.appendChild(frag);

  } catch (e) {
    console.error('[RBC] players.json load error', e);
    if (empty) empty.style.display = 'block';
  }
})();


/* ============================
   Twitter / X Embed (robust)
   ============================ */
(function initTwitterEmbed(){
  // If user removed the block, do nothing.
  const anchor = document.querySelector('a.twitter-timeline[href*="twitter.com/RBCvoetbal"]');
  if (!anchor) return;

  // If twttr is present, just (re)load.
  function loadWidget(){
    try {
      if (window.twttr && window.twttr.widgets && typeof window.twttr.widgets.load === 'function') {
        window.twttr.widgets.load();
        return true;
      }
    } catch(e){ /* noop */ }
    return false;
  }

  // Inject the script if not there
  function ensureScript(cb){
    if (window.twttr && window.twttr.widgets) {
      cb && cb();
      return;
    }
    if (!document.querySelector('script[src*="platform.twitter.com/widgets.js"]')) {
      const s = document.createElement('script');
      s.src = 'https://platform.twitter.com/widgets.js';
      s.async = true;
      s.charset = 'utf-8';
      s.onload = cb;
      document.body.appendChild(s);
    } else {
      // script tag exists but maybe not executed yet
      setTimeout(cb, 500);
    }
  }

  // Try now, then retry a couple of times if blocked by extensions
  if (!loadWidget()) {
    ensureScript(() => {
      let attempts = 0;
      const maxAttempts = 5;
      const tick = () => {
        attempts++;
        if (loadWidget()) return;
        if (attempts < maxAttempts) setTimeout(tick, 800);
      };
      tick();
    });
  }
})();
