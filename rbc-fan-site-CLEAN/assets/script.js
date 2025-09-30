// assets/script.js
(function () {
  function colorFromSeed(seed){let h=0;for(let i=0;i<seed.length;i++)h=(h*31+seed.charCodeAt(i))>>>0;return h%360;}
  function initials(name){const p=(name||'').trim().split(/\s+/); return ((p[0]?.[0]||'')+(p[p.length-1]?.[0]||'')).toUpperCase();}
  function placeholder(name,seed){const h=colorFromSeed(seed);const svg=`<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="600" fill="hsl(${h} 60% 40%)"/><text x="300" y="312" text-anchor="middle" dominant-baseline="middle" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="220" fill="#fff">${initials(name)||'??'}</text></svg>`;const img=document.createElement('img');img.alt=name||'Player';img.decoding='async';img.loading='lazy';img.src='data:image/svg+xml;utf8,'+encodeURIComponent(svg);img.style.width='100%';img.style.borderRadius='.6rem';img.style.marginBottom='.5rem';img.style.aspectRatio='1/1';img.style.objectFit='cover';img.style.border='1px solid rgba(255,255,255,.1)';return img;}
  function portrait(p,idx){const ok=p?.photo && /^https?:\/\//.test(p.photo);const seed=(p?.name||'Player')+'-'+(p?.number??idx);if(!ok){return placeholder(p?.name,seed);}const img=document.createElement('img');img.src=p.photo;img.alt=p?.name||'Player';img.loading='lazy';img.decoding='async';img.style.width='100%';img.style.borderRadius='.6rem';img.style.marginBottom='.5rem';img.style.aspectRatio='1/1';img.style.objectFit='cover';img.style.border='1px solid rgba(255,255,255,.1)';img.addEventListener('error',()=>{img.replaceWith(placeholder(p?.name,seed));});return img;}
  async function loadPlayers(){
    const box=document.getElementById('squad-list'); if(!box) return;
    try{
      const res=await fetch('./data/players.json?v='+Date.now(),{cache:'no-store'});
      if(!res.ok) throw new Error('players.json '+res.status);
      const data=await res.json();
      const players=(data?.players||[]).slice().sort((a,b)=>(a.number||0)-(b.number||0));
      box.innerHTML='';
      players.forEach((p,i)=>{
        const card=document.createElement('div');card.className='player';
        const img=portrait(p,i);
        const title=document.createElement('h3');title.textContent='#'+(p.number||'')+' '+(p.name||'');
        const meta=document.createElement('p');meta.className='muted';meta.textContent=(p.position||'')+' · '+(p.nationality||'');
        card.append(img,title,meta); box.append(card);
      });
      if(!players.length) box.innerHTML='<p class="muted">No players found.</p>';
    }catch(e){ console.error('[RBC] players load failed',e); box.innerHTML='<p class="muted">Kon spelers niet laden.</p>'; }
  }
  loadPlayers();
})();