const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
async function game(start=true,initialStorage=[]){
  const nodes=new Map();const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',style:{},querySelector:()=>null,querySelectorAll:()=>[]});return nodes.get(selector);};
  const storage=new Map(initialStorage);const context=vm.createContext({console,performance:{now:()=>0},document:{hidden:false,querySelector:node},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:()=>{},confirm:()=>true,fetch:async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(__dirname,'..','json',url.split('/').pop()),'utf8'))})});
  context.window=context;
  for(const file of ['config.js','audio.js','engine.js','map.js','shell.js','progression.js','glossary.js','spells.js','encounters.js','inventory.js','group-menu.js','commands.js','battle-effects.js','ui.js','game.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','public','roguelike',file),'utf8'),context);
  await new Promise(resolve=>setImmediate(resolve));
  if(start)vm.runInContext("shellMode='game'",context);
  return {exec:code=>{vm.runInContext('clearBattleEffects()',context);return vm.runInContext(code,context);},rawExec:code=>vm.runInContext(code,context),storage};
}
test('starts solo, wins encounters, discovers jobs at crystals and ends after 12 encounters',async()=>{
  const g=await game();assert.equal(g.exec('run.members.length'),1);assert.equal(g.exec('run.unlocked.length'),0);
  for(let floor=1;floor<=12;floor++){
    g.exec("var next=E.availableNodes(run)[0];if(next.type!=='boss')next.type='normal';enter(next.id); run.enemies.forEach(m=>m.hp=1); run.atb=100; act('job');");
    // A single-target job may leave a second enemy alive.
    while(g.exec("run.phase==='battle'"))g.exec("run.atb=100;act('attack');");
    assert.equal(g.exec('run.floor'),floor);
    assert.equal(g.exec('run.members.length'),1);
    g.exec('reward(run.rewards[0]);');
  }
  assert.equal(g.exec('run.phase'),'won');assert.ok(g.exec('profile.discoveredJobs.length')>=3);assert.equal(g.exec('run.unlocked.length'),0);
});
test('ATB waits for input, spends MP and shared consumables, and preserves independent members',async()=>{
  const g=await game();g.exec("run.floor=3;recruit();run.floor=0;run.unlocked=['job_005'];run.job='job_005';learnRunSpell('spell_w001');enter(E.availableNodes(run).find(n=>n.type==='normal').id);run.atb=100;run.hp=50;");
  g.exec('tick(1000)');assert.equal(g.exec('run.enemies[0].atb'),0);
  g.exec("act('job')");assert.equal(g.exec('run.mp'),26);assert.ok(g.exec('run.hp')>50);
  const hp=g.exec('run.members[0].hp');g.exec("run.active=1;run.hp=20;run.atb=100;act('potion');");
  assert.equal(g.exec('run.members[0].hp'),hp);assert.equal(g.exec('run.members[1].hp'),120);assert.equal(g.exec('run.potions'),2);
  assert.equal(g.exec('JSON.parse(localStorage.getItem("ffv-crystal-run-v1")).members.length'),2);
});
test('party wipe loses the run; camps revive and recover the whole party',async()=>{
  const g=await game();g.exec("enter(E.availableNodes(run).find(n=>n.type==='normal').id);run.hp=1;run.atb=0;run.enemies[0].atb=100;tick(100);");assert.equal(g.exec('run.phase'),'lost');
  g.exec("newRun();run.floor=3;recruit();run.floor=0;run.members[0].hp=0;run.members[1].mp=0;run.route.nodes[0].type='rest';enter(run.route.nodes[0].id);");assert.ok(g.exec('run.members[0].hp')>0);assert.equal(g.exec('run.members[1].mp'),30);
});
test('all advertised monster and animated party sprites contain actual GIF data',async()=>{
  const g=await game();const ids=g.exec('[...validSpriteIds]');
  for(const id of ids){const bytes=fs.readFileSync(path.join(__dirname,'..','images','monsters',id+'.gif'));assert.match(bytes.toString('ascii',0,6),/^GIF8[79]a$/);}
  for(const actor of ['bartz','lenna','faris','krile'])for(const pose of ['idle','hurt','victory']){
    const bytes=fs.readFileSync(path.join(__dirname,'..','images','characters',actor,'freelancer',pose+'.gif'));assert.match(bytes.toString('ascii',0,6),/^GIF8[79]a$/);
  }
});
test('map routes cannot skip floors, backtrack, revisit, or bypass guardians',()=>{
  const E=require('../public/roguelike/engine');
  for(let sample=0;sample<30;sample++){
    const run=E.createRun();E.ensureMap(run);
    assert.equal(run.route.nodes.filter(n=>n.type==='boss').length,4);
    for(const node of run.route.nodes){
      if(node.floor<12)assert.ok(node.next.length);
      for(const id of node.next)assert.equal(run.route.nodes.find(n=>n.id===id).floor,node.floor+1);
      if(node.floor>1)assert.ok(run.route.nodes.some(n=>n.next.includes(node.id)));
    }
    for(let floor=1;floor<=12;floor++){
      assert.equal(E.chooseNode(run,'f12-1'),floor===12?run.route.nodes.find(n=>n.id==='f12-1'):null);
      if(floor===12)break;
      const options=E.availableNodes(run);assert.ok(options.length);
      if(floor%3===0){assert.equal(options.length,1);assert.equal(options[0].type,'boss');}
      const selected=options[Math.floor(Math.random()*options.length)];E.chooseNode(run,selected.id);run.floor=floor;
      assert.equal(E.chooseNode(run,selected.id),null);
      const saved=JSON.parse(JSON.stringify(run));E.ensureMap(saved);assert.deepEqual(saved.route,run.route);
    }
  }
});
test('old saves migrate to connected maps without losing HP or encounter progress',async()=>{
  const g=await game();g.exec("delete run.route;run.floor=7;run.encounter='elite';run.phase='battle';run.hp=91;E.ensureMap(run);");
  assert.equal(g.exec('run.route.path.length'),7);assert.equal(g.exec('run.hp'),91);assert.equal(g.exec('run.phase'),'battle');
  assert.equal(g.exec('run.route.nodes.find(n=>n.id===run.route.current).type'),'elite');
});
test('renaming a character preserves its sprite identity and map preview pauses combat',async()=>{
  const g=await game();g.exec("window.GameConfig.characters[0].name='Aria';newRun();enter(E.availableNodes(run)[0].id);mapPreview=true;tick(100);");
  assert.equal(g.exec('run.members[0].name'),'Aria');assert.equal(g.exec('run.members[0].sprite'),'bartz');assert.equal(g.exec('run.atb'),0);
  assert.match(g.exec('actorSprite(run.members[0])'),/characters\/bartz\/freelancer/);
});
test('menu audio is gesture-activated, synthesizes cues and persists mute',()=>{
  let created=0,notes=0;const storage=new Map();
  class AudioContext{
    constructor(){created++;this.state='running';this.currentTime=1;this.destination={};}
    createOscillator(){notes++;return {frequency:{setValueAtTime(){}},connect(){},start(){},stop(){},disconnect(){}};}
    createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
  }
  const context=vm.createContext({AudioContext,document:{querySelector:()=>null},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}});context.window=context;
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','public','roguelike','audio.js'),'utf8'),context);
  assert.equal(created,0);context.MenuAudio.unlock();context.MenuAudio.play('confirm');assert.equal(notes,3);
  context.MenuAudio.toggle();context.MenuAudio.play('move');assert.equal(notes,3);assert.equal(storage.get('ffv-menu-audio'),'off');
});
test('boot shows title without fabricating a save; resume survives reload and menus pause ATB',async()=>{
  const g=await game(false);assert.equal(g.exec('shellMode'),'title');assert.equal(g.exec('hasSavedRun'),false);
  assert.equal(g.storage.has('ffv-crystal-run-v1'),false);
  g.exec("shellAction('new');shellAction('begin-run');enter(E.availableNodes(run)[0].id);run.hp=109;run.atb=24;openPause();tick(100);");
  assert.equal(g.exec('shellMode'),'pause');assert.equal(g.exec('run.atb'),24);
  g.exec("shellAction('settings');tick(200);shellAction('back');");assert.equal(g.exec('shellMode'),'pause');assert.equal(g.exec('run.hp'),109);
  g.exec("shellAction('title');");const restored=await game(false,[...g.storage]);
  assert.equal(restored.exec('shellMode'),'title');assert.equal(restored.exec('run.hp'),109);
  restored.exec("tick(100);shellAction('continue');");assert.equal(restored.exec('run.atb'),24);assert.equal(restored.exec('shellMode'),'game');
});
test('starting another run requires an in-game choice and cancel preserves progress',async()=>{
  const g=await game(false);g.exec("shellAction('new');shellAction('begin-run');run.gil=77;openPause();shellAction('new');");assert.equal(g.exec('shellMode'),'confirm-new');
  g.exec("shellAction('cancel-new');");assert.equal(g.exec('run.gil'),77);assert.equal(g.exec('shellMode'),'pause');
  g.exec("shellAction('new');shellAction('start-new');shellAction('begin-run');");assert.equal(g.exec('run.gil'),0);assert.equal(g.exec('run.floor'),0);assert.equal(g.exec('shellMode'),'game');
});
test('settings and effect volume persist separately from run progress',async()=>{
  const g=await game(false);g.exec("preferences.speed=1.5;preferences.scanlines=false;storePreferences();window.MenuAudio.setVolume(.3);");
  const restored=await game(false,[...g.storage]);assert.equal(restored.exec('preferences.speed'),1.5);assert.equal(restored.exec('preferences.scanlines'),false);assert.equal(restored.exec('window.MenuAudio.getVolume()'),.3);
  assert.equal(restored.exec('hasSavedRun'),false);
});

