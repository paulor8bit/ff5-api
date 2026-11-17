/* Small, pure combat model. Prototype balance; not FFV's original formulas. */
(function (root) {
  const jobs = {
    job_001: { command: 'Golpe concentrado', kind: 'damage', power: 1.4, cost: 0 },
    job_002: { command: 'Golpe de espada', kind: 'damage', power: 1.9, cost: 0 },
    job_003: { command: 'Chute', kind: 'all', power: 1.3, cost: 0 },
    job_004: { command: 'Roubar', kind: 'steal', cost: 0 },
    job_005: { command: 'Magia Branca', kind: 'heal', cost: 4 },
    job_006: { command: 'Magia Negra', kind: 'magic', power: 2.1, cost: 4 },
    job_008: { command: 'Magia Vermelha', kind: 'heal', cost: 4 },
    job_009: { command: 'Magia do Tempo', kind: 'haste', cost: 5 },
    job_010: { command: 'Invocação', kind: 'all', power: 2.1, cost: 8 },
    job_013: { command: 'Ataque duplo', kind: 'damage', power: 2.2, cost: 0 },
    job_018: { command: 'Salto', kind: 'damage', power: 2.4, cost: 0 },
    job_020: { command: 'Zeninage', kind: 'all', power: 2.5, cost: 0, gil: 30 }
  };
  const pools = [['job_002','job_003','job_004','job_005','job_006'],['job_008','job_009','job_010'],['job_013','job_018'],['job_020']];
  function createMap(random=Math.random){
    const nodes=[];
    for(let floor=1;floor<=12;floor++){
      const boss=floor%3===0;
      const types=floor===1?['normal','normal','elite']:floor===2?['normal','recruit','rest']:floor===4?['normal','shop','treasure']:floor===10?['recruit','shop','event']:floor===7?['normal','shop','event']:floor===8?['elite','treasure','rest']:floor===5?['elite','recruit','rest']:['elite','event','rest'];
      // Shuffle encounter placement while keeping safe and risky routes available.
      for(let i=types.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[types[i],types[j]]=[types[j],types[i]];}
      for(const lane of boss?[1]:[0,1,2])nodes.push({id:`f${floor}-${lane}`,floor,lane,type:boss?'boss':types[lane],x:boss?50:19+lane*31+(random()-.5)*7,next:[]});
    }
    for(const n of nodes){
      const next=nodes.filter(m=>m.floor===n.floor+1);
      n.next=next.filter(m=>n.type==='boss'||m.type==='boss'||m.lane===n.lane).map(m=>m.id);
      if(n.type!=='boss'&&next.length>1){const adjacent=next.filter(m=>Math.abs(m.lane-n.lane)===1);if(adjacent.length)n.next.push(adjacent[Math.floor(random()*adjacent.length)].id);}
    }
    return {version:3,nodes,path:[],current:null};
  }
  function ensureMap(run){
    if(run.route?.nodes){
      if(run.route.version!==3){const fresh=createMap();for(const node of run.route.nodes)if(node.floor>run.floor&&node.type!=='boss')node.type=fresh.nodes.find(n=>n.id===node.id)?.type||node.type;run.route.version=3;}
      return;
    }
    run.route=createMap();
    // Migrate old saves along a valid path without resetting the ongoing encounter.
    for(let floor=1;floor<=run.floor;floor++){
      const previous=run.route.nodes.find(n=>n.id===run.route.current);
      const choices=run.route.nodes.filter(n=>n.floor===floor&&(!previous||previous.next.includes(n.id)));
      const selected=choices.find(n=>floor===run.floor&&n.type===run.encounter)||choices[0];
      if(selected){if(floor===run.floor&&run.encounter)selected.type=run.encounter;run.route.path.push(selected.id);run.route.current=selected.id;}
    }
  }
  function availableNodes(run){
    if(run.phase!=='map')return [];
    ensureMap(run);
    const previous=run.route.nodes.find(n=>n.id===run.route.current);
    return run.route.nodes.filter(n=>n.floor===run.floor+1&&(!previous||previous.next.includes(n.id)));
  }
  function chooseNode(run,id){
    const node=availableNodes(run).find(n=>n.id===id);if(!node)return null;
    run.route.path.push(id);run.route.current=id;return node;
  }
  function createRun() { return { floor: 0, phase: 'map', hp: 240, maxHp: 240, mp: 30, maxMp: 30, attack: 28, gil: 0, potions: 3, job: 'job_001', unlocked: [], abp: {}, mastered: [], secondary: null, enemies: [], atb: 0, guard: false, haste: false, log: ['A jornada começa como Aventureiro.'], rewards: [] }; }
  function damage(attack, defense, power = 1, random = Math.random) { return Math.max(1, Math.round(attack * power * (.9 + random() * .2) - defense)); }
  function jobChoices(run, random = Math.random) { const tier = Math.min(3, Math.floor((run.floor - 1) / 3)); const candidates = pools.slice(0, tier + 1).flat().filter(id => !run.unlocked.includes(id)&&!(run.discovered||[]).includes(id)); for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];} return candidates.slice(0,3); }
  function victory(run) { run.gil += 25 + run.floor * 5; run.attack += 3; run.maxHp += 12; run.hp = Math.min(run.maxHp,run.hp + 20); run.mp = Math.min(run.maxMp,run.mp + 3); if(run.job !== 'job_001'){run.abp[run.job]=(run.abp[run.job]||0)+10;if(run.abp[run.job]>=30&&!run.mastered.includes(run.job))run.mastered.push(run.job);} run.phase = run.floor >= 12 ? 'won' : 'reward'; }
  const api = { jobs, pools, createRun, damage, jobChoices, victory, createMap, ensureMap, availableNodes, chooseNode };
  if(typeof module !== 'undefined') module.exports = api;
  root.CrystalEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
