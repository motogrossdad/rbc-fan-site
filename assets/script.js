// === Fixtures Loader ===
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

    if (data.cup) fillTable('cup-body', data.cup);
    if (data.league) fillTable('league-body', data.league);

  } catch (e) {
    console.error('[RBC] fixtures.json load error', e);
  }
})();

    // === Next 5 fixtures ===
    const now = new Date();
    let all = [];
    if (Array.isArray(data.cup)) all = all.concat(data.cup);
    if (Array.isArray(data.league)) all = all.concat(data.league);

    // Parse date & time
    const parsed = all.map(f => {
      const dt = f.date && f.time ? new Date(f.date.split('/').reverse().join('-') + 'T' + (f.time || '00:00')) : null;
      return { ...f, datetime: dt };
    }).filter(f => f.datetime && f.datetime >= now);

    parsed.sort((a, b) => a.datetime - b.datetime);
    const next5 = parsed.slice(0, 5);

    const list = document.getElementById('next-list');
    const empty = document.getElementById('next-empty');
    if (next5.length === 0) {
      empty.style.display = 'block';
    } else {
      const frag = document.createDocumentFragment();
      next5.forEach(f => {
        const li = document.createElement('li');
        li.textContent = `${f.date} ${f.time} — ${f.opponent} (${f.place})`;
        frag.appendChild(li);
      });
      list.appendChild(frag);
    }

// === Squad Loader ===
(async function initSquad(){
  const box = document.getElementById('squad-list');
  const empty = document.getElementById('squad-empty');
  try {
    const res = await fetch('./data/players.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (Array.isArray(data.players) ? data.players : []);

    if (!list.length) {
      empty.style.display = 'block';
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
    empty.style.display = 'block';
  }
})();
