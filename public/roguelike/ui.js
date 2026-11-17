/* SNES battle presentation. Layout inspired by cafeTechne/Final-Fantasy-CSS.
   Local styles and assets: no runtime CDN or third-party widget JavaScript. */
let menuOpen=false, mapPreview=false;
// GIF headers verified locally; other files in images/monsters contain HTML.
const validSpriteIds=new Set(['boss_132','boss_229','boss_306','boss_307','boss_315','monster_019','monster_025','monster_036','monster_037','monster_045','monster_055','monster_056','monster_057','monster_071','monster_073','monster_084','monster_092','monster_096','monster_097','monster_106','monster_119','monster_164','monster_180','monster_181','monster_207','monster_216','monster_220','monster_261','monster_280','monster_301','monster_313','monster_314','monster_322','monster_336','monster_337','monster_345']);
const windowPanel=(classes,html)=>`<section class="ff-window ${classes}"><div class="ff-window-content">${html}</div></section>`;
function actorSprite(member,pose='idle'){
  return `<img class="actor-sprite pose-${pose}" src="/img/characters/${member.sprite}/freelancer/${pose==='idle'?'victory-still.png':pose+'.gif'}?v=facing-right-2" alt="${escapeHtml(member.name)}">`;
}
function enemySprite(monster){
  if(validSpriteIds.has(monster.id))return `<img class="monster-sprite" src="/img/monsters/${monster.id}.gif" alt="${escapeHtml(nameOf(monster.name))}">`;
  // Preserve old saves without displaying an unrelated monster from the sprite sheet.
  return `<svg class="monster-sprite" viewBox="0 0 64 64" role="img" aria-label="${escapeHtml(nameOf(monster.name))}" shape-rendering="crispEdges"><path fill="#19242c" stroke="#869b8e" stroke-width="2" d="M8 52V24h8V12l12 8h8l12-8v12h8v28H42V40H22v12Z"/><path fill="#f3d875" d="M20 26h8v6h-8zm16 0h8v6h-8z"/></svg>`;
}
function battlefield(){
  const effect=currentBattleEffect(),battle=run.phase==='battle'||!!effect,finished=!effect&&(run.phase==='reward'||run.phase==='won');
  return `<div class="battlefield"><div class="sky"></div><div class="mountains far"></div><div class="mountains near"></div><div class="forest"></div><div class="ground"></div><div class="field-shadow"></div>
  <div class="battle-banner">${battle?(run.encounter==='boss'?'GUARDIÃO DO CRISTAL':run.encounter==='elite'?'ENCONTRO ELITE':'BATALHA'):run.phase==='map'?'CAMINHO DOS CRISTAIS':finished?'VITÓRIA':run.phase==='camp'?'ACAMPAMENTO':run.phase==='shop'?'CARAVANA':run.phase==='recruit'?'NOVO ALIADO':run.phase==='event'?'EVENTO':run.phase==='treasure'?'TESOURO':'FIM DA JORNADA'}</div>
  <div class="enemy-formation">${battle?run.enemies.map((m,i)=>`<button class="field-enemy ${m.hp<=0?'fallen':''} ${effectClasses('enemy',i)} ${pendingAction?.side==='enemy'&&(pendingAction.all||pendingAction.index===i)?'targeted':''}" data-target="${i}" aria-label="Alvo: ${escapeHtml(nameOf(m.name))}" ${m.hp<=0?'disabled':''}>${enemySprite(m)}${effectOverlay('enemy',i)}<span class="enemy-health"><span class="enemy-health-value">HP ${Math.max(0,m.hp)} / ${m.maxHp}</span><span class="enemy-health-track"><span style="width:${Math.max(0,Math.min(100,m.hp/m.maxHp*100))}%"></span></span></span><span class="target-arrow">▼</span></button>`).join(''):`<div class="field-crystal"><svg viewBox="0 0 40 64" aria-hidden="true"><path fill="#9bedff" d="M20 0 38 19 31 49 20 64 9 49 2 19Z"/><path fill="#49b5df" d="m20 0 2 19 9 30 9 49-7-30Z"/><path fill="#2573b5" d="m20 64 11-15 7-30-18 9Z"/><path fill="#e6ffff" d="M20 0 2 19l18 9Z"/></svg><span class="crystal-shadow"></span></div>`}</div>
  <div class="party-formation">${run.members.map((m,i)=>`<button class="field-actor ${effectClasses('ally',i)} ${(effect?effect.source.side==='ally'&&effect.source.index===i:i===run.active)?'active':''} ${m.hp<=0?'knocked-out':''} ${m.guard?'defending':''}" data-member="${i}" aria-label="Selecionar ${escapeHtml(m.name)}">${actorSprite(m,effectActorPose(i,m.hp<=0?'hurt':finished?'victory':'idle'))}${effectOverlay('ally',i)}<span class="actor-pointer">◀</span></button>`).join('')}</div>
  ${effect?`<div class="action-callout" role="status"><span>${escapeHtml(effect.name)}</span><strong>${escapeHtml(effect.command)}</strong></div>`:''}
  ${!battle?`<div class="scene-overlay">${sceneContent()}</div>`:''}</div>`;
}
function sceneContent(){
  if(menuOpen)return jobsMenu();
  if(['shop','event','treasure','recruit'].includes(run.phase))return encounterContent();
  if(run.phase==='reward')return windowPanel('reward-window',`<div class="window-caption">${run.floor%3===0?'O poder do cristal despertou!':'Espólios de batalha'}</div><p class="reward-gains">${25+run.floor*5+(run.encounter==='elite'?40:0)} gil · ${run.lastJobPoints||0} PJ · 10 ABP para jobs equipados</p><p class="victory-drops">Recebido: ${(run.victoryDrops||[]).map(d=>`${escapeHtml(nameOf(catalog[d.itemId]?.name))} × ${d.quantity}`).join(' · ')}</p><p class="dialog-note">Escolha uma recompensa:</p><div class="menu-list">${run.rewards.map(id=>{if(id.startsWith('spell:')){const spell=spellCatalog[id.slice(6)];return `<button class="menu-option" data-reward="${id}">${escapeHtml(spell.command)}<small>Pergaminho · ${escapeHtml(spellDescription(spell))}</small></button>`;}if(id.startsWith('job_'))return `<button class="menu-option" data-reward="${id}">${escapeHtml(jobOf(id).name)}<small>Descobrir · Aprender por ${jobCost(id)} PJ</small></button>`;const choice=run.lootChoices?.find(c=>c.id===id),item=catalog[choice?.itemId];return `<button class="menu-option" data-reward="${id}"><span>${item?escapeHtml(nameOf(item.name)):id==='potion'?'Poções × 2':id==='heal'?'Recuperar HP':'Reserva arcana'}${choice?.quantity>1?' × '+choice.quantity:''}<small>${item?item.type==='gear'?gearDescription(item):itemDescription(item):'Adicionar à mochila'}</small></span><b>${item?.type==='gear'?gearSlots[item.slot]:'Item'}</b></button>`;}).join('')}</div>${run.floor%3===0?'<p class="dialog-note">Descobrir não aprende o job. Compre o treinamento em Aprender jobs / Vagas.</p>':''}`);
  if(run.phase==='camp')return windowPanel('route-window',`<div class="window-caption">Um descanso junto ao cristal</div><p>O grupo recuperou HP e MP.<br>Aliados nocauteados voltaram.</p><button class="menu-option" id="next">Seguir caminho</button>`);
  return windowPanel('end-window',`<div class="window-caption">${run.phase==='won'?'Os quatro cristais despertaram':'Seu grupo foi derrotado'}</div><p>${run.phase==='won'?12:Math.max(0,run.floor-1)} encontros · ${run.unlocked.length} jobs aprendidos</p><button id="fresh" class="menu-option">Começar nova jornada</button>`);
}
function route(id,symbol,title,description){return `<button class="menu-option" data-route="${id}"><span><i>${symbol}</i>${title}</span><small>${description}</small></button>`;}
function jobsMenu(){return windowPanel('job-window',`<div class="window-caption">${escapeHtml(run.members[run.active].name)} / Jobs</div><div class="job-members">${run.members.map((m,i)=>`<button data-member="${i}" class="${run.active===i?'selected':''}">${escapeHtml(m.name)}</button>`).join('')}</div><label for="job">Job</label><select id="job">${learnedJobsFor(run.members[run.active].id).map(id=>`<option value="${id}" ${run.job===id?'selected':''}>${escapeHtml(jobOf(id).name)}</option>`).join('')}</select><label for="secondary">Comando aprendido</label><select id="secondary"><option value="">Nenhum</option>${run.mastered.map(id=>`<option value="${id}" ${run.secondary===id?'selected':''}>${escapeHtml(E.jobs[id].command)}</option>`).join('')}</select><p class="dialog-note">${escapeHtml(jobOf(run.job).description)}<br>Inicial: ${escapeHtml(starterJobDescription(run.job))}<br>ABP ${run.abp[run.job]||0}/30 para aprender o comando.</p><button class="menu-option" id="learn-jobs">Aprender jobs · ${profile.points} PJ</button><button class="menu-option" id="close-jobs">Voltar</button>`);}
function statusPanel(){return windowPanel('status-window',`<div class="status-head"><span>Nome / Job</span><span>HP</span><span>MP</span><span>Tempo</span></div><div class="party-status">${run.members.map((m,i)=>`<button data-member="${i}" class="status-row ${i===run.active?'selected':''} ${m.hp<=0?'ko':''}" aria-label="Status de ${escapeHtml(m.name)}"><span class="member-name">${escapeHtml(m.name)}<small>${escapeHtml(jobOf(m.job).name)}</small></span><span class="hp-value">${m.hp}<small>/ ${m.maxHp}</small></span><span class="mp-value">${m.mp}<small>/ ${m.maxMp}</small></span><span class="time-cell">${bar(m.atb,100,'atb')}<small data-ready="${i}">${m.hp<=0?'KO':run.phase==='battle'?(m.atb>=100?'Pronto':''):' '}</small></span></button>`).join('')}</div>`);}
function commandsPanel(){
  if(currentBattleEffect())return battleCommands();
  if(mapPreview&&run.phase!=='map')return windowPanel('commands-window','<div class="window-caption">Jornada</div><button id="close-map" class="menu-option">Voltar ao jogo</button><p class="dialog-note">O combate está pausado enquanto você consulta o mapa.</p>');
  if(run.phase!=='battle')return windowPanel('commands-window',`<div class="window-caption">Grupo</div><button id="open-group" class="menu-option">Item / Equipamento</button><button id="open-jobs" class="menu-option" ${['won','lost'].includes(run.phase)?'disabled':''}>Jobs / Habilidades</button><div class="inventory">Poção <span>× ${run.potions}</span><br>Gil <span>${run.gil}</span></div>`);
  return battleCommands();
}
function render(){
  for(const id of ['#map-toggle','#restart']){const b=document.querySelector(id);if(b)b.disabled=shellMode!=='game';}
  if(shellMode!=='game'){renderShell();return;}
  applyPreferences();
  if(groupOpen){renderGroup();return;}
  const focused=document.activeElement?.dataset?.action;
  const showMap=run.phase==='map'||mapPreview;
  const enemies=run.phase==='battle' ? run.enemies.map((m,i)=>`<button data-target="${i}" class="enemy-name ${pendingAction?.side==='enemy'&&(pendingAction.all||pendingAction.index===i)?'selected':''}" ${m.hp<=0?'disabled':''}>${escapeHtml(nameOf(m.name))}<small>HP ${Math.max(0,m.hp)} / ${m.maxHp}</small></button>`).join('') : `<div class="crystals">${[0,1,2,3].map(i=>`<span class="${run.floor>=3*(i+1)?'lit':''}">◆</span>`).join('')}</div><div class="inventory">${run.floor} / 12 encontros</div>`;
  const enemyPanel=windowPanel('enemy-window',`<div class="window-caption">${run.phase==='battle'?'Inimigos':'Cristais'}</div>${enemies}`);
  app.innerHTML=`<div class="battle-layout ${showMap?'on-map':''}">${showMap?routeMap():`${battlefield()}<div class="battle-message ff-window"><div class="ff-window-content" role="status">${escapeHtml(commandPrompt())}</div></div>`}<div class="battle-hud">${enemyPanel}${commandsPanel()}${statusPanel()}</div></div>`;
  const job=document.querySelector('#job');if(job)job.onchange=e=>changeJob(e.target.value);
  const secondary=document.querySelector('#secondary');if(secondary)secondary.onchange=e=>{run.secondary=e.target.value||null;save();render();};
  app.querySelectorAll('[data-node]').forEach(b=>b.onclick=()=>enter(b.dataset.node));
  app.querySelectorAll('[data-member]').forEach(b=>b.onclick=()=>selectMember(Number(b.dataset.member)));
  app.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>beginAction(b.dataset.action));
  app.querySelectorAll('[data-target]').forEach(b=>b.onclick=()=>confirmTarget('enemy',Number(b.dataset.target)));
  app.querySelectorAll('[data-reward]').forEach(b=>b.onclick=()=>reward(b.dataset.reward));
  app.querySelectorAll('[data-command-page]').forEach(b=>b.onclick=()=>openCommandPage(b.dataset.commandPage));
  app.querySelectorAll('[data-confirm-side]').forEach(b=>b.onclick=()=>confirmTarget(b.dataset.confirmSide,Number(b.dataset.confirmIndex)));
  const bind=(id,fn)=>{const el=document.querySelector(id);if(el)el.onclick=fn;};
  bindEncounters();
  bind('#cancel-command',cancelCommand);bind('#open-group',openGroup);
  bind('#learn-jobs',()=>shellAction('progression'));bind('#open-jobs',()=>{menuOpen=true;render();});bind('#close-jobs',()=>{menuOpen=false;render();});
  bind('#next',()=>{run.phase='map';save();render();});bind('#fresh',()=>shellAction('new'));
  bind('#close-map',()=>{mapPreview=false;mapScroll=null;render();});
  app.querySelectorAll('.map-node.available').forEach(b=>{const hint=()=>{const help=app.querySelector('.map-help');if(help)help.textContent=b.dataset.tooltip;};b.onfocus=hint;b.onpointerenter=hint;});
  app.querySelectorAll('img').forEach(img=>img.onerror=()=>{img.style.visibility='hidden';});
  if(focused)app.querySelector(`[data-action="${focused}"]:not(:disabled)`)?.focus();
  if(showMap)restoreMapScroll();
}
function updateATB(){
  app.querySelectorAll('.status-row').forEach((row,i)=>{const m=run.members[i],barEl=row.querySelector('.bar i');if(barEl)barEl.style.width=`${m.atb}%`;});
}
if(typeof document.addEventListener==='function')document.addEventListener('keydown',event=>{
  if(!run)return;
  if(event.key==='Escape'){
    event.preventDefault();window.MenuAudio.play('cancel');
    if(shellMode==='pause')shellAction('resume');
    else if(['settings','controls','credits','progression','glossary'].includes(shellMode))shellAction('back');
    else if(shellMode==='setup')shellAction('setup-cancel');
    else if(shellMode==='confirm-new')shellAction('cancel-new');
    else if(shellMode==='game'){if(groupOpen){closeGroupStep();}else if(pendingAction||commandPage!=='root'){cancelCommand();}else if(menuOpen||mapPreview){menuOpen=false;mapPreview=false;render();}else openPause();}
    return;
  }
  if(event.target.matches('select,input'))return;
  if(shellMode!=='game'){
    if(!['ArrowUp','ArrowDown','Enter'].includes(event.key))return;
    const buttons=Array.from(app.querySelectorAll(shellMode==='glossary'?'.glossary-screen button:not(:disabled)':'.shell-options button:not(:disabled),.shell-options input,.shell-options select'));if(!buttons.length)return;
    event.preventDefault();const i=buttons.indexOf(document.activeElement);
    if(event.key==='Enter')buttons[Math.max(0,i)].click();
    else buttons[(i+(event.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length].focus();
    return;
  }
  if(event.key.toLowerCase()==='i'){window.MenuAudio.play('confirm');if(groupOpen)closeGroupStep();else openGroup();return;}
  if(event.key.toLowerCase()==='m'){window.MenuAudio.play('confirm');toggleMap();return;}
  if(event.key.toLowerCase()==='j'&&run.phase!=='battle'&&!['won','lost'].includes(run.phase)){menuOpen=!menuOpen;window.MenuAudio.play(menuOpen?'confirm':'cancel');render();return;}
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(event.key))return;
  const scope=(groupOpen?(gearConfirm?app.querySelector('.equipment-confirm'):groupSlot?app.querySelector('.gear-options'):fieldItem?app.querySelector('.group-scroll'):app.querySelector('.group-screen')):null)||app.querySelector('.map-menu-overlay')||app.querySelector('.route-map')||app.querySelector('.scene-overlay')||app.querySelector('.commands-window');
  const choices=Array.from(scope?.querySelectorAll('button:not(:disabled)')||[]);if(!choices.length)return;
  event.preventDefault();let i=choices.indexOf(document.activeElement);
  if(event.key==='Enter'){(choices[Math.max(0,i)]).click();return;}
  i=(i+(['ArrowUp','ArrowLeft'].includes(event.key)?-1:1)+choices.length)%choices.length;choices[i].focus();
});
const fullscreenButton=document.querySelector('#fullscreen');
if(fullscreenButton)fullscreenButton.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.console').requestFullscreen();}catch{fullscreenButton.textContent='Tela cheia indisponível';}};
function toggleMap(){if(!run||shellMode!=='game')return;groupOpen=false;if(run.phase==='map'){menuOpen=false;}else mapPreview=!mapPreview;mapScroll=null;render();}
const mapButton=document.querySelector('#map-toggle');if(mapButton)mapButton.onclick=toggleMap;
const soundButton=document.querySelector('#sound-toggle');if(soundButton)soundButton.onclick=()=>{if(shellMode==='settings')render();};
