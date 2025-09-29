// assets/script.js
(function () {
  function colorFromSeed(seed){let h=0;for(let i=0;i<seed.length;i++)h=(h*31+seed.charCodeAt(i))>>>0;const hue=h%360;return `hsl(${hue} 60% 40%)`;}
  function svgInitialsElement(name="Player",seed="rbc"){
    const parts=name.trim().split(/\s+/);
    const initials=((parts[0]?.[0]||"")+(parts[parts.length-1]?.[0]||"")).toUpperCase();
    const bg=colorFromSeed(seed);
    const svgNS="http://www.w3.org/2000/svg";
    const svg=document.createElementNS(svgNS,"svg");svg.setAttribute("viewBox","0 0 600 600");
    Object.assign(svg.style,{width:"100%",borderRadius:".6rem",marginBottom:".5rem",aspectRatio:"1 / 1",objectFit:"cover",display:"block",border:"1px solid rgba(255,255,255,.1)"});
    const rect=document.createElementNS(svgNS,"rect");rect.setAttribute("width","600");rect.setAttribute("height","600");rect.setAttribute("fill",bg);
    const text=document.createElementNS(svgNS,"text");text.setAttribute("x","300");text.setAttribute("y","312");text.setAttribute("text-anchor","middle");text.setAttribute("dominant-baseline","middle");text.setAttribute("font-family","Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif");text.setAttribute("font-weight","800");text.setAttribute("font-size","220");text.setAttribute("fill","white");text.textContent=initials||"??";
    svg.append(rect,text);return svg;
  }
  function makePortrait(p,idx){
    const seed=`${p?.name??"Player"}-${p?.number??idx}`;
    const hasPhoto=p?.photo && /^https?:\/\//.test(p.photo);
    if(!hasPhoto) return svgInitialsElement(p?.name,seed);
    const img=document.createElement("img");
    Object.assign(img,{loading:"lazy",decoding:"async",alt:p?.name||"Player",src:p.photo});
    Object.assign(img.style,{width:"100%",borderRadius:".6rem",marginBottom:".5rem",aspectRatio:"1 / 1",objectFit:"cover",border:"1px solid rgba(255,255,255,.1)"});
    img.addEventListener("error",()=>{img.replaceWith(svgInitialsElement(p?.name,seed));});
    return img;
  }
  async function loadPlayers(){
    const container=document.getElementById("squad-list"); if(!container) return;
    try{
      const res=await fetch("./data/players.json?v="+Date.now(),{cache:"no-store"});
      if(!res.ok) throw new Error("players.json "+res.status);
      const data=await res.json();
      if(!data || !Array.isArray(data.players)) throw new Error('Missing "players" array');
      const players=data.players.slice().sort((a,b)=>(a.number||0)-(b.number||0));
      container.innerHTML="";
      players.forEach((p,i)=>{
        const card=document.createElement("div"); card.className="player";
        const portrait=makePortrait(p,i);
        const badge=`<span class="badge">${p?.position??""}</span>`;
        const title=`<h3>#${p?.number??""} ${p?.name??""}</h3>`;
        const meta=`<p class="muted">${p?.nationality??""}</p>`;
        card.appendChild(portrait); card.insertAdjacentHTML("beforeend",`${badge}${title}${meta}`);
        container.appendChild(card);
      });
      if(!players.length) container.innerHTML=`<p class="muted">No players found.</p>`;
    }catch(e){
      console.error("[RBC] players failed",e); container.innerHTML=`<p class="muted">Kon spelers niet laden.</p>`;
    }
  }
  loadPlayers();
})();