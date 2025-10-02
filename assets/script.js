/* ---------- Fixtures loader ---------- */
(async function initFixtures(){
  try {
    const res = await fetch('./data/fixtures.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    const render = (rows, tbodyId) => {
      const tbody = document.getElementById(tbodyId);
      if (!tbody) return;
      const frag = document.createDocumentFragment();
      rows.forEach(r => {
        const tr = document.createElement('tr');

        const td = (text) => {
          const el = document.createElement('td');
          el.textContent = text ?? '';
          return el;
        };

        tr.appendChild(td(r.round));
        tr.appendChild(td(r.date));
        tr.appendChild(td(r.time));
        tr.appendChild(td(r.place));
        tr.appendChild(td(r.opponent));
        tr.appendChild(td(r.result || '-:-'));

        frag.appendChild(tr);
      });
      tbody.innerHTML = '';
      tbody.appendChild(frag);
    };

    render(data.cup || [], 'cup-body');
    render(data.league || [], 'league-body');

  } catch (e) {
    console.error('[RBC] fixtures.json load error', e);
  }
})();

/* ---------- Squad loader ---------- */
(async function initSquad(){
  const box = document.getElementById('squad-list');
  const empty = document.getElementById('squad-empty');

  try {
    const res = await fetch('./data/players.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();
    const list = Array.isArray(data) ? data : (Array.isArray(data.players) ? data.players : []);

    if (!list.length) {
      if (empty) empty.style.display = 'block';
      return;
    }

    const frag = document.createDocumentFragment();

    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'player';

      // Player photo
      if (p.photo) {
        const img = document.createElement('img');
        img.alt = (p.name || 'Speler') + ' foto';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.src = p.photo;
        img.onerror = () => { img.style.display = 'none'; };
        card.appendChild(img);
      }

      // Number badge
      if (p.number) {
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = p.number;
        card.appendChild(badge);
      }

      // Player name
      const h3 = document.createElement('h3');
      h3.textContent = p.name || 'Speler';
      card.appendChild(h3);

      // Nationality (optional meta)
      if (p.nationality) {
        const meta = document.createElement('div');
        meta.className = 'muted';
        meta.textContent = p.nationality;
        card.appendChild(meta);
      }

      frag.appendChild(card);
    });

    box.innerHTML = '';
    box.appendChild(frag);

  } catch (e) {
    console.error('[RBC] players.json load error', e);
    if (empty) empty.style.display = 'block';
  }
})();