test('commands and items wait for a valid target; cancel keeps resources and turn',async()=>{
  const g=await game();g.exec("enter(E.availableNodes(run).find(n=>n.type==='normal').id);run.atb=100;run.enemies.push({...run.enemies[0]});beginAction('attack');");
  const hp=g.exec('run.enemies[0].hp');assert.equal(g.exec('run.atb'),100);
  g.exec("confirmTarget('ally',0)");assert.equal(g.exec('run.enemies[0].hp'),hp);
  g.exec("confirmTarget('enemy',1)");assert.equal(g.exec('run.enemies[0].hp'),hp);assert.ok(g.exec('run.enemies[1].hp')<hp);assert.equal(g.exec('run.atb'),0);
  g.exec("run.atb=100;openCommandPage('items');beginAction('item:item_r001');");assert.match(g.exec('commandPrompt()'),/Escolha um aliado/);
  g.exec('cancelCommand()');assert.equal(g.exec('run.potions'),3);assert.equal(g.exec('run.atb'),100);assert.equal(g.exec('commandPage'),'items');
});

test('items can heal another member, restore MP, revive KO allies and damage enemies',async()=>{
  const g=await game();g.exec("run.floor=3;recruit();run.floor=0;enter(E.availableNodes(run).find(n=>n.type==='normal').id);run.members[1].hp=10;run.atb=100;beginAction('item:item_r001');confirmTarget('ally',1);");assert.equal(g.exec('run.members[1].hp'),110);assert.equal(g.exec('run.potions'),2);
  g.exec("run.atb=100;run.members[1].mp=0;beginAction('item:item_r004');confirmTarget('ally',1)");assert.equal(g.exec('run.members[1].mp'),30);assert.equal(g.exec('bagCount("item_r004")'),1);
  g.exec("run.atb=100;run.members[1].hp=0;beginAction('item:item_r008');confirmTarget('ally',0)");assert.equal(g.exec('bagCount("item_r008")'),1);
  g.exec("confirmTarget('ally',1)");assert.ok(g.exec('run.members[1].hp')>0);assert.equal(g.exec('bagCount("item_r008")'),0);
  g.exec("addToBag('item_o001');run.atb=100;run.enemies[0].hp=500;beginAction('item:item_o001');confirmTarget('enemy',0)");assert.equal(g.exec('run.enemies[0].hp'),435);assert.equal(g.exec('bagCount("item_o001")'),0);
});

