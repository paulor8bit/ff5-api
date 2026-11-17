// Transient battle input: selecting commands never spends resources.
let commandPage='root', pendingAction=null;
function resetCommand(){commandPage='root';pendingAction=null;}
function commandFor(action){
  if(action.startsWith('spell:'))return canCastSpell(run.members[run.active],action.slice(6))?spellCatalog[action.slice(6)]:null;
  const job=action==='job'?run.job:action==='secondary'?run.secondary:null,c=E.jobs[job];
  if(spellSchools(job).length)return availableSpells(run.members[run.active]).find(s=>jobCanCast(job,s))||null;
  return c||null;
}
function commandSide(action){const c=commandFor(action);const id=itemActionId(action);return id?catalog[id]?.rule.kind==='damage'?'enemy':'ally':['heal','haste','revive','protect'].includes(c?.kind)?'ally':'enemy';}
function canUseAction(action){
  if(currentBattleEffect()||shellMode!=='game'||groupOpen||mapPreview||run.phase!=='battle'||run.hp<=0||run.atb<100)return false;
  if(action==='attack'||action==='guard')return true;
  const id=itemActionId(action);if(id)return !!catalog[id]?.rule&&bagCount(id)>0;
  const c=commandFor(action);return !!c&&run.mp>=c.cost&&run.gil>=(c.gil||0);
}
function openCommandPage(page){if(!canUseAction('attack'))return;pendingAction=null;commandPage=page;render();}
function beginAction(action){
  if(!canUseAction(action))return;
  if(action==='guard'){act('guard');return;}
  const side=commandSide(action),all=commandFor(action)?.kind==='all'||!!catalog[itemActionId(action)]?.rule.all;
  pendingAction={action,actor:run.active,side,all,index:side==='ally'?run.active:run.enemies.findIndex(m=>m.hp>0),from:commandPage};
  render();
}
function cancelCommand(){
  if(pendingAction){commandPage=pendingAction.from;pendingAction=null;}else commandPage='root';
  render();
}
function confirmTarget(side,index){
  const p=pendingAction;if(!p||p.actor!==run.active||p.side!==side||!canUseAction(p.action))return;
  const recipient=(side==='ally'?run.members:run.enemies)[index];if(!recipient||(itemActionId(p.action)&&side==='ally'?!eligibleItemTarget(itemActionId(p.action),recipient):!spellTargetAllowed(p.action,recipient)))return;
  act(p.action,{side,index});
}
function selectMember(index){
  if(pendingAction){confirmTarget('ally',index);return;}
  if(!run.members[index]||run.phase==='battle')return;
  run.active=index;resetCommand();save();render();
}
function commandPrompt(){
  if(currentBattleEffect())return effectMessage();
  if(!pendingAction)return run.log[0];
  const name=pendingAction.action==='attack'?'Atacar':itemActionId(pendingAction.action)?nameOf(catalog[itemActionId(pendingAction.action)].name):commandFor(pendingAction.action).command;
  return `${name} → ${pendingAction.all?`Todo${pendingAction.side==='ally'?' o grupo':'s os inimigos'}. Confirme o alvo.`:pendingAction.side==='ally'?'Escolha um aliado.':'Escolha um inimigo.'} Esc: voltar`;
}
function battleCommands(){
  if(currentBattleEffect())return windowPanel('commands-window',`<div class="window-caption">${escapeHtml(currentBattleEffect().name)}</div><p class="action-in-progress">${escapeHtml(currentBattleEffect().command)}</p><p class="dialog-note">Ação em andamento…</p>`);
  const name=escapeHtml(run.members[run.active].name),ready=canUseAction('attack');
  const back='<button class="menu-option" id="cancel-command">Voltar</button>';
  if(pendingAction){
    const p=pendingAction,list=p.side==='ally'?run.members:run.enemies;
    const eligible=m=>itemActionId(p.action)&&p.side==='ally'?eligibleItemTarget(itemActionId(p.action),m):spellTargetAllowed(p.action,m);
    const targets=p.all?`<button class="menu-option selected-target" data-confirm-side="${p.side}" data-confirm-index="${list.findIndex(eligible)}">${p.side==='ally'?'Todo o grupo':'Todos os inimigos'}</button>`:list.map((m,i)=>eligible(m)?`<button class="menu-option ${p.index===i?'selected-target':''}" data-confirm-side="${p.side}" data-confirm-index="${i}">${escapeHtml(p.side==='ally'?m.name:nameOf(m.name))}<small>${m.hp} HP</small></button>`:'').join('');
    return windowPanel('commands-window selecting-target',`<div class="window-caption">Escolha o alvo</div><div class="command-list">${targets}${back}</div>`);
  }
  if(commandPage==='items')return windowPanel('commands-window',`<div class="window-caption">Item</div><div class="command-list">${inventoryEntries('item').map(item=>`<button class="menu-option" data-action="item:${item.id}" ${canUseAction('item:'+item.id)?'':'disabled'}>${escapeHtml(nameOf(item.name))}<small>× ${item.count}</small></button>`).join('')||'<p class="dialog-note">Mochila vazia.</p>'}${back}</div>`);
  const abilities=['job',...(run.secondary&&run.secondary!==run.job?['secondary']:[])];
  const magical=action=>spellSchools(action==='job'?run.job:run.secondary).length>0;
  if(commandPage==='magic'||commandPage==='skills'){
    const options=commandPage==='magic'?availableSpells(run.members[run.active]).map(s=>'spell:'+s.id):abilities.filter(action=>!magical(action));
    return windowPanel('commands-window',`<div class="window-caption">${commandPage==='magic'?'Magia':'Habilidades'}</div><div class="command-list">${options.map(action=>{const c=commandFor(action);return `<button class="menu-option" data-action="${action}" ${canUseAction(action)?'':'disabled'}>${escapeHtml(c.command)}<small>${c.cost?c.cost+' MP':c.gil?c.gil+' gil':''}</small></button>`;}).join('')||'<p class="dialog-note">Nenhuma magia compatível aprendida nesta run.</p>'}${back}</div>`);
  }
  return windowPanel('commands-window',`<div class="window-caption">${name}</div><div class="command-list"><button data-action="attack" class="menu-option" ${ready?'':'disabled'}>Atacar</button><button data-command-page="magic" class="menu-option" ${ready&&abilities.some(magical)?'':'disabled'}>Magia</button><button data-command-page="skills" class="menu-option" ${ready&&abilities.some(a=>!magical(a))?'':'disabled'}>Habilidades</button><button data-command-page="items" class="menu-option" ${ready?'':'disabled'}>Item</button><button data-action="guard" class="menu-option" ${ready?'':'disabled'}>Defender</button></div>`);
}
