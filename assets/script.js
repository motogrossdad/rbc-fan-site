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

    if (data.cup && Array.isArray(data.cup)) fillTable('cup-body', data.cup);
    if (data.league && Array.isArray(data.league)) fillTable('league-body', data.league);

    // Next 5 fixtures box (from league entries with "-:-")
    const nextBox = document.getElementById('next5');
    if (nextBox && Array.isArray(data.league)) {
      const upcoming = data.league.filter(f => (f.result || '').trim() === '-:-').slice(0, 5);
      nextBox.innerHTML = '';
      if (upcoming.length) {
        const ul = document.createElement('ul');
        upcoming.forEach(f => {
          const li = document.createElement('li');
          li.textContent = `${f.date} ${f.time || ''} — ${f.opponent} (${f.place})`;
          ul.appendChild(li);
        });
        nextBox.appendChild(ul);
      } else {
        nextBox.textContent = 'Geen komende wedstrijden.';
      }
    }
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
    const json = await res.json(); // <— important: use `json`, not `data`
    const list = Array.isArray(json) ? json : (Array.isArray(json.players) ? json.players : []);

    if (!list.length) {
      empty.style.display = 'block';
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'player';

      if (p.number) {
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = '#' + p.number;
        card.appendChild(badge);
      }

      const img = document.createElement('img');
      img.alt = (p.name || 'Speler') + ' foto';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = p.photo || '';
      img.onerror = () => { img.style.display = 'none'; };
      card.appendChild(img);

      const h3 = document.createElement('h3');
      h3.textContent = p.name || 'Speler';
      card.appendChild(h3);

      frag.appendChild(card);
    });

    box.innerHTML = '';
    box.appendChild(frag);

  } catch (e) {
    console.error('[RBC] players.json load error', e);
    empty.style.display = 'block';
  }
})();
