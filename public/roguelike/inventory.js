/* Run inventory. Bag counts only unequipped copies; every equipped copy has one owner. */
let catalog={};
const gearSlots={weapon:'Arma',shield:'Escudo',head:'Cabeça',body:'Corpo',accessory:'Acessório'};
const itemRules={
  item_r001:{kind:'hp',amount:100},item_r002:{kind:'hp',amount:500},item_r003:{kind:'hp',amount:1000},
  item_r004:{kind:'mp',amount:50},item_r005:{kind:'mp',amount:150},item_r006:{kind:'elixir'},
  item_r007:{kind:'elixir',all:true},item_r008:{kind:'revive'},
  item_o001:{kind:'damage',amount:65,all:true},item_o002:{kind:'damage',amount:150,all:true},
  item_o003:{kind:'damage',amount:65,all:true},item_o004:{kind:'damage',amount:150,all:true},
  item_o005:{kind:'damage',amount:65,all:true},item_o006:{kind:'damage',amount:150,all:true},
  item_o013:{kind:'damage',amount:90},item_o014:{kind:'damage',amount:190}
};
const accessoryRules={acc_004:{agility:1,magic:1},acc_005:{haste:true},acc_009:{strength:5},acc_016:{defense:3},acc_017:{defense:6,magic_defense:1}};
function buildCatalog(){
  catalog={};
  for(const group of Object.values(data.items))for(const raw of group.items||[])if(itemRules[raw.id])catalog[raw.id]={...raw,type:'item',rule:itemRules[raw.id]};
  const add=(groups,slots)=>{for(const [key,group] of Object.entries(groups))for(const raw of group.items||[]){if(key==='throwing')continue;if(key==='accessories'&&!accessoryRules[raw.id])continue;catalog[raw.id]={...raw,...accessoryRules[raw.id],type:'gear',family:key,slot:slots[key]||'weapon'};}};
  add(data.equipment.weapons,{});add(data.equipment.armor,{shields:'shield',helmets:'head',armor_body:'body',accessories:'accessory'});
}
function ensureInventory(state){
  if(!state.bag){const legacy=Number(state.potions)||0;state.bag={item_r001:legacy};}
  if(!state.inventoryVersion){if(!state.floor){state.bag.item_r004=2;state.bag.item_r008=1;}state.inventoryVersion=1;}
  delete state.potions;Object.defineProperty(state,'potions',{configurable:true,get(){return this.bag.item_r001||0;},set(value){this.bag.item_r001=Math.max(0,value);}});
  for(const m of state.members){m.gear ||= Object.fromEntries(Object.keys(gearSlots).map(slot=>[slot,null]));for(const [slot,id] of Object.entries(m.gear))if(id&&catalog[id]&&!compatible(m,catalog[id])){state.bag[id]=(state.bag[id]||0)+1;m.gear[slot]=null;}}
}
function bagCount(id){return Math.max(0,run.bag[id]||0);}
function addToBag(id,quantity=1){if(!catalog[id]||!Number.isInteger(quantity)||quantity<=0)return false;run.bag[id]=bagCount(id)+quantity;return true;}
function basicGear(item){return !!item&&item.type==='gear'&&item.slot!=='accessory'&&(item.attack||0)<=22&&(item.defense||0)<=4&&(item.magic_bonus||0)<=1&&(item.price||0)<=500&&!item.haste&&!item.strength&&!item.agility&&!item.magic;}
function compatible(member,item){if(!item||item.type!=='gear')return false;const job=jobOf(member.job);if(member.job==='job_001')return basicGear(item);return !item.jobs||item.jobs.includes('All')||item.jobs.includes(job.name_en);}
function gearStats(member){
  const items=Object.values(member.gear||{}).map(id=>catalog[id]).filter(Boolean);
  return {evasion:Math.min(40,items.reduce((n,i)=>n+(i.evasion||0),0)),attack:items.reduce((n,i)=>n+Math.round((i.attack||0)*.4)+(i.strength||0)*2,0),defense:items.reduce((n,i)=>n+Math.ceil((i.defense||0)*.45),0),magic:items.reduce((n,i)=>n+(i.magic_bonus||0)+(i.magic||0),0),agility:items.reduce((n,i)=>n+(i.agility||0),0),haste:items.some(i=>i.haste)};
}
function playerStats(member){
  const job=jobOf(member.job).base_stats,gear=gearStats(member),relic=relicStats();
  const strength=job.strength||0,magic=Math.max(0,job.magic||0),agility=job.agility||0;
  const baseDefense=member.job==='job_002'?6:2,haste=!!(member.haste||gear.haste);
  return {attack:member.attack+strength*2+gear.attack+relic.attack,defense:baseDefense+gear.defense+relic.defense+(member.protect?10:0),magic:magic+gear.magic+relic.magic,agility:agility+gear.agility+relic.agility,evasion:gear.evasion,haste,atbRate:(32+(agility+gear.agility+relic.agility)*2)*(haste?1.6:1),baseAttack:member.attack,jobAttack:strength*2,baseDefense,jobMagic:magic,jobAgility:agility,gear,relic};
}
function equipmentComparison(member,slot,id){
  if(!Object.hasOwn(gearSlots,slot)||id&&(!compatible(member,catalog[id])||catalog[id].slot!==slot))return null;
  const candidate={...member,gear:{...member.gear,[slot]:id||null}};
  return {before:playerStats(member),after:playerStats(candidate)};
}
function gearDescription(item){if(!item)return 'Vazio';const parts=[];if(item.evasion)parts.push(`Esquiva +${item.evasion}%`);if(item.attack)parts.push(`ATQ +${Math.round(item.attack*.4)}`);if(item.defense)parts.push(`DEF +${Math.ceil(item.defense*.45)}`);if(item.magic_bonus||item.magic)parts.push(`MAG +${(item.magic_bonus||0)+(item.magic||0)}`);if(item.agility)parts.push(`AGI +${item.agility}`);if(item.strength)parts.push(`ATQ +${item.strength*2}`);if(item.haste)parts.push('Auto-Acelerar');return parts.join(' · ')||'Sem bônus numéricos';}
function equipGear(memberIndex,slot,id){
  if(shellMode!=='game'||run.phase==='battle'||!Object.hasOwn(gearSlots,slot))return false;
  const m=run.members[memberIndex],item=catalog[id];if(!m)return false;
  if(id&&(bagCount(id)<1||!compatible(m,item)||item.slot!==slot))return false;
  const previous=m.gear[slot];if(previous)addToBag(previous);
  if(id)run.bag[id]--;m.gear[slot]=id||null;save();return true;
}
function changeJob(id){
  if(run.phase==='battle'||!learnedJobsFor(run.members[run.active].id).includes(id))return;
  run.job=id;ensureSpells(run);
  for(const [slot,gearId] of Object.entries(run.members[run.active].gear))if(gearId&&!compatible(run.members[run.active],catalog[gearId])){addToBag(gearId);run.members[run.active].gear[slot]=null;}
  save();render();
}
function itemActionId(action){return action==='potion'?'item_r001':action.startsWith('item:')?action.slice(5):null;}
function eligibleItemTarget(id,member){const rule=catalog[id]?.rule;if(!rule||!member)return false;return rule.kind==='revive'?member.hp===0:member.hp>0;}
function applyItem(id,index,inBattle=false){
  const item=catalog[id];if(!item?.rule||bagCount(id)<1)return false;
  const r=item.rule;
  if(r.kind==='damage'){
    if(!inBattle||!run.enemies[index]||run.enemies[index].hp<=0)return false;
    for(const enemy of r.all?run.enemies.filter(m=>m.hp>0):[run.enemies[index]])enemy.hp=Math.max(0,enemy.hp-r.amount);
    log(`${nameOf(item.name)}: ${r.amount} de dano${r.all?' em todos os inimigos':''}.`);
  }else{
    if(!eligibleItemTarget(id,run.members[index]))return false;
    const targets=r.all?run.members.filter(m=>m.hp>0):[run.members[index]];
    // Outside combat, do not consume recovery items when they have no effect.
    if(!inBattle&&!targets.some(m=>r.kind==='revive'||(r.kind==='hp'||r.kind==='elixir')&&m.hp<m.maxHp||(r.kind==='mp'||r.kind==='elixir')&&m.mp<m.maxMp))return false;
    for(const m of targets){if(r.kind==='hp')m.hp=Math.min(m.maxHp,m.hp+r.amount);if(r.kind==='mp')m.mp=Math.min(m.maxMp,m.mp+r.amount);if(r.kind==='elixir'){m.hp=m.maxHp;m.mp=m.maxMp;}if(r.kind==='revive'){m.hp=Math.max(1,Math.round(m.maxHp*.35));m.atb=0;}}
    log(`${nameOf(item.name)} usado em ${r.all?'todo o grupo':run.members[index].name}.`);
  }
  run.bag[id]--;return true;
}
function useFieldItem(id,index){if(shellMode!=='game'||run.phase==='battle'||catalog[id]?.rule.kind==='damage')return false;const success=applyItem(id,index);if(success)save();return success;}
function inventoryEntries(type){return Object.entries(run.bag).filter(([id,count])=>count>0&&catalog[id]?.type===type).map(([id,count])=>({...catalog[id],count}));}
// Rank implemented bonuses, then draw from the current depth's strongest band.
function gearScore(item){return Math.round((item.attack||0)*.4)+(item.strength||0)*2+((item.magic_bonus||0)+(item.magic||0))*4+(item.agility||0)*3+Math.ceil((item.defense||0)*.45)*2+(item.evasion||0)*.15+(item.haste?18:0);}
function tieredGearPools(floor=run.floor,encounter=run.encounter){
  const bonus=encounter==='boss'?28:encounter==='elite'?16:encounter==='shop'?10:0;
  const maxAttack=28+floor*9+bonus,maxDefense=3+Math.ceil(floor*2.5)+Math.floor(bonus/3);
  const maxPrice=500+floor*3500+bonus*500;
  const eligible=Object.values(catalog).filter(item=>item.type==='gear'&&gearScore(item)>0&&run.members.some(member=>member.job==='job_001'||compatible(member,item)));
  const weapons=eligible.filter(item=>item.slot==='weapon'&&item.attack>0&&item.attack<=maxAttack);
  const armor=eligible.filter(item=>item.slot!=='weapon'&&(item.defense||0)<=maxDefense&&(item.price||0)<=maxPrice);
  const ratio=encounter==='boss'?.85:encounter==='elite'?.7:encounter==='shop'?.65:.55;
  const strongest=items=>{const peak=Math.max(0,...items.map(gearScore));return items.filter(item=>gearScore(item)>=peak*ratio);};
  return {weapons:strongest(weapons),armor:strongest(armor)};
}
function pickTieredGear(pool){
  if(!pool.length)return null;
  const owned=new Set([...Object.keys(run.bag).filter(id=>bagCount(id)>0),...run.members.flatMap(m=>Object.values(m.gear||{})).filter(Boolean)]);
  const fresh=pool.filter(item=>!owned.has(item.id)),choices=fresh.length?fresh:pool;
  const families=[...new Set(choices.map(item=>item.family||item.slot))];
  const family=families[Math.floor(Math.random()*families.length)];
  const items=choices.filter(item=>(item.family||item.slot)===family);
  return items[Math.floor(Math.random()*items.length)];
}
function lootChoices(){
  const pools=tieredGearPools();
  const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
  const consumables=run.floor<4?['item_r002','item_r004','item_r008','item_o001']:['item_r005','item_r006','item_r008','item_o002','item_o013'];
  const selected=[pickTieredGear(pools.weapons),pickTieredGear(pools.armor),catalog[pick(consumables)]].filter(Boolean);
  run.lootChoices=selected.map((item,i)=>({id:`loot-${i}`,itemId:item.id,quantity:item.type==='item'?2:1}));
  const spell=spellOffers()[Math.floor(Math.random()*spellOffers().length)];return [...run.lootChoices.map(choice=>choice.id),...(spell?['spell:'+spell.id]:[])];
}
function grantVictoryLoot(){
  const drops=['item_r001','item_r004','item_r008','item_o001','item_o003','item_o005'];
  const id=drops[Math.floor(Math.random()*drops.length)];addToBag(id);run.victoryDrops=[{itemId:id,quantity:1}];
  if(run.floor%3===0){const found=pickTieredGear(tieredGearPools(run.floor,'boss').weapons);if(found){addToBag(found.id);run.victoryDrops.push({itemId:found.id,quantity:1});}}
}
