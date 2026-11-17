// Non-combat encounters persist their stock, choices and results in the run.
const relicCatalog={
  ember:{name:'Emblema da Brasa',description:'+5 de ataque para todo o grupo.',attack:5},
  ward:{name:'Selo da Fortaleza',description:'+3 de defesa para todo o grupo.',defense:3},
  prism:{name:'Prisma Arcano',description:'+3 de magia e +2 de agilidade para todo o grupo.',magic:3,agility:2}
};
function relicStats(){return (run.relics||[]).reduce((sum,id)=>{const r=relicCatalog[id];for(const key of ['attack','defense','magic','agility'])sum[key]+=(r?.[key]||0);return sum;},{attack:0,defense:0,magic:0,agility:0});}
function grantRelic(id){if(!relicCatalog[id]||(run.relics||[]).includes(id))return false;(run.relics||=[]).push(id);return true;}
function missingRelics(){return Object.keys(relicCatalog).filter(id=>!(run.relics||[]).includes(id));}
function randomEntry(list){return list[Math.floor(Math.random()*list.length)];}
let shopView='buy';
function startEncounter(kind){
  shopView='buy';run.phase=kind;run.enemies=[];
  if(kind==='shop'){
    const pools=tieredGearPools(run.floor,'shop');
    const selected=[pickTieredGear(pools.weapons),pickTieredGear(pools.armor)].filter(Boolean);
    const stock=[['item_r001',30,3],['item_r004',55,2],['item_r008',65,1],['item_r002',45,2]].map(([itemId,price,count])=>({itemId,price,count}));
    selected.forEach(i=>stock.push({itemId:i.id,price:75+Math.round((i.attack||i.defense||5)*2),count:1}));
    const relicId=randomEntry(missingRelics());if(relicId)stock.push({relicId,price:140,count:1});
    run.encounterData={kind,stock,spellStock:spellOffers().map(s=>({spellId:s.id,price:s.price})),healed:false};log('Uma caravana montou uma loja à beira da rota.');
  }else if(kind==='recruit'){
    const character=randomEntry(GameConfig.characters.filter(c=>!run.members.some(m=>m.id===c.id)));
    run.encounterData={kind,characterId:character?.id||null,resolved:false};log('Um viajante encontrou seu grupo na rota.');
  }else if(kind==='treasure'){
    const choices=missingRelics().sort(()=>Math.random()-.5).slice(0,3);
    run.encounterData={kind,choices,resolved:false};log('Um cofre de cristal espera sua escolha.');
  }else{
    run.encounterData={kind,eventId:randomEntry(Object.keys(eventCatalog)),relicId:randomEntry(missingRelics())||null,resolved:false};log('Você encontrou um acontecimento na rota.');
  }
  save();render();
}
function encounterAllowed(kind){return shellMode==='game'&&run.phase===kind&&run.encounterData?.kind===kind;}
function shopBuy(index){
  if(!encounterAllowed('shop')||!Number.isInteger(index))return false;
  const entry=run.encounterData.stock[index];if(!entry||entry.count<1||run.gil<entry.price)return false;
  if(entry.relicId?!grantRelic(entry.relicId):!addToBag(entry.itemId))return false;
  run.gil-=entry.price;entry.count--;log(`Comprou ${entry.relicId?relicCatalog[entry.relicId].name:nameOf(catalog[entry.itemId].name)} por ${entry.price} gil.`);save();render();return true;
}
function shopBuySpell(id){
  if(!encounterAllowed('shop'))return false;
  const entry=run.encounterData.spellStock?.find(s=>s.spellId===id);if(!entry||run.gil<entry.price||!learnRunSpell(id))return false;
  run.gil-=entry.price;log(`Comprou ${spellCatalog[id].command}. Magia aprendida para todo o grupo nesta run.`);save();render();return true;
}
function sellPrice(id){return Math.max(10,Math.min(70,Math.round((catalog[id]?.price||100)*.08)));}
function shopSell(id){
  if(!encounterAllowed('shop')||catalog[id]?.type!=='gear'||bagCount(id)<1)return false;
  const price=sellPrice(id);run.bag[id]--;run.gil+=price;log(`Vendeu ${nameOf(catalog[id].name)} por ${price} gil.`);save();render();return true;
}
function shopHeal(){
  const cost=35+run.floor*3;
  if(!encounterAllowed('shop')||run.encounterData.healed||run.gil<cost||!run.members.some(m=>m.hp<m.maxHp||m.mp<m.maxMp))return false;
  run.gil-=cost;run.encounterData.healed=true;run.members.forEach(m=>{m.hp=m.maxHp;m.mp=m.maxMp;});log(`O curandeiro restaurou HP e MP do grupo por ${cost} gil.`);save();render();return true;
}
const eventCatalog={
  spring:{title:'A fonte entre as raízes',text:'Uma nascente reflete duas cores. O guardião da fonte permite beber de apenas uma delas.',options:[
    {id:'life',label:'Beber da água verde',detail:'Recuperar 60% do HP máximo de cada aliado vivo.',apply(){run.members.filter(m=>m.hp>0).forEach(m=>m.hp=Math.min(m.maxHp,m.hp+Math.round(m.maxHp*.6)));return 'A fonte recuperou o HP dos aliados vivos.';}},
    {id:'mana',label:'Beber da água azul',detail:'Restaurar todo o MP do grupo.',apply(){run.members.forEach(m=>m.mp=m.maxMp);return 'O grupo recuperou todo o MP.';}},
    {id:'leave',label:'Seguir sem beber',detail:'Nenhuma mudança.',apply(){return 'Você deixou a fonte para outro viajante.'}}
  ]},
  shrine:{title:'O altar esquecido',text:'Uma relíquia flutua sobre o altar. Para levá-la, o cristal pede parte da vitalidade de quem conduz o grupo.',options:[
    {id:'offering',label:'Oferecer vitalidade',detail(){return `Perder ${Math.round(run.maxHp*.3)} HP de ${run.members[run.active].name}; receber ${run.encounterData.relicId?relicCatalog[run.encounterData.relicId].name:'80 gil'}. Não pode causar nocaute.`;},allowed(){return run.hp>Math.round(run.maxHp*.3);},apply(){run.hp-=Math.round(run.maxHp*.3);const id=run.encounterData.relicId;if(id&&grantRelic(id))return `Você recebeu ${relicCatalog[id].name}. ${relicCatalog[id].description}`;run.gil+=80;return 'O altar concedeu 80 gil.';}},
    {id:'leave',label:'Respeitar o altar',detail:'Sair sem oferecer HP.',apply(){return 'Você seguiu viagem com sua vitalidade intacta.'}}
  ]},
  mentor:{title:'O viajante de espada quebrada',text:'Um veterano reconhece o brilho do seu cristal e oferece uma lição antes de partir.',options:[
    {id:'train',label:'Treinar com o veterano',detail(){return `Pagar 50 gil; ${run.members[run.active].name} ganha +6 de ataque base nesta run.`;},allowed(){return run.gil>=50;},apply(){run.gil-=50;run.attack+=6;return `${run.members[run.active].name} ganhou +6 de ataque base.`;}},
    {id:'supplies',label:'Pedir suprimentos',detail:'Receber 1 Éter gratuitamente.',apply(){addToBag('item_r004');return 'O viajante entregou 1 Éter.';}},
    {id:'leave',label:'Agradecer e partir',detail:'Nenhuma mudança.',apply(){return 'O veterano desejou boa sorte ao grupo.'}}
  ]},
  caravan:{title:'A mochila do mercador',text:'Um mercador perdeu seus remédios na travessia. Ele oferece uma troca antes de voltar à cidade.',options:[
    {id:'trade',label:'Trocar duas Poções',detail:'Entregar 2 Poções; receber 75 gil.',allowed(){return bagCount('item_r001')>=2;},apply(){run.bag.item_r001-=2;run.gil+=75;return 'Você recebeu 75 gil por 2 Poções.';}},
    {id:'gift',label:'Aceitar um presente',detail:'Receber 1 Cauda de Fênix.',apply(){addToBag('item_r008');return 'O mercador entregou 1 Cauda de Fênix.';}},
    {id:'leave',label:'Continuar a jornada',detail:'Nenhuma mudança.',apply(){return 'Você deixou o mercador seguir seu caminho.'}}
  ]}
};
function chooseEvent(id){
  if(!encounterAllowed('event')||run.encounterData.resolved)return false;
  const option=eventCatalog[run.encounterData.eventId]?.options.find(o=>o.id===id);if(!option||option.allowed&&!option.allowed())return false;
  run.encounterData.result=option.apply();run.encounterData.resolved=true;log(run.encounterData.result);save();render();return true;
}
function chooseTreasure(id){
  if(!encounterAllowed('treasure')||run.encounterData.resolved)return false;
  if(id==='gil'){if(run.encounterData.choices.length)return false;run.gil+=100;run.encounterData.result='Você recebeu 100 gil.';}
  else{if(!run.encounterData.choices.includes(id)||!grantRelic(id))return false;run.encounterData.result=`Você recebeu ${relicCatalog[id].name}. ${relicCatalog[id].description}`;}
  run.encounterData.resolved=true;log(run.encounterData.result);save();render();return true;
}
function leaveEncounter(){if(!['shop','event','treasure','recruit'].includes(run.phase)||shellMode!=='game'||run.phase!=='shop'&&!run.encounterData?.resolved)return;run.phase='map';save();render();}
function encounterContent(){
  const state=run.encounterData;
  if(run.phase==='shop'){
    const stock=state.stock.map((entry,index)=>{const item=catalog[entry.itemId],relic=relicCatalog[entry.relicId];return `<button class="menu-option shop-product" data-shop-buy="${index}" ${entry.count>0&&run.gil>=entry.price?'':'disabled'}><span>${escapeHtml(relic?.name||nameOf(item.name))}<small>${relic?relic.description:item.type==='gear'?gearDescription(item):itemDescription(item)}</small></span><span>${entry.count?entry.price+' gil':'Esgotado'}<small>Estoque ${entry.count}</small></span></button>`;}).join('');
    const selling=inventoryEntries('gear').map(i=>`<button class="menu-option shop-product" data-shop-sell="${i.id}"><span>${escapeHtml(nameOf(i.name))}<small>Na mochila: ${i.count}</small></span><span>${sellPrice(i.id)} gil</span></button>`).join('')||'<p class="dialog-note">Nenhum equipamento na mochila para vender.</p>';
    const spells=(state.spellStock||spellOffers().map(s=>({spellId:s.id,price:s.price}))).map(entry=>{const spell=spellCatalog[entry.spellId];return `<button class="menu-option shop-product" data-shop-spell="${spell.id}" ${run.spells.includes(spell.id)||run.gil<entry.price?'disabled':''}><span>${escapeHtml(spell.command)}<small>${escapeHtml(spellDescription(spell))}</small></span><span>${run.spells.includes(spell.id)?'Aprendida':entry.price+' gil'}</span></button>`;}).join('');
    const cost=35+run.floor*3;
    return windowPanel('encounter-window shop-window',`<div class="window-caption">Caravana dos Cristais <b>${run.gil} gil</b></div><div class="shop-tabs"><button data-shop-view="buy" class="menu-option ${shopView==='buy'?'selected':''}">Comprar</button><button data-shop-view="magic" class="menu-option ${shopView==='magic'?'selected':''}">Magias</button><button data-shop-view="sell" class="menu-option ${shopView==='sell'?'selected':''}">Vender</button></div><div class="encounter-options">${shopView==='buy'?stock:shopView==='magic'?'<p class="dialog-note">Uma compra ensina a magia ao grupo inteiro nesta run. Cada job usa suas escolas.</p>'+spells:selling}</div><button class="menu-option" id="shop-heal" ${!state.healed&&run.gil>=cost&&run.members.some(m=>m.hp<m.maxHp||m.mp<m.maxMp)?'':'disabled'}>Curandeiro <small>${state.healed?'Serviço utilizado':`Restaurar HP e MP · ${cost} gil`}</small></button><button class="menu-option" id="leave-encounter">Sair da loja</button>`);
  }
  if(run.phase==='recruit'){const character=GameConfig.characters.find(c=>c.id===state.characterId);return windowPanel('encounter-window',`<div class="window-caption">${state.resolved?'Encontro de aliados':character?escapeHtml(character.name)+' na estrada':'Um grupo completo'}</div><p class="event-copy">${state.resolved?escapeHtml(state.result):character?`Um viajante chamado ${escapeHtml(character.name)} pede para acompanhar sua jornada. Recrutar registra esse aliado para futuras runs.`:'Seu grupo já tem todos os personagens.'}</p>${state.resolved?'<button class="menu-option" id="leave-encounter">Continuar a jornada</button>':`<button class="menu-option" data-recruit-choice="join" ${!character||run.members.length>=4?'disabled':''}>Convidar para o grupo<small>Entra como Aventureiro. Você pode trocar para um job aprendido.</small></button><button class="menu-option" data-recruit-choice="leave">Seguir sem recrutar</button>`}`);}
  const event=eventCatalog[state.eventId],title=run.phase==='treasure'?'O cofre de cristal':event.title;
  if(state.resolved)return windowPanel('encounter-window',`<div class="window-caption">${escapeHtml(title)}</div><p class="event-copy">${escapeHtml(state.result)}</p><button id="leave-encounter" class="menu-option">Continuar a jornada</button>`);
  const options=run.phase==='treasure'?(state.choices.length?state.choices.map(id=>`<button class="menu-option" data-treasure-choice="${id}">${relicCatalog[id].name}<small>${relicCatalog[id].description}</small></button>`).join(''):'<button class="menu-option" data-treasure-choice="gil">Receber 100 gil</button>'):event.options.map(o=>`<button class="menu-option" data-event-choice="${o.id}" ${!o.allowed||o.allowed()?'':'disabled'}>${escapeHtml(o.label)}<small>${escapeHtml(typeof o.detail==='function'?o.detail():o.detail)}</small></button>`).join('');
  return windowPanel('encounter-window',`<div class="encounter-emblem" aria-hidden="true">${run.phase==='treasure'?'▣':'?'}</div><div class="window-caption">${escapeHtml(title)}</div><p class="event-copy">${run.phase==='treasure'?'Escolha uma relíquia. Seu efeito passivo vale para todo o grupo até o fim desta jornada.':escapeHtml(event.text)}</p><div class="encounter-options">${options}</div>`);
}
function chooseRecruit(choice){if(!encounterAllowed('recruit')||run.encounterData.resolved||!['join','leave'].includes(choice))return false;if(choice==='join'&&!recruit(run.encounterData.characterId))return false;run.encounterData.resolved=true;run.encounterData.result=choice==='join'?run.log[0]:'Você continuou sem recrutar este viajante.';save();render();return true;}
function bindEncounters(){
  app.querySelectorAll('[data-recruit-choice]').forEach(b=>b.onclick=()=>chooseRecruit(b.dataset.recruitChoice));
  app.querySelectorAll('[data-shop-spell]').forEach(b=>b.onclick=()=>shopBuySpell(b.dataset.shopSpell));
  app.querySelectorAll('[data-shop-buy]').forEach(b=>b.onclick=()=>shopBuy(Number(b.dataset.shopBuy)));
  app.querySelectorAll('[data-shop-sell]').forEach(b=>b.onclick=()=>shopSell(b.dataset.shopSell));
  app.querySelectorAll('[data-shop-view]').forEach(b=>b.onclick=()=>{shopView=b.dataset.shopView;if(shopView==='magic'&&!run.encounterData.spellStock){run.encounterData.spellStock=spellOffers().map(s=>({spellId:s.id,price:s.price}));save();}render();});
  app.querySelectorAll('[data-event-choice]').forEach(b=>b.onclick=()=>chooseEvent(b.dataset.eventChoice));
  app.querySelectorAll('[data-treasure-choice]').forEach(b=>b.onclick=()=>chooseTreasure(b.dataset.treasureChoice));
  const heal=app.querySelector('#shop-heal');if(heal)heal.onclick=shopHeal;
  const leave=app.querySelector('#leave-encounter');if(leave)leave.onclick=leaveEncounter;
}
