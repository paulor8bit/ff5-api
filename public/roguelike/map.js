const mapTypes={normal:{label:'Batalha',icon:'⚔',detail:'Vença para receber uma recompensa.'},elite:{label:'Elite',icon:'✦',detail:'Inimigo mais forte. +40 gil ao vencer.'},rest:{label:'Acampamento',icon:'☾',detail:'Recupere 45% de HP, todo o MP e reviva aliados.'},shop:{label:'Loja',icon:'¤',detail:'Compre suprimentos, venda equipamentos e visite o curandeiro.'},recruit:{label:'Aliado',icon:'⊕',detail:'Encontre um personagem que pode se juntar ao grupo e ficar registrado.'},event:{label:'Evento',icon:'?',detail:'Faça uma escolha com custos e consequências para a run.'},treasure:{label:'Tesouro',icon:'▣',detail:'Escolha uma relíquia com efeito passivo para o grupo.'},boss:{label:'Guardião',icon:'◆',detail:'Conquiste o cristal e desbloqueie um job.'}};
let mapScroll=null;
function routeMap(){
  const available=new Set(E.availableNodes(run).map(n=>n.id));
  const visited=new Set(run.route.path),y=n=>70+(12-n.floor)*90;
  const lines=run.route.nodes.flatMap(n=>n.next.map(id=>{
    const next=run.route.nodes.find(m=>m.id===id),walked=visited.has(n.id)&&visited.has(id),open=n.id===run.route.current&&available.has(id);
    return `<path class="map-edge ${walked?'walked':''} ${open?'open':''}" d="M ${n.x*6} ${y(n)} C ${n.x*6} ${y(n)-45}, ${next.x*6} ${y(next)+45}, ${next.x*6} ${y(next)}"/>`;
  })).join('');
  return `<section class="route-map"><div class="map-heading"><div><small>CAMINHO DOS CRISTAIS</small><h1>${run.phase==='map'?'Escolha seu destino':'Rota da jornada'}</h1></div><span>${run.floor}/12 encontros</span></div><div class="map-scroll" tabindex="0" aria-label="Mapa da jornada. Role para explorar os quatro cristais."><div class="map-paper"><svg class="map-lines" viewBox="0 0 600 1120" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
  ${[3,6,9,12].map((floor,i)=>`<div class="act-label" style="top:${70+(12-floor)*90}px">${['I · VENTO','II · ÁGUA','III · FOGO','IV · TERRA'][i]}</div>`).join('')}
  ${run.route.nodes.map(n=>{const t=mapTypes[n.type],open=available.has(n.id),current=n.id===run.route.current;return `<button class="map-node ${n.type} ${visited.has(n.id)?'visited':''} ${current?'current':''} ${open?'available':''}" style="left:${n.x}%;top:${y(n)}px" data-node="${n.id}" data-tooltip="${escapeHtml(t.detail)}" ${open?'':'disabled'} aria-label="Encontro ${n.floor}: ${t.label}${open?' — disponível':current?' — você está aqui':visited.has(n.id)?' — visitado':' — indisponível'}"><span class="node-icon">${t.icon}</span><span class="node-label">${t.label}</span>${current?'<span class="you-marker">Você está aqui</span>':''}</button>`;}).join('')}
  <div class="map-start">▲ INÍCIO DA JORNADA ▲</div></div></div><div class="map-legend"><span>⚔ Batalha</span><span>✦ Elite</span><span>☾ Descanso</span><span>¤ Loja</span><span>? Evento</span><span>⊕ Aliado</span><span>▣ Tesouro</span><span>◆ Guardião</span></div><div class="map-help" role="status">${run.phase==='map'?'Siga uma rota iluminada. Cada escolha fecha os outros caminhos.':'Conclua o encontro atual para avançar. Role para explorar a jornada.'}</div>${menuOpen?`<div class="map-menu-overlay">${jobsMenu()}</div>`:''}</section>`;
}
function restoreMapScroll(){
  const scroll=app.querySelector?.('.map-scroll');if(!scroll)return;
  scroll.scrollTop=mapScroll??Math.max(0,70+(12-Math.min(12,run.floor+1))*90-scroll.clientHeight*.65);
  scroll.onscroll=()=>{mapScroll=scroll.scrollTop;};
}
