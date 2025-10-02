// Squad loader
(async function initSquad(){
  const box = document.getElementById('squad-list');
  const empty = document.getElementById('squad-empty');
  try {
    const res = await fetch('./data/players.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const players = await res.json();
    if (!Array.isArray(players) || players.length === 0) {
      empty.style.display='block';
      return;
    }
    const frag = document.createDocumentFragment();
    players.forEach(p => {
      const card = document.createElement('div');
      card.className='player';
      const h3 = document.createElement('h3');
      h3.textContent = p.name || 'Speler';
      const role = document.createElement('div');
      role.className='muted';
      role.textContent = p.position || '';
      card.appendChild(h3);
      card.appendChild(role);
      frag.appendChild(card);
    });
    box.appendChild(frag);
  } catch (e) {
    console.error('[RBC] players.json load error', e);
    empty.style.display='block';
  }
})();