test('loot includes gear and consumables; claiming once persists inventory',async()=>{
  const g=await game();g.exec("enter(E.availableNodes(run).find(n=>n.type==='normal').id);run.enemies[0].hp=1;run.atb=100;act('attack');");
  assert.equal(g.exec('run.phase'),'reward');assert.equal(g.exec('run.lootChoices.filter(c=>catalog[c.itemId].type==="gear").length'),2);
  assert.equal(g.exec('run.lootChoices.filter(c=>catalog[c.itemId].type==="item").length'),1);
  const id=g.exec('run.lootChoices[0].itemId');g.exec('reward(run.rewards[0]);reward("loot-0");');assert.equal(g.exec(`bagCount('${id}')`),1);
  const restored=await game(true,[...g.storage]);assert.equal(restored.exec(`bagCount('${id}')`),1);
});

test('equipment has one owner, changes battle stats, returns on incompatible job and survives saves',async()=>{
  const g=await game();g.exec("run.floor=3;recruit();run.floor=0;addToBag('weapon_s001');");assert.equal(g.exec("equipGear(0,'weapon','weapon_s001')"),true);assert.equal(g.exec('gearStats(run.members[0]).attack'),6);
  assert.equal(g.exec("equipGear(1,'weapon','weapon_s001')"),false);assert.equal(g.exec('run.members[0].gear.weapon'),'weapon_s001');
  g.exec('save()');const restored=await game(true,[...g.storage]);assert.equal(restored.exec('run.members[0].gear.weapon'),'weapon_s001');assert.equal(restored.exec('bagCount("weapon_s001")'),0);
  g.exec("profile.learnedByCharacter['hero-1']=['job_006'];syncProfile(run);changeJob('job_006');");assert.equal(g.exec('run.members[0].gear.weapon'),null);assert.equal(g.exec('bagCount("weapon_s001")'),1);
  assert.equal(g.exec("equipGear(0,'weapon','weapon_s001')"),false);
  g.exec("enter(E.availableNodes(run).find(n=>n.type==='normal').id)");assert.equal(g.exec("equipGear(1,'weapon','weapon_s001')"),false);
});

test('field menu pauses battle and ineffective field healing does not consume items',async()=>{
  const g=await game();assert.equal(g.exec('useFieldItem("item_r001",0)'),false);assert.equal(g.exec('run.potions'),3);
  g.exec('run.hp=1;useFieldItem("item_r001",0);');assert.equal(g.exec('run.hp'),101);assert.equal(g.exec('run.potions'),2);
  g.exec("enter(E.availableNodes(run).find(n=>n.type==='normal').id);openGroup();tick(1000)");assert.equal(g.exec('run.atb'),0);assert.equal(g.exec('useFieldItem("item_r001",0)'),false);
});

test('equipped weapons change actual damage and old potion saves migrate without loss',async()=>{
  const g=await game();g.exec("Math.random=()=>.5;enter(E.availableNodes(run).find(n=>n.type==='normal').id);run.enemies[0].hp=1000;run.atb=100;act('attack');");
  const plain=1000-g.exec('run.enemies[0].hp');
  g.exec("run.phase='map';addToBag('weapon_s001');equipGear(0,'weapon','weapon_s001');run.phase='battle';run.enemies[0].hp=1000;run.atb=100;act('attack');");assert.ok(1000-g.exec('run.enemies[0].hp')>plain);
  g.exec("const legacy=JSON.parse(JSON.stringify(run));delete legacy.bag;delete legacy.inventoryVersion;legacy.potions=7;run=attachParty(legacy);save();");assert.equal(g.exec('run.potions'),7);assert.equal(g.exec('run.bag.item_r001'),7);
  const restored=await game(true,[...g.storage]);assert.equal(restored.exec('run.potions'),7);
});

