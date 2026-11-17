const profileKey='ffv-profile-v1';
let profile={version:1,points:0,discoveredJobs:[],learnedJobs:['job_001'],roster:['hero-1'],startingSlots:1,claims:[],migrated:false};
try{const saved=JSON.parse(localStorage.getItem(profileKey));if(saved&&saved.version===1)profile={...profile,...saved};}catch{}
function saveProfile(){try{localStorage.setItem(profileKey,JSON.stringify(profile));}catch{}}
function jobCost(id){const tier=E.pools.findIndex(pool=>pool.includes(id));return [20,35,50,70][Math.max(0,tier)];}
function slotCost(){return [0,80,140,220][profile.startingSlots]||0;}
let learningCharacter='hero-1';
function learnedJobsFor(characterId){return ['job_001',...(profile.learnedByCharacter?.[characterId]||[]).filter(id=>id!=='job_001'&&E.jobs[id])];}
function syncProfile(state){state.unlocked=[...new Set(Object.values(profile.learnedByCharacter||{}).flat())].filter(id=>id!=='job_001');state.discovered=[...profile.discoveredJobs];}
function migrateProfile(state,hasSave){
  if(!profile.migrated&&hasSave){
    const used=state.members.map(m=>m.job).filter(id=>E.jobs[id]);
    profile.discoveredJobs=[...new Set([...profile.discoveredJobs,...(state.unlocked||[]),...used].filter(id=>id!=='job_001'))];

    profile.roster=[...new Set([...profile.roster,...state.members.map(m=>m.id)])];
    profile.points+=Math.max(0,state.floor-(['battle','event','shop','treasure','recruit'].includes(state.phase)?1:0))*5;
  }
  if(!profile.learnedByCharacter){
    profile.learnedByCharacter={'hero-1':(profile.learnedJobs||[]).filter(id=>id!=='job_001'&&E.jobs[id])};
    // Preserve the owner of each job currently equipped in an older save.
    if(hasSave)for(const member of state.members)if(member.job!=='job_001'&&E.jobs[member.job]){
      const jobs=profile.learnedByCharacter[member.id]||=[];if(!jobs.includes(member.job))jobs.push(member.job);
    }
    delete profile.learnedJobs;
  }
  profile.migrated=true;syncProfile(state);saveProfile();
}
function discoverJob(id){if(!E.jobs[id]||id==='job_001')return false;if(!profile.discoveredJobs.includes(id))profile.discoveredJobs.push(id);syncProfile(run);saveProfile();return true;}
function learnJob(id,characterId=learningCharacter){
  if(!profile.roster.includes(characterId)||!E.jobs[id]||!profile.discoveredJobs.includes(id)||learnedJobsFor(characterId).includes(id)||profile.points<jobCost(id))return false;
  profile.points-=jobCost(id);(profile.learnedByCharacter[characterId]||=[]).push(id);syncProfile(run);saveProfile();if(hasSavedRun)save();render();return true;
}
function unlockStartingSlot(){
  if(profile.startingSlots>=4||profile.points<slotCost())return false;
  profile.points-=slotCost();profile.startingSlots++;saveProfile();render();return true;
}
function awardJobPoints(){
  const claim=run.runId+':'+run.floor;if(profile.claims.includes(claim))return 0;
  const points=run.encounter==='boss'?15:run.encounter==='elite'?8:5;
  profile.claims.push(claim);profile.points+=points;run.lastJobPoints=points;saveProfile();return points;
}
let startParty=['hero-1'],startJobs={};
function openRunSetup(){startParty=['hero-1'];startJobs={'hero-1':'job_001'};shellMode='setup';render();}
function startingPartyValid(){return startParty.length>=1&&startParty.length<=profile.startingSlots&&new Set(startParty).size===startParty.length&&startParty.every(id=>profile.roster.includes(id)&&learnedJobsFor(id).includes(startJobs[id]||'job_001'));}
function toggleStartingMember(id){
  if(id==='hero-1'||!profile.roster.includes(id))return;
  if(startParty.includes(id))startParty=startParty.filter(value=>value!==id);
  else if(startParty.length<profile.startingSlots){startParty.push(id);startJobs[id]||='job_001';}
  render();
}
function progressionContent(){
  return `<p class="meta-wallet">${profile.points} Pontos de Job · ${profile.startingSlots}/4 vagas iniciais</p><p class="dialog-note">Descobrir um job revela seu treinamento. Aprender custa PJ para cada personagem e vale para suas próximas jornadas. ABP aprende comandos durante a run.</p><label class="training-character">Personagem<select id="learning-character">${profile.roster.map(id=>`<option value="${id}" ${id===learningCharacter?'selected':''}>${escapeHtml(GameConfig.characters.find(c=>c.id===id)?.name||id)}</option>`).join('')}</select></label><h2>Jobs descobertos</h2><div class="meta-list">${profile.discoveredJobs.map(id=>`<button class="menu-option" data-learn-job="${id}" ${learnedJobsFor(learningCharacter).includes(id)||profile.points<jobCost(id)?'disabled':''}><span>${escapeHtml(jobOf(id).name)}<small>Inicial: ${escapeHtml(starterJobDescription(id))}</small></span><b>${learnedJobsFor(learningCharacter).includes(id)?'Aprendido':jobCost(id)+' PJ'}</b></button>`).join('')||'<p class="dialog-note">Vença guardiões e descubra jobs nos cristais.</p>'}</div><h2>Grupo inicial</h2><p class="dialog-note">Aliados recrutados entram no seu registro permanente. Vagas compradas permitem levá-los desde o início.</p><p>${profile.roster.map(id=>escapeHtml(GameConfig.characters.find(c=>c.id===id)?.name||id)).join(' · ')}</p><button class="menu-option" id="unlock-slot" ${profile.startingSlots>=4||profile.points<slotCost()?'disabled':''}>${profile.startingSlots>=4?'Todas as vagas desbloqueadas':`Desbloquear vaga ${profile.startingSlots+1} · ${slotCost()} PJ`}</button>${shellButton('back','Voltar')}`;
}
function setupContent(){
  return `<p class="meta-wallet">Escolha até ${profile.startingSlots} integrante${profile.startingSlots>1?'s':''} · Cada integrante escolhe entre os jobs que aprendeu</p><div class="setup-members">${profile.roster.map(id=>{const actor=GameConfig.characters.find(c=>c.id===id);return `<div class="setup-member"><button data-start-member="${id}" class="menu-option ${startParty.includes(id)?'selected':''}" ${id==='hero-1'?'disabled':''}>${escapeHtml(actor.name)} <small>${id==='hero-1'?'Líder':startParty.includes(id)?'No grupo inicial':'Adicionar ao grupo'}</small></button>${startParty.includes(id)?`<label>Job inicial<select data-start-job="${id}">${learnedJobsFor(id).map(job=>`<option value="${job}" ${(startJobs[id]||'job_001')===job?'selected':''}>${escapeHtml(jobOf(job).name)}</option>`).join('')}</select></label><p class="dialog-note">Inicial: ${escapeHtml(starterJobDescription(startJobs[id]||'job_001'))}</p>`:''}</div>`;}).join('')}</div><p class="dialog-note">Aventureiro usa somente equipamento básico. Outros jobs seguem suas categorias. Itens, gil e equipamentos reiniciam a cada jornada; jobs aprendidos, PJ e vagas permanecem.</p>${shellButton('begin-run','Começar jornada',!startingPartyValid())}${shellButton('progression','Aprender jobs / Vagas')}${shellButton('setup-cancel','Voltar ao título')}`;
}
function bindProgression(){
  app.querySelectorAll('[data-learn-job]').forEach(b=>b.onclick=()=>learnJob(b.dataset.learnJob));
  app.querySelectorAll('[data-start-member]').forEach(b=>b.onclick=()=>toggleStartingMember(b.dataset.startMember));
  app.querySelectorAll('[data-start-job]').forEach(b=>b.onchange=()=>{if(learnedJobsFor(b.dataset.startJob).includes(b.value))startJobs[b.dataset.startJob]=b.value;render();});
  const character=app.querySelector('#learning-character');if(character)character.onchange=()=>{learningCharacter=character.value;render();};
  const slot=app.querySelector('#unlock-slot');if(slot)slot.onclick=unlockStartingSlot;
}
