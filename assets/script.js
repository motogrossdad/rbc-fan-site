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
