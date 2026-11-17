let groupOpen=false,groupPage='status',groupMember=0,groupSlot=null,fieldItem=null;
let gearPreview=undefined,gearConfirm=false;
function resetEquipmentChoice(){gearPreview=undefined;gearConfirm=false;}
function openGroup(){groupOpen=true;groupMember=run.active;groupSlot=null;fieldItem=null;resetEquipmentChoice();menuOpen=false;mapPreview=false;render();}
function itemDescription(item){const r=item.rule;return r.kind==='hp'?`Recupera ${r.amount} HP`:r.kind==='mp'?`Recupera ${r.amount} MP`:r.kind==='revive'?'Revive com 35% do HP':r.kind==='elixir'?`Restaura HP e MP${r.all?' do grupo':''}`:`${r.amount} de dano${r.all?' em todos os inimigos':''} · em batalha`;}
function closeGroupStep(){if(gearConfirm){gearConfirm=false;}else if(fieldItem)fieldItem=null;else if(groupSlot){groupSlot=null;resetEquipmentChoice();}else groupOpen=false;render();}
function equipmentPreviewHtml(){
  if(gearPreview===undefined)return '<p class="dialog-note">Escolha uma peça para comparar os atributos.</p>';
  const comparison=equipmentComparison(run.members[groupMember],groupSlot,gearPreview);if(!comparison)return '';
  const fields=[['attack','Ataque',''],['defense','Defesa',''],['magic','Magia',''],['agility','Agilidade',''],['evasion','Esquiva','%'],['atbRate','ATB','/s']];
  const number=n=>Math.round(n*10)/10;
  return `<div class="equipment-preview-title">${gearPreview?escapeHtml(nameOf(catalog[gearPreview].name)):'Remover equipamento'}</div><dl class="equipment-comparison">${fields.map(([key,label,unit])=>{const before=number(comparison.before[key]),after=number(comparison.after[key]),diff=number(after-before),kind=diff>0?'gain':diff<0?'loss':'unchanged';return `<div class="comparison-row ${kind}"><dt>${label}</dt><dd><span>${before}${unit}</span><span aria-hidden="true">→</span><strong>${after}${unit}</strong><small>${diff>0?'▲ +'+diff:diff<0?'▼ '+diff:'—'}</small></dd></div>`;}).join('')}</dl>${comparison.before.haste!==comparison.after.haste?`<p class="comparison-effect ${comparison.after.haste?'gain':'loss'}">${comparison.after.haste?'▲ Ganha':'▼ Perde'} Auto-Acelerar</p>`:''}`;
}
function previewEquipment(id){gearPreview=id||null;const panel=app.querySelector('#equipment-preview');if(panel)panel.innerHTML=equipmentPreviewHtml();}
function chooseEquipment(id){
  if(id&&bagCount(id)<1)return;
  if(!equipmentComparison(run.members[groupMember],groupSlot,id))return;
  gearPreview=id||null;gearConfirm=true;render();
}
function confirmEquipment(){
  if(!gearConfirm||gearPreview===undefined)return false;
  if(!equipGear(groupMember,groupSlot,gearPreview))return false;
  gearConfirm=false;gearPreview=undefined;groupSlot=null;render();return true;
}
function renderGroup(){
  const member=run.members[groupMember],stats=playerStats(member),locked=run.phase==='battle';
  let content='';
  if(groupPage==='status'){
    const attribute=(label,value,detail)=>`<div class="player-attribute"><dt>${label}</dt><dd>${value}</dd><small>${detail}</small></div>`;
    content=`<h2>Status / ${escapeHtml(member.name)}</h2><p class="status-job">${escapeHtml(jobOf(member.job).name)} · ABP ${member.abp[member.job]||0}/30</p><dl class="player-attributes">${attribute('HP',`${member.hp} / ${member.maxHp}`,'Vida atual / máxima')}${attribute('MP',`${member.mp} / ${member.maxMp}`,'Magia atual / máxima')}${attribute('Ataque',stats.attack,`${stats.baseAttack} base · ${stats.jobAttack>=0?'+':''}${stats.jobAttack} job · +${stats.gear.attack} equipamento · +${stats.relic.attack} relíquias`)}${attribute('Defesa',stats.defense,`${stats.baseDefense} base/job · +${stats.gear.defense} equipamento · +${stats.relic.defense} relíquias`)}${attribute('Magia',stats.magic,`${stats.jobMagic} job · +${stats.gear.magic} equipamento · +${stats.relic.magic} relíquias`)}${attribute('Agilidade',stats.agility,`${stats.jobAgility} job · +${stats.gear.agility} equipamento · +${stats.relic.agility} relíquias`)}${attribute('Esquiva',`${stats.evasion}%`,'Chance de evitar ataques inimigos')}${attribute('Velocidade ATB',`${Math.round(stats.atbRate*10)/10}/s`,stats.haste?'Acelerar ativo':'Ritmo normal')}</dl><div class="run-relics"><h2>Relíquias da jornada</h2>${(run.relics||[]).map(id=>`<p>${relicCatalog[id].name}<small>${relicCatalog[id].description}</small></p>`).join('')||'<p class="dialog-note">Nenhuma relíquia encontrada.</p>'}</div><p class="status-effects">Condição: ${member.hp<=0?'Nocauteado':member.guard?'Defendendo':member.protect?'Proteção':stats.haste?'Acelerado':'Normal'}</p>`;
  }else if(groupPage==='magic'){content=runSpellsContent(member);
  }else if(groupPage==='items'){
    if(fieldItem){const item=catalog[fieldItem];content=`<h2>${escapeHtml(nameOf(item.name))} → Escolha o aliado</h2><p>${itemDescription(item)}</p>${run.members.map((m,i)=>`<button class="menu-option" data-field-target="${i}" ${eligibleItemTarget(fieldItem,m)?'':'disabled'}>${escapeHtml(m.name)}<small>HP ${m.hp}/${m.maxHp} · MP ${m.mp}/${m.maxMp}</small></button>`).join('')}`;}
    else content=`<h2>Itens</h2>${inventoryEntries('item').map(item=>`<button class="menu-option" data-field-item="${item.id}" ${locked||item.rule.kind==='damage'?'disabled':''}><span>${escapeHtml(nameOf(item.name))}<small>${itemDescription(item)}</small></span><b>× ${item.count}</b></button>`).join('')||'<p>A mochila está vazia.</p>'}`;
  }else if(groupSlot){
    const options=inventoryEntries('gear').filter(item=>item.slot===groupSlot&&compatible(member,item));
    content=`<h2>${gearSlots[groupSlot]} / ${escapeHtml(member.name)}</h2><p class="current-equipment">Atual: ${escapeHtml(member.gear[groupSlot]?nameOf(catalog[member.gear[groupSlot]].name):'Vazio')}</p><div id="equipment-preview" class="equipment-preview" aria-live="polite">${equipmentPreviewHtml()}</div>${gearConfirm?`<p class="dialog-note">Confirmar esta troca?</p><div class="equipment-confirm"><button class="menu-option" id="confirm-equip" ${locked?'disabled':''}>Equipar</button><button class="menu-option" id="cancel-equip">Voltar</button></div>`:`<div class="gear-options"><button class="menu-option" data-equip="" ${!member.gear[groupSlot]?'disabled':''}>Remover equipamento</button>${options.map(item=>`<button class="menu-option" data-equip="${item.id}"><span>${escapeHtml(nameOf(item.name))}<small>${gearDescription(item)}</small></span><b>× ${item.count}</b></button>`).join('')||'<p>Nenhuma peça disponível para este job.</p>'}</div>`}`;
  }else{
    content=`<h2>Equipamento / ${escapeHtml(member.name)}</h2><p class="equipment-stats">ATQ ${stats.attack} · DEF ${stats.defense} · MAG ${stats.magic} · AGI ${stats.agility} · Esq. ${stats.evasion}%</p>${Object.entries(gearSlots).map(([slot,label])=>{const item=catalog[member.gear[slot]];return `<button class="menu-option" data-gear-slot="${slot}"><span class="slot-label">${label}</span><span>${item?escapeHtml(nameOf(item.name)):'—'}<small>${item?gearDescription(item):'Vazio'}</small></span></button>`;}).join('')}<h2>Na mochila</h2>${inventoryEntries('gear').map(item=>`<div class="stored-gear"><span>${escapeHtml(nameOf(item.name))}<small>${gearDescription(item)}</small></span><b>× ${item.count}</b></div>`).join('')||'<p>Encontre equipamentos nas recompensas de vitória.</p>'}`;
  }
  app.innerHTML=`<div class="group-screen"><div class="group-columns">${windowPanel('group-party',`<div class="window-caption">Grupo</div>${run.members.map((m,i)=>`<button class="group-character ${i===groupMember?'selected':''}" data-group-member="${i}">${actorSprite(m)}<span>${escapeHtml(m.name)}<small>${escapeHtml(jobOf(m.job).name)}</small><small>HP ${m.hp}/${m.maxHp}<br>MP ${m.mp}/${m.maxMp}</small></span></button>`).join('')}<div class="group-wallet">${run.gil} gil · Encontro ${run.floor}/12</div>`)}${windowPanel('group-content',`<nav class="group-tabs"><button class="menu-option ${groupPage==='status'?'selected':''}" data-group-page="status">Status</button><button class="menu-option ${groupPage==='items'?'selected':''}" data-group-page="items">Item</button><button class="menu-option ${groupPage==='gear'?'selected':''}" data-group-page="gear">Equipamento</button><button class="menu-option ${groupPage==='magic'?'selected':''}" data-group-page="magic">Magias</button><button class="menu-option" id="group-jobs" ${locked?'disabled':''}>Jobs</button><button class="menu-option" id="group-back">Voltar</button></nav><div class="group-scroll">${locked&&groupPage!=='status'?'<p class="dialog-note">Durante a batalha, consulte a mochila. Use itens pelo comando Item do combate; troque equipamentos entre encontros.</p>':''}${content}<p class="dialog-note" role="status">${escapeHtml(run.log[0])}</p></div>`)}</div><div class="group-footer">↑ ↓ Navegar · Enter Confirmar · Esc Voltar</div></div>`;
  app.querySelectorAll('[data-group-member]').forEach(b=>b.onclick=()=>{groupMember=Number(b.dataset.groupMember);groupSlot=null;fieldItem=null;resetEquipmentChoice();render();});
  app.querySelectorAll('[data-group-page]').forEach(b=>b.onclick=()=>{groupPage=b.dataset.groupPage;groupSlot=null;fieldItem=null;resetEquipmentChoice();render();});
  app.querySelectorAll('[data-gear-slot]').forEach(b=>b.onclick=()=>{groupSlot=b.dataset.gearSlot;resetEquipmentChoice();render();});
  app.querySelectorAll('[data-equip]').forEach(b=>{b.onfocus=b.onpointerenter=()=>previewEquipment(b.dataset.equip);b.onclick=()=>chooseEquipment(b.dataset.equip||null);});
  const confirmButton=app.querySelector('#confirm-equip');if(confirmButton)confirmButton.onclick=confirmEquipment;
  const cancelButton=app.querySelector('#cancel-equip');if(cancelButton)cancelButton.onclick=closeGroupStep;
  app.querySelectorAll('[data-field-item]').forEach(b=>b.onclick=()=>{fieldItem=b.dataset.fieldItem;render();});
  app.querySelectorAll('[data-field-target]').forEach(b=>b.onclick=()=>{if(useFieldItem(fieldItem,Number(b.dataset.fieldTarget)))fieldItem=null;render();});
  document.querySelector('#group-back').onclick=closeGroupStep;
  document.querySelector('#group-jobs').onclick=()=>{run.active=groupMember;groupOpen=false;menuOpen=true;save();render();};
  const first=gearConfirm?'#confirm-equip':groupSlot?'.gear-options [data-equip]:not(:disabled)':fieldItem?'[data-field-target]:not(:disabled)':`[data-group-page="${groupPage}"]`;
  app.querySelector(first)?.focus();
}
