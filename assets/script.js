// Squad loader
(async function initSquad(){
  const box = document.getElementById('squad-list');
  const empty = document.getElementById('squad-empty');
  try {
    const res = await fetch('./data/players.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (Array.isArray(data.players) ? data.players : []);
    if (!list.length) {
      empty.style.display='block';
      return;
    }

    const frag = document.createDocumentFragment();

    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'player';

      // Badge overlay
      if (p.number) {
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = p.number;
        card.appendChild(badge);
      }

      // Photo
      if (p.photo) {
        const img = document.createElement('img');
        img.alt = (p.name || 'Speler') + ' foto';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.src = p.photo;
        img.onerror = () => { img.style.display='none'; };
        card.appendChild(img);
      }

      // Name
      const h3 = document.createElement('h3');
      h3.textContent = p.name || 'Speler';
      card.appendChild(h3);

      frag.appendChild(card);
    });

    box.appendChild(frag);

  } catch (e) {
    console.error('[RBC] players.json load error', e);
    empty.style.display='block';
  }
})();