test('equipment previews compare replacements and removal without changing the run',async()=>{
  const g=await game();g.exec("addToBag('weapon_s001');equipGear(0,'weapon','weapon_s001');addToBag('weapon_s002');");
  const saved=g.exec('JSON.stringify(run)');
  assert.ok(g.exec("equipmentComparison(run.members[0],'weapon','weapon_s002').after.attack")>g.exec('playerStats(run.members[0]).attack'));
  assert.equal(g.exec("equipmentComparison(run.members[0],'weapon',null).after.attack"),g.exec('run.attack'));
  assert.equal(g.exec('JSON.stringify(run)'),saved);
  g.exec("openGroup();groupPage='gear';groupSlot='weapon';chooseEquipment('weapon_s002');");assert.equal(g.exec('gearConfirm'),true);assert.equal(g.exec('run.members[0].gear.weapon'),'weapon_s001');
  assert.match(g.exec('equipmentPreviewHtml()'),/gain/);g.exec('closeGroupStep()');assert.equal(g.exec('groupSlot'),'weapon');assert.equal(g.exec('gearConfirm'),false);assert.equal(g.exec('JSON.stringify(run)'),saved);
  g.exec("chooseEquipment('weapon_s002');confirmEquipment();");assert.equal(g.exec('run.members[0].gear.weapon'),'weapon_s002');assert.equal(g.exec('bagCount("weapon_s001")'),1);assert.equal(g.exec('bagCount("weapon_s002")'),0);
});

test('equipment comparison shows simultaneous gains and losses and loss of auto haste',async()=>{
  const g=await game();g.exec("catalog.testGear={id:'testGear',name:'Teste',type:'gear',slot:'weapon',attack:5,magic_bonus:5,agility:3};run.members[0].gear.weapon='testGear';openGroup();groupSlot='weapon';gearPreview='weapon_s001';");
  assert.match(g.exec('equipmentPreviewHtml()'),/gain/);assert.match(g.exec('equipmentPreviewHtml()'),/loss/);
  g.exec("run.members[0].gear.accessory='acc_005';groupSlot='accessory';gearPreview=null;");assert.match(g.exec('equipmentPreviewHtml()'),/Perde.*Auto-Acelerar/);
  assert.equal(g.exec("equipmentComparison(run.members[0],'weapon','item_r001')"),null);
});

test('battle passes input to the next ready member and ignores members still charging',async()=>{
  const g=await game();g.exec("run.floor=3;recruit();run.floor=0;enter(E.availableNodes(run).find(n=>n.type==='normal').id);run.members[0].atb=100;run.members[1].atb=100;act('guard');");
  assert.equal(g.exec('run.active'),1);g.exec('selectMember(0)');assert.equal(g.exec('run.active'),1);
  g.exec("beginAction('attack')");assert.equal(g.exec('pendingAction.actor'),1);
});

test('ready characters act automatically in party order without manual switching',async()=>{
  const g=await game();g.exec("run.floor=3;recruit();run.floor=0;enter(E.availableNodes(run).find(n=>n.type==='normal').id);run.members.forEach(m=>m.atb=100);selectMember(1);");assert.equal(g.exec('run.active'),0);
  g.exec("act('guard');");assert.equal(g.exec('run.active'),1);
  g.exec("act('guard');clearBattleEffects();tick(100);");assert.ok(g.exec('run.members.every(m=>m.atb>0&&m.atb<100)'));
  g.exec("run.active=0;run.members[0].atb=5;run.members[1].atb=100;tick(200);");assert.equal(g.exec('run.active'),1);
});

test('action effects identify the attacker and chosen victim and block input until playback ends',async()=>{
  const g=await game();g.exec("enter(E.availableNodes(run).find(n=>n.type==='normal').id);run.enemies.push({...run.enemies[0],hp:500,maxHp:500});run.atb=100;");
  g.rawExec("act('attack',{side:'enemy',index:1})");assert.equal(g.rawExec('currentBattleEffect().source.index'),0);assert.equal(g.rawExec('currentBattleEffect().targets[0].index'),1);
  assert.ok(g.rawExec('currentBattleEffect().targets[0].hp')<0);assert.match(g.rawExec('battlefield()'),/action-callout/);
  const hp=g.rawExec('run.enemies[1].hp');g.rawExec("run.atb=100;act('attack',{side:'enemy',index:1});tick(100)");assert.equal(g.rawExec('run.enemies[1].hp'),hp);
  g.rawExec('advanceBattleEffects(2)');assert.equal(g.rawExec('currentBattleEffect()'),null);assert.equal(g.rawExec('canUseAction("attack")'),true);
});

test('healing and enemy effects show actual results; pause preserves playback',async()=>{
  const g=await game();g.exec("enter(E.availableNodes(run).find(n=>n.type==='normal').id);run.hp=10;run.atb=100;");
  g.rawExec("act('potion')");assert.equal(g.rawExec('currentBattleEffect().kind'),'heal');assert.equal(g.rawExec('currentBattleEffect().targets[0].label'),'+100');
  g.rawExec('openPause();tick(100)');assert.equal(g.rawExec('currentBattleEffect().elapsed'),0);
  g.exec("shellAction('resume');run.atb=0;run.enemies[0].atb=100;tick(200)");assert.equal(g.rawExec('currentBattleEffect().source.side'),'enemy');assert.equal(g.rawExec('currentBattleEffect().targets[0].side'),'ally');
});

