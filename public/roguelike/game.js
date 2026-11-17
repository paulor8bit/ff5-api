/* Browser controller. Reads the existing project's JSON and sprites. */
const E = window.CrystalEngine;
const app = document.querySelector('#app');
let run, data, target = 0, lastTime = performance.now();
const memberFields=['hp','maxHp','mp','maxMp','attack','job','abp','mastered','secondary','atb','guard','haste'];
function attachParty(state){
  if(!state.members){state.members=[Object.fromEntries(memberFields.map(key=>[key,state[key]]))];state.active=0;}
  state.members.forEach((member,i)=>Object.assign(member,window.GameConfig.characters.find(c=>c.id===member.id)||window.GameConfig.characters[i]));
  state.runId ||= Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  memberFields.forEach(key=>{delete state[key];Object.defineProperty(state,key,{configurable:true,get(){return this.members[this.active][key];},set(value){this.members[this.active][key]=value;}});});
  E.ensureMap(state);ensureInventory(state);ensureSpells(state);return state;
}
function recruit(characterId){
  const character=window.GameConfig.characters.find(c=>(!characterId||c.id===characterId)&&!run.members.some(m=>m.id===c.id));
  if(!character||run.members.length>=4)return false;
  const base=E.createRun(),member=Object.fromEntries(memberFields.map(key=>[key,base[key]]));
  Object.assign(member,character,{maxHp:240+run.floor*12,hp:240+run.floor*12,attack:28+run.floor*3});
  run.members.push(member);ensureInventory(run);ensureSpells(run);if(!profile.roster.includes(character.id))profile.roster.push(character.id);saveProfile();log(`${member.name} se juntou ao grupo! Aliado registrado para outras jornadas.`);return true;
}
const escapeHtml = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nameOf = value => typeof value === 'string' ? value : value?.['pt-BR'] || value?.en || '?';
const jobOf = id => data.jobs.jobs.find(j=>j.id===id);
const sprite = (path, label) => path ? `<img src="/img/${escapeHtml(path)}" alt="${escapeHtml(label)}">` : '<span class="symbol">◆</span>';
const log = message => {run.log.unshift(message);run.log=run.log.slice(0,30);};
function save(){try{localStorage.setItem('ffv-crystal-run-v1',JSON.stringify(run));hasSavedRun=true;}catch{}}
function bar(value,max,cls=''){return `<div class="bar ${cls}"><i style="width:${Math.max(0,Math.min(100,value/max*100))}%"></i></div>`;}
function enter(nodeId){
  if(run.phase!=='map'||shellMode!=='game')return;
  ensureSpells(run);const node=E.chooseNode(run,nodeId);if(!node)return;
  clearBattleEffects();const kind=node.type;mapScroll=null;menuOpen=false;mapPreview=false;resetCommand();
  run.floor++;run.encounter=kind;
  if(['shop','event','treasure','recruit'].includes(kind)){startEncounter(kind);return;}
  if(kind==='rest'){run.members.forEach(m=>{m.hp=Math.min(m.maxHp,m.hp+Math.round(m.maxHp*.45));m.mp=m.maxMp;});log('Acampamento: grupo recuperado, incluindo aliados nocauteados.');run.phase='camp';save();render();return;}
  const all=kind==='boss'?Object.values(data.monsters.bosses).filter(Array.isArray).flat():data.monsters.world_one_enemies;
  const illustrated=all.filter(m=>validSpriteIds.has(m.id));
  const pool=illustrated.length?illustrated:all;
  const chosen=pool[Math.floor(Math.random()*Math.min(pool.length,kind==='boss'?pool.length:30))];
  const count=kind==='normal'&&run.floor>3?2:1;
  run.enemies=Array.from({length:count},()=>{const hp=Math.round((55+run.floor*20)*(kind==='boss'?2.1:kind==='elite'?1.5:1));return {...chosen,hp,maxHp:hp,atb:0,damage:12+run.floor*3,stolen:false};});
  run.enemies.forEach(m=>{m.hp=Math.round(m.hp*(1+(run.members.length-1)*.6));m.maxHp=m.hp;});run.members.forEach(m=>{m.atb=0;m.haste=false;m.guard=false;m.protect=false;});run.active=Math.max(0,run.members.findIndex(m=>m.hp>0));target=0;run.phase='battle';lastTime=performance.now();log(`${nameOf(chosen.name)} bloqueia o caminho.`);save();render();
}
function act(action,selected){
  if(run.phase!=='battle'||shellMode!=='game'||run.atb<100||run.hp<=0)return;
  if(!canUseAction(action))return;
  const side=commandSide(action);
  if(selected&&(selected.side!==side||!Number.isInteger(selected.index)))return;
  const recipient=side==='ally'?run.members[selected?.index??run.active]:null;
  const m=side==='enemy'?run.enemies[selected?.index??run.enemies.findIndex(e=>e.hp>0)]:null;
  const itemId=itemActionId(action);
  if(action!=='guard'&&(!recipient&&!m))return;
  if(itemId&&side==='ally'){if(!eligibleItemTarget(itemId,recipient))return;}
  else if(action!=='guard'&&!spellTargetAllowed(action,recipient||m))return;
  const before=battleSnapshot();
  const effectTarget=selected?.index??(side==='ally'?run.active:run.enemies.indexOf(m));
  const totals=playerStats(run.members[run.active]);
  const power=totals.attack;
  if(itemId){if(!applyItem(itemId,selected?.index??(side==='ally'?run.active:run.enemies.findIndex(e=>e.hp>0)),true))return;run.guard=false;}
  else if(action==='guard'){run.guard=true;log(`${run.members[run.active].name} defende até sua próxima ação.`);}
  else if(action==='attack'){run.guard=false;const d=E.damage(power,3);m.hp-=d;log(`Ataque: ${d} de dano em ${nameOf(m.name)}.`);}
  else {
    const c=commandFor(action);if(!c||run.mp<c.cost||run.gil<(c.gil||0))return;
    run.mp-=c.cost;run.gil-=c.gil||0;run.guard=false;
    if(c.kind==='heal'){const amount=(c.amount||75)+totals.magic*8;recipient.hp=Math.min(recipient.maxHp,recipient.hp+amount);log(`${c.command}: ${recipient.name} recuperou até ${amount} HP.`);}
    else if(c.kind==='revive'){recipient.hp=Math.max(1,Math.round(recipient.maxHp*c.fraction));log(`${c.command}: ${recipient.name} voltou com ${recipient.hp} HP.`);}
    else if(c.kind==='protect'){recipient.protect=true;log(`${c.command}: ${recipient.name} ganhou 10 de defesa nesta batalha.`);}
    else if(c.kind==='slow'){m.slow=true;log(`${c.command}: ${nameOf(m.name)} teve seu ATB reduzido.`);}
    else if(c.kind==='haste'){recipient.haste=true;log(`Acelerar: ${recipient.name} ganhou velocidade até o fim da batalha.`);}
    else if(c.kind==='steal'){if(!m.stolen){m.stolen=true;run.potions++;log('Roubou uma poção!');}else log('Este inimigo não tem mais itens.');}
    else {const victims=c.kind==='all'?run.enemies.filter(e=>e.hp>0):[m];victims.forEach(v=>{const d=E.damage(c.kind==='magic'||c.school?run.attack+totals.gear.attack+totals.relic.attack+totals.magic*4:power,3,c.power);v.hp-=d;log(`${c.command}: ${d} de dano em ${nameOf(v.name)}.`);});}
  }
  showPlayerEffect(action,effectTarget,before);
  run.atb=0;
  resetCommand();
  if(run.enemies.every(m=>m.hp<=0)){awardJobPoints();if(run.encounter==='elite')run.gil+=40;const active=run.active;run.members.forEach((member,i)=>{run.active=i;E.victory(run);});run.gil-=(run.members.length-1)*(25+run.floor*5);run.active=active;grantVictoryLoot();run.rewards=run.floor%3===0?E.jobChoices(run):lootChoices();if(!run.rewards.length)run.rewards=lootChoices();if(run.floor===12)run.phase='reward';}
  target=Math.max(0,run.enemies.findIndex(m=>m.hp>0));
  if(run.phase==='battle'){const next=Array.from({length:run.members.length},(_,offset)=>(run.active+offset+1)%run.members.length).find(index=>run.members[index].hp>0&&run.members[index].atb>=100);if(next!==undefined)run.active=next;}
  save();render();
}
function reward(id){
  if(shellMode!=='game'||run.phase!=='reward'||!run.rewards.includes(id))return;
  if(id.startsWith('job_')){discoverJob(id);log(`Job descoberto: ${jobOf(id).name}. Aprenda por ${jobCost(id)} PJ no menu Aprender jobs / Vagas.`);}
  else if(id.startsWith('spell:')){if(!learnRunSpell(id.slice(6)))return;log(`Pergaminho aprendido: ${spellCatalog[id.slice(6)].command}. Disponível para os jobs compatíveis de todo o grupo nesta run.`);}
  else if(id.startsWith('loot-')){const choice=run.lootChoices?.find(c=>c.id===id);if(!choice||!addToBag(choice.itemId,choice.quantity))return;log(`${nameOf(catalog[choice.itemId].name)} × ${choice.quantity} recebido.`);}
  else if(id==='potion')run.potions+=2;else if(id==='heal')run.hp=Math.min(run.maxHp,run.hp+80);else{run.maxMp+=8;run.mp=run.maxMp;}
  run.phase=run.floor>=12?'won':'map';save();render();
}
function tick(now){const seconds=Math.max(0,Math.min(.2,(now-lastTime)/1000)),dt=seconds*preferences.speed;lastTime=now;
  if(currentBattleEffect()){if(shellMode==='game'&&!groupOpen&&!mapPreview&&!document.hidden&&advanceBattleEffects(seconds))render();requestAnimationFrame(tick);return;}
  if(run?.phase==='battle'&&shellMode==='game'&&!groupOpen&&!mapPreview&&(run.hp<=0||run.atb<100)){const ready=run.members.findIndex(member=>member.hp>0&&member.atb>=100);if(ready>=0){run.active=ready;resetCommand();save();render();}}
  if(run?.phase==='battle'&&shellMode==='game'&&!groupOpen&&!mapPreview&&!document.hidden&&!run.members.some(m=>m.hp>0&&m.atb>=100)){
    let changed=false;run.members.filter(m=>m.hp>0).forEach(m=>{m.atb=Math.min(100,m.atb+dt*playerStats(m).atbRate);});
    const ready=run.members.findIndex(m=>m.hp>0&&m.atb>=100);
    if(ready>=0){run.active=ready;changed=true;}else for(const enemy of run.enemies.filter(m=>m.hp>0)){enemy.atb+=dt*22*(enemy.slow?.5:1);if(enemy.atb>=100){enemy.atb=0;const alive=run.members.filter(m=>m.hp>0),victim=alive[Math.floor(Math.random()*alive.length)];const d=Math.random()*100<playerStats(victim).evasion?0:E.damage(enemy.damage,playerStats(victim).defense,victim.guard?.4:1);victim.hp=Math.max(0,victim.hp-d);queueBattleEffect({source:{side:'enemy',index:run.enemies.indexOf(enemy)},name:nameOf(enemy.name),command:'Ataque',kind:'attack',targets:[{side:'ally',index:run.members.indexOf(victim),hp:-d,mp:0,label:d?String(d):'ERROU'}]});log(`${nameOf(enemy.name)} ataca ${victim.name}: ${d} de dano.`);changed=true;if(run.members.every(m=>m.hp===0)){run.phase='lost';break;}}}
    if(changed){save();render();}else updateATB();
  }requestAnimationFrame(tick);
}
function newRun(useSetup=false){
  if(useSetup&&!startingPartyValid())return;
  clearBattleEffects();run=attachParty(E.createRun());syncProfile(run);
  if(useSetup){run.members=[];for(const id of startParty){const base=E.createRun(),member=Object.fromEntries(memberFields.map(key=>[key,base[key]]));Object.assign(member,GameConfig.characters.find(c=>c.id===id),{job:startJobs[id]||'job_001'});run.members.push(member);}run.active=0;ensureInventory(run);ensureSpells(run);}
  run.log=[`A jornada começa com ${run.members.map(m=>m.name+' / '+jobOf(m.job).name).join(', ')}.`];shellMode='game';groupOpen=false;target=0;menuOpen=false;mapPreview=false;mapScroll=null;resetCommand();save();render();
}
document.querySelector('#restart').onclick=openPause;
async function init(){try{const files=await Promise.all(['jobs','monsters','image_map','equipment','items','characters','magic','abilities'].map(async file=>{const res=await fetch(`/data/${file}.json`);if(!res.ok)throw Error(`Falha ao carregar ${file}`);return res.json();}));data={jobs:files[0],monsters:files[1],images:files[2],equipment:files[3],items:files[4],characters:files[5],magic:files[6],abilities:files[7]};buildCatalog();buildSpellCatalog();try{const saved=JSON.parse(localStorage.getItem('ffv-crystal-run-v1'));hasSavedRun=!!(saved&&(saved.members?.[saved.active]?.job||saved.job));run=attachParty(saved&&(saved.members?.[saved.active]?.job||saved.job)?saved:E.createRun());if(!jobOf(run.job))throw Error('Save incompatível');}catch{hasSavedRun=false;run=attachParty(E.createRun());}migrateProfile(run,hasSavedRun);if(run.phase==='camp')run.phase='map';if(hasSavedRun)save();render();requestAnimationFrame(tick);}catch(error){app.textContent=`Não foi possível iniciar o jogo: ${error.message}. Execute npm start e abra /roguelike/.`;}}
init();
