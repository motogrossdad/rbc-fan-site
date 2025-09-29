// Minimal JS: render year, load players, light news example.
document.getElementById('year').textContent = new Date().getFullYear();

async function loadPlayers() {
  try {
    const res = await fetch('./data/players.json', { cache: 'no-store' });
    const data = await res.json();

    const list = document.getElementById('squad-list');
    list.innerHTML = '';

    data.players.forEach(p => {
      const el = document.createElement('div');
      el.className = 'player';
      el.innerHTML = `
        <span class="badge">${p.position}</span>
        <h3>#${p.number} ${p.name}</h3>
        <p class="muted">${p.nationality || ''}</p>
      `;
      list.appendChild(el);
    });
  } catch (e) {
    console.error('Failed to load players', e);
  }
}

async function loadNews() {
  try {
    // Placeholder local "latest" items; wire your own script/GitHub Action to update data/news.json
    const fallback = [
      { title: "Match report: Scheveningen 3–1 RBC", url: "https://www.rbcvoetbal.nl/", date: "2025-09-27" }
    ];
    const list = document.getElementById('news-list');
    document.getElementById('news-date').textContent = `Last refreshed: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}`;

    list.innerHTML = fallback.map(n => `<li><a target="_blank" href="${n.url}">${n.title}</a> <span class="muted">(${n.date})</span></li>`).join('');
  } catch (e) {
    console.error('Failed to load news', e);
  }
}

loadPlayers();
loadNews();