test('finishing blow stays visible before victory and the default stance uses a static victory frame',async()=>{
  const g=await game();g.exec("enter(E.availableNodes(run).find(n=>n.type==='normal').id);run.enemies[0].hp=1;run.atb=100;");g.rawExec("act('attack')");
  assert.equal(g.rawExec('run.phase'),'reward');assert.match(g.rawExec('battlefield()'),/monster-sprite/);assert.doesNotMatch(g.rawExec('battlefield()'),/scene-overlay/);
  g.rawExec('advanceBattleEffects(2)');assert.match(g.rawExec('battlefield()'),/scene-overlay/);
  assert.match(g.rawExec('actorSprite(run.members[0])'),/victory-still\.png/);
  for(const actor of ['bartz','lenna','faris','krile']){const bytes=fs.readFileSync(path.join(__dirname,'..','images','characters',actor,'freelancer','victory-still.png'));assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');}
});

test('shops preserve stock and purchases, reject unaffordable orders and do not sell equipped copies',async()=>{
  const g=await game();g.exec("run.route.nodes[0].type='shop';enter(run.route.nodes[0].id);");assert.equal(g.exec('run.phase'),'shop');
  assert.equal(g.exec('shopBuy(0)'),false);g.exec('run.gil=200;shopBuy(0);');assert.equal(g.exec('run.gil'),170);assert.equal(g.exec('run.potions'),4);assert.equal(g.exec('run.encounterData.stock[0].count'),2);
  const restored=await game(true,[...g.storage]);assert.equal(restored.exec('run.encounterData.stock[0].count'),2);assert.equal(restored.exec('run.potions'),4);
  g.exec("addToBag('weapon_s001');equipGear(0,'weapon','weapon_s001');");assert.equal(g.exec('shopSell("weapon_s001")'),false);
  g.exec("addToBag('weapon_s001');shopSell('weapon_s001');");assert.equal(g.exec('run.members[0].gear.weapon'),'weapon_s001');assert.equal(g.exec('bagCount("weapon_s001")'),0);
  g.exec('run.hp=1;run.mp=0;shopHeal();');assert.equal(g.exec('run.hp'),240);assert.equal(g.exec('run.mp'),30);assert.equal(g.exec('shopHeal()'),false);
  g.exec('leaveEncounter()');assert.equal(g.exec('run.phase'),'map');assert.equal(g.exec('shopBuy(0)'),false);
});

test('event costs are enforced and each choice resolves once across reload',async()=>{
  const g=await game();g.exec("run.route.nodes[0].type='event';enter(run.route.nodes[0].id);run.encounterData.eventId='shrine';run.encounterData.relicId='ember';run.hp=10;");
  assert.equal(g.exec('chooseEvent("offering")'),false);assert.equal(g.exec('run.hp'),10);g.exec('leaveEncounter()');assert.equal(g.exec('run.phase'),'event');
  g.exec('run.hp=240;chooseEvent("offering");');assert.equal(g.exec('run.hp'),168);assert.equal(g.exec('run.relics[0]'),'ember');assert.equal(g.exec('playerStats(run.members[0]).attack'),33);
  assert.equal(g.exec('chooseEvent("offering")'),false);const restored=await game(true,[...g.storage]);assert.equal(restored.exec('run.encounterData.resolved'),true);assert.equal(restored.exec('chooseEvent("offering")'),false);
  restored.exec('leaveEncounter()');assert.equal(restored.exec('run.phase'),'map');
});

test('treasures grant one passive relic to the whole party without duplicate claims',async()=>{
  const g=await game();g.exec("run.floor=3;recruit();run.floor=0;run.route.nodes[0].type='treasure';enter(run.route.nodes[0].id);chooseTreasure('ward');");
  assert.equal(g.exec('playerStats(run.members[0]).defense'),5);assert.equal(g.exec('playerStats(run.members[1]).defense'),5);assert.equal(g.exec('chooseTreasure("prism")'),false);
  const restored=await game(true,[...g.storage]);assert.equal(restored.exec('run.relics.length'),1);assert.equal(restored.exec('run.encounterData.resolved'),true);
});

test('map migration adds noncombat encounters only ahead, preserving current node and connections',async()=>{
  const E=require('../public/roguelike/engine'),g=await game();
  for(let i=0;i<10;i++){const r=E.createMap();for(const type of ['shop','event','treasure','rest'])assert.ok(r.nodes.some(n=>n.type===type));assert.equal(r.nodes.filter(n=>n.type==='boss').length,4);}
  g.exec("run.floor=5;run.phase='battle';run.route.version=1;run.route.current='f5-0';run.route.nodes.forEach(n=>{if(n.type!=='boss')n.type='normal';});var oldNodes=JSON.stringify(run.route.nodes.filter(n=>n.floor<=5));var edges=JSON.stringify(run.route.nodes.map(n=>n.next));E.ensureMap(run);");
  assert.equal(g.exec('JSON.stringify(run.route.nodes.filter(n=>n.floor<=5))'),g.exec('oldNodes'));assert.equal(g.exec('JSON.stringify(run.route.nodes.map(n=>n.next))'),g.exec('edges'));assert.equal(g.exec('run.route.current'),'f5-0');assert.equal(g.exec('run.phase'),'battle');assert.ok(g.exec('run.route.nodes.some(n=>n.floor>5&&n.type==="shop")'));
});

test('late loot excludes starter gear, elites and bosses improve the quality band, while freelancers receive advanced gear without being able to equip it',async()=>{
  const g=await game();
  const earlyMax=g.exec('Math.max(...tieredGearPools(1,"normal").weapons.map(gearScore))');
  assert.ok(g.exec('Math.min(...tieredGearPools(11,"elite").weapons.map(gearScore))')>earlyMax);
  assert.ok(g.exec('Math.min(...tieredGearPools(6,"boss").weapons.map(gearScore))')>=g.exec('Math.min(...tieredGearPools(6,"normal").weapons.map(gearScore))'));
  assert.ok(g.exec('new Set(tieredGearPools(11,"elite").weapons.map(i=>i.family)).size')>1);
  assert.equal(g.exec('compatible(run.members[0],catalog.weapon_s001)'),true);assert.equal(g.exec('compatible(run.members[0],catalog.weapon_s003)'),false);
  g.exec('run.floor=11;run.encounter="elite";');for(let i=0;i<30;i++){g.exec('lootChoices()');assert.ok(g.exec('gearScore(catalog[run.lootChoices[0].itemId])')>earlyMax);}
  g.exec("profile.learnedByCharacter['hero-1']=['job_006'];syncProfile(run);changeJob('job_006');");assert.ok(g.exec('tieredGearPools(8,"normal").weapons.length')>0);assert.equal(g.exec('tieredGearPools(8,"normal").weapons.every(i=>compatible(run.members[0],i))'),true);
});

test('boss drops and shop stock use progressive gear and avoid repeats when fresh choices remain',async()=>{
  const g=await game();g.exec('run.floor=9;run.encounter="boss";grantVictoryLoot();');
  assert.ok(g.exec('gearScore(catalog[run.victoryDrops[1].itemId])')>=g.exec('Math.min(...tieredGearPools(9,"boss").weapons.map(gearScore))'));
  g.exec('run.floor=10;startEncounter("shop");');assert.ok(g.exec('run.encounterData.stock.filter(s=>catalog[s.itemId]?.type==="gear").every(s=>gearScore(catalog[s.itemId])>=Math.min(...tieredGearPools(10,"shop")[catalog[s.itemId].slot==="weapon"?"weapons":"armor"].map(gearScore)))'));
  g.exec('var candidates=tieredGearPools(5,"normal").weapons;var owned=candidates[0];addToBag(owned.id);');
  assert.ok(g.exec('candidates.length')>1);for(let i=0;i<15;i++)assert.notEqual(g.exec('pickTieredGear(candidates).id'),g.exec('owned.id'));
});

test('discovery, paid learning and victory PJ persist separately from run ABP',async()=>{
  const g=await game();g.exec("newRun();run.floor=3;run.encounter='boss';awardJobPoints();discoverJob('job_002');");
  assert.equal(g.exec('awardJobPoints()'),0);assert.equal(g.exec('profile.points'),15);
  assert.equal(g.exec("learnJob('job_002')"),false);assert.equal(g.exec('run.unlocked.length'),0);assert.equal(g.exec('run.job'),'job_001');
  g.exec("run.floor=4;run.encounter='normal';awardJobPoints();");assert.equal(g.exec("learnJob('job_002')"),true);assert.equal(g.exec('profile.points'),0);
  assert.equal(g.exec("learnJob('job_002')"),false);assert.equal(g.exec("learnJob('job_006')"),false);
  g.exec("run.abp.job_002=30;run.gil=999;save();");const restored=await game(false,[...g.storage]);
  assert.equal(restored.exec("learnedJobsFor('hero-1').includes('job_002')"),true);
  restored.exec("openRunSetup();startJobs['hero-1']='job_002';newRun(true);");
  assert.equal(restored.exec('run.job'),'job_002');assert.equal(restored.exec('run.gil'),0);assert.equal(restored.exec('Object.keys(run.abp).length'),0);
});

test('recruitment registers allies and purchased slots gate the starting party',async()=>{
  const g=await game();g.exec("newRun();run.phase='recruit';startEncounter('recruit');");
  assert.equal(g.exec("chooseRecruit('join')"),true);assert.equal(g.exec('run.members.length'),2);assert.equal(g.exec("chooseRecruit('join')"),false);
  assert.equal(g.exec('profile.roster.length'),2);g.exec("var recruitedId=run.members[1].id;openRunSetup();toggleStartingMember(recruitedId);");
  assert.equal(g.exec('startParty.length'),1);assert.equal(g.exec('unlockStartingSlot()'),false);
  g.exec('profile.points=440;');assert.equal(g.exec('unlockStartingSlot()'),true);assert.equal(g.exec('profile.points'),360);
  g.exec('toggleStartingMember(recruitedId);newRun(true);');assert.equal(g.exec('run.members.length'),2);assert.equal(g.exec('run.members[1].id===recruitedId'),true);
  assert.equal(g.exec('unlockStartingSlot()'),true);assert.equal(g.exec('unlockStartingSlot()'),true);assert.equal(g.exec('profile.points'),0);assert.equal(g.exec('unlockStartingSlot()'),false);
  const restored=await game(false,[...g.storage]);assert.equal(restored.exec('profile.startingSlots'),4);assert.equal(restored.exec('run.members[1].id===profile.roster[1]'),true);
  restored.exec("startParty=['hero-1','hero-1'];");assert.equal(restored.exec('startingPartyValid()'),false);
});

test('Freelancer advanced gear returns to the bag on reload and learned Knight can equip it',async()=>{
  const g=await game();g.exec("newRun();run.members[0].gear.weapon='weapon_s003';save();");
  const restored=await game(false,[...g.storage]);assert.equal(restored.exec('run.members[0].gear.weapon'),null);assert.equal(restored.exec('run.bag.weapon_s003'),1);
  assert.equal(restored.exec("compatible(run.members[0],catalog.weapon_s003)"),false);
  restored.exec("profile.points=20;discoverJob('job_002');learnJob('job_002');shellMode='game';changeJob('job_002');");
  assert.equal(restored.exec("compatible(run.members[0],catalog.weapon_s003)"),true);
});

test('glossary includes every reference category, search and adaptation equipment rules',async()=>{
  const g=await game();for(const category of ['jobs','characters','magic','abilities','equipment','items','monsters','relics'])assert.ok(g.exec(`glossaryEntries('${category}').length`)>0,category);
  assert.equal(g.exec("glossaryEntries('jobs').length"),26);
  g.exec("shellMode='glossary';glossaryCategory='equipment';glossarySearch='Espada';render();");assert.match(g.exec('app.innerHTML'),/Aventureiro/);assert.match(g.exec('app.innerHTML'),/base FF5/);
  g.exec("glossarySearch='xyz-sem-registro';render();");assert.match(g.exec('app.innerHTML'),/Nenhum registro encontrado/);
});

test('legacy migration preserves equipped jobs and credits completed battles only once',async()=>{
  const seed=await game();seed.exec("newRun();run.members[0].job='job_002';run.floor=3;run.phase='battle';run.unlocked=['job_002','job_006'];save();");
  const saved=[...seed.storage].filter(([key])=>key!=='ffv-profile-v1');const migrated=await game(false,saved);
  assert.equal(migrated.exec('profile.points'),10);assert.equal(migrated.exec("learnedJobsFor('hero-1').includes('job_002')"),true);assert.equal(migrated.exec("learnedJobsFor('hero-1').includes('job_006')"),false);
  assert.equal(migrated.exec("profile.discoveredJobs.includes('job_006')"),true);
  const again=await game(false,[...migrated.storage]);assert.equal(again.exec('profile.points'),10);assert.equal(again.exec('run.job'),'job_002');
});

test('jobs are learned independently and restrict switching and initial choices per character',async()=>{
  const g=await game();g.exec("newRun();recruit('hero-2');profile.points=100;discoverJob('job_002');");
  assert.equal(g.exec("learnJob('job_002','hero-1')"),true);assert.equal(g.exec('profile.points'),80);
  assert.equal(g.exec("learnedJobsFor('hero-2').includes('job_002')"),false);
  g.exec("run.active=1;changeJob('job_002');");assert.equal(g.exec('run.job'),'job_001');
  g.exec("profile.startingSlots=2;openRunSetup();toggleStartingMember('hero-2');startJobs['hero-2']='job_002';");assert.equal(g.exec('startingPartyValid()'),false);
  assert.equal(g.exec("learnJob('job_002','hero-2')"),true);assert.equal(g.exec('profile.points'),60);
  assert.equal(g.exec("learnJob('job_002','hero-2')"),false);assert.equal(g.exec("learnJob('job_002','unknown')"),false);
  assert.equal(g.exec('startingPartyValid()'),true);g.exec('newRun(true);');assert.equal(g.exec('run.members[1].job'),'job_002');
  const restored=await game(false,[...g.storage]);assert.equal(restored.exec("learnedJobsFor('hero-1').includes('job_002')"),true);assert.equal(restored.exec("learnedJobsFor('hero-2').includes('job_002')"),true);
  assert.equal(restored.exec("learnedJobsFor('hero-3').includes('job_002')"),false);
});

test('old global profile migrates purchases to Bartz and preserves equipped jobs for their owners',async()=>{
  const g=await game();g.exec("newRun();recruit('hero-2');run.members[1].job='job_006';save();");
  const oldProfile={version:1,points:33,discoveredJobs:['job_002','job_006'],learnedJobs:['job_001','job_002'],roster:['hero-1','hero-2'],startingSlots:2,claims:[],migrated:true};
  const storage=[...g.storage].filter(([key])=>key!=='ffv-profile-v1');storage.push(['ffv-profile-v1',JSON.stringify(oldProfile)]);
  const restored=await game(false,storage);assert.equal(restored.exec('profile.points'),33);
  assert.equal(restored.exec("learnedJobsFor('hero-1').includes('job_002')"),true);assert.equal(restored.exec("learnedJobsFor('hero-2').includes('job_002')"),false);
  assert.equal(restored.exec("learnedJobsFor('hero-2').includes('job_006')"),true);assert.equal(restored.exec("learnedJobsFor('hero-1').includes('job_006')"),false);
});

test('spell purchases are shared by compatible jobs, persist in the run and reset next run',async()=>{
  const g=await game();g.exec("newRun();recruit('hero-2');run.members.forEach(m=>m.job='job_006');run.floor=4;startEncounter('shop');run.gil=100;");
  assert.equal(g.exec("canCastSpell(run.members[0],'spell_b001')"),false);
  assert.equal(g.exec("shopBuySpell('spell_b001')"),true);assert.equal(g.exec('run.gil'),65);
  assert.equal(g.exec("canCastSpell(run.members[0],'spell_b001')"),true);assert.equal(g.exec("canCastSpell(run.members[1],'spell_b001')"),true);
  assert.equal(g.exec("shopBuySpell('spell_b001')"),false);assert.equal(g.exec('run.gil'),65);
  g.exec("run.members[1].job='job_005';");assert.equal(g.exec("canCastSpell(run.members[1],'spell_b001')"),false);
  g.exec("recruit('hero-3');run.members[2].job='job_006';save();");const reload=await game(false,[...g.storage]);assert.equal(reload.exec("canCastSpell(run.members[2],'spell_b001')"),true);
  reload.exec("newRun();");assert.equal(reload.exec('run.spells.length'),0);
});

test('learned spell menus require school, inherited mastery, mana and target confirmation',async()=>{
  const g=await game();g.exec("newRun();run.job='job_006';enter(E.availableNodes(run)[0].id);run.enemies[0].hp=run.enemies[0].maxHp=9999;run.atb=100;commandPage='magic';render();");
  assert.match(g.exec('battleCommands()'),/Fogo/);assert.doesNotMatch(g.exec('battleCommands()'),/Gelo/);assert.equal(g.exec("canUseAction('spell:spell_b004')"),false);
  g.exec("learnRunSpell('spell_b004');beginAction('spell:spell_b004');");assert.equal(g.exec('run.mp'),30);
  g.exec('cancelCommand();');assert.equal(g.exec('run.mp'),30);
  g.exec("beginAction('spell:spell_b004');confirmTarget('enemy',0);");assert.equal(g.exec('run.mp'),26);assert.ok(g.exec('run.enemies[0].hp<run.enemies[0].maxHp'));
  g.exec("run.job='job_002';run.secondary='job_006';");assert.equal(g.exec("canCastSpell(run.members[0],'spell_b004')"),false);
  g.exec("run.mastered.push('job_006');");assert.equal(g.exec("canCastSpell(run.members[0],'spell_b004')"),true);
  g.exec("run.mp=0;run.atb=100;");assert.equal(g.exec("canUseAction('spell:spell_b004')"),false);
});

test('healing, revival, protect, slow and summoning use their actual spell effects',async()=>{
  const g=await game();g.exec("newRun();recruit('hero-2');run.job='job_005';enter(E.availableNodes(run)[0].id);run.enemies[0].hp=9999;run.mp=200;run.hp=10;run.atb=100;learnRunSpell('spell_w002');act('spell:spell_w002',{side:'ally',index:0});");assert.ok(g.exec('run.hp')>150);assert.equal(g.exec('run.mp'),191);
  g.exec("learnRunSpell('spell_w005');run.members[1].hp=0;run.atb=100;act('spell:spell_w005',{side:'ally',index:1});");assert.ok(g.exec('run.members[1].hp')>0);
  g.exec("learnRunSpell('spell_w007');run.atb=100;var oldDef=playerStats(run.members[1]).defense;act('spell:spell_w007',{side:'ally',index:1});");assert.equal(g.exec('playerStats(run.members[1]).defense-oldDef'),10);
  g.exec("run.job='job_009';learnRunSpell('spell_t003');run.atb=100;act('spell:spell_t003',{side:'enemy',index:0});");assert.equal(g.exec('run.enemies[0].slow'),true);
  g.exec("run.job='job_010';learnRunSpell('spell_s015');run.enemies.push({...run.enemies[0]});run.atb=100;act('spell:spell_s015',{side:'enemy',index:0});");assert.ok(g.exec('run.enemies.every(m=>m.hp<9999)'));
});

test('spell reward teaches once and Red Mage cannot use advanced scrolls',async()=>{
  const g=await game();g.exec("newRun();run.phase='reward';run.rewards=['spell:spell_b003'];reward('spell:spell_b003');reward('spell:spell_b003');run.job='job_008';");
  assert.equal(g.exec('run.spells.length'),1);assert.equal(g.exec("canCastSpell(run.members[0],'spell_b003')"),false);
  g.exec("learnRunSpell('spell_b002');");assert.equal(g.exec("canCastSpell(run.members[0],'spell_b002')"),true);
});

test('each magical job grants its free starter on run setup and job changes without granting other spells',async()=>{
  const g=await game();
  for(const [job,spell] of [['job_005','spell_w001'],['job_006','spell_b001'],['job_008','spell_w001'],['job_009','spell_t001'],['job_010','spell_s015']]){
    g.exec(`profile.learnedByCharacter['hero-1']=['${job}'];openRunSetup();startJobs['hero-1']='${job}';newRun(true);`);
    assert.equal(g.exec('run.spells.length'),1);assert.equal(g.exec(`canCastSpell(run.members[0],'${spell}')`),true);assert.equal(g.exec('run.gil'),0);
    g.exec('ensureSpells(run);ensureSpells(run);');assert.equal(g.exec('run.spells.length'),1);
  }
  g.exec("newRun();profile.learnedByCharacter['hero-1']=['job_006','job_005'];changeJob('job_006');");assert.equal(g.exec('run.spells.length'),1);
  assert.equal(g.exec("run.spells.includes('spell_b004')"),false);
  g.exec("changeJob('job_005');");assert.equal(g.exec('run.spells.length'),2);assert.equal(g.exec('run.gil'),0);
  const restored=await game(false,[...g.storage]);assert.equal(restored.exec('run.spells.length'),2);
});

test('physical jobs begin with their own usable skill and acquiring a job alone grants no spell',async()=>{
  const g=await game();g.exec("newRun();profile.points=500;discoverJob('job_006');learnJob('job_006','hero-1');");assert.equal(g.exec('run.spells.length'),0);
  for(const job of Object.keys(require('../public/roguelike/engine').jobs).filter(id=>!['job_005','job_006','job_008','job_009','job_010'].includes(id))){
    g.exec(`newRun();profile.learnedByCharacter['hero-1']=['${job}'];changeJob('${job}');enter(E.availableNodes(run)[0].id);run.atb=100;run.gil=100;`);
    assert.equal(g.exec("canUseAction('job')"),true);assert.equal(g.exec('run.spells.length'),0);
  }
});
