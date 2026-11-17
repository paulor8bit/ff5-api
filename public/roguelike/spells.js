// Spell scrolls belong to the run; jobs and inherited commands determine who can cast.
const magicSchools={white:'Magia Branca',black:'Magia Negra',time:'Magia do Tempo',summon:'Invocação'};
const spellRules={
  spell_w001:{kind:'heal',amount:75,tier:1},spell_w002:{kind:'heal',amount:150,tier:2},spell_w003:{kind:'heal',amount:300,tier:3},
  spell_w005:{kind:'revive',fraction:.35,tier:2},spell_w006:{kind:'revive',fraction:1,tier:3},spell_w007:{kind:'protect',tier:1},
  spell_b001:{kind:'magic',power:2.1,tier:1},spell_b002:{kind:'magic',power:2.8,tier:2},spell_b003:{kind:'magic',power:3.7,tier:3},
  spell_b004:{kind:'magic',power:2.1,tier:1},spell_b005:{kind:'magic',power:2.8,tier:2},spell_b006:{kind:'magic',power:3.7,tier:3},
  spell_b007:{kind:'magic',power:2.1,tier:1},spell_b008:{kind:'magic',power:2.8,tier:2},spell_b009:{kind:'magic',power:3.7,tier:3},
  spell_t001:{kind:'haste',tier:1},spell_t003:{kind:'slow',tier:1},spell_t010:{kind:'magic',power:3,tier:2},
  spell_s015:{kind:'all',power:1.7,tier:1},spell_s001:{kind:'all',power:2.8,tier:2},spell_s002:{kind:'all',power:2.8,tier:2},spell_s003:{kind:'all',power:2.8,tier:2}
};
let spellCatalog={};
function buildSpellCatalog(){
  for(const [school,key] of Object.entries({white:'white_magic',black:'black_magic',time:'time_magic',summon:'summon_magic'}))
    for(const spell of data.magic[key].spells)if(spellRules[spell.id])spellCatalog[spell.id]={...spell,...spellRules[spell.id],school,command:nameOf(spell.name),cost:spell.mp_cost,price:[0,35,75,120][spellRules[spell.id].tier]};
}
const starterSpells={job_005:'spell_w001',job_006:'spell_b001',job_008:'spell_w001',job_009:'spell_t001',job_010:'spell_s015'};
function starterJobDescription(job){const spell=spellCatalog[starterSpells[job]];return spell?spell.command:E.jobs[job]?.command||'—';}
function ensureSpells(state){
  if(!Array.isArray(state.spells))state.spells=[];
  for(const member of state.members)for(const job of [member.job,member.secondary]){
    const id=starterSpells[job];if(id&&!state.spells.includes(id))state.spells.push(id);
  }
}
function learnRunSpell(id){if(!spellCatalog[id]||run.spells.includes(id))return false;run.spells.push(id);return true;}
function spellSchools(job){return {job_005:['white'],job_006:['black'],job_008:['white','black'],job_009:['time'],job_010:['summon']}[job]||[];}
function jobCanCast(job,spell){return spellSchools(job).includes(spell.school)&&(job!=='job_008'||spell.tier<=2);}
function canCastSpell(member,id){const spell=spellCatalog[id];return !!spell&&run.spells.includes(id)&&(jobCanCast(member.job,spell)||(member.mastered.includes(member.secondary)&&jobCanCast(member.secondary,spell)));}
function availableSpells(member){return run.spells.map(id=>spellCatalog[id]).filter(spell=>spell&&canCastSpell(member,spell.id));}
function spellTargetAllowed(action,member){const spell=commandFor(action);return spell?.kind==='revive'?member.hp<=0:member.hp>0;}
function spellOffers(){const tier=Math.min(3,1+Math.floor(run.floor/4));return Object.values(spellCatalog).filter(s=>s.tier<=tier&&!run.spells.includes(s.id));}
function spellDescription(spell){return `${magicSchools[spell.school]} · ${spell.cost} MP · ${spell.kind==='heal'?'Recupera '+spell.amount+' HP + bônus mágico':spell.kind==='revive'?'Revive com '+Math.round(spell.fraction*100)+'% HP':spell.kind==='protect'?'+10 defesa nesta batalha':spell.kind==='haste'?'Aumenta velocidade ATB':spell.kind==='slow'?'Reduz velocidade ATB do inimigo':spell.kind==='all'?'Dano em todos os inimigos':'Dano mágico em um inimigo'}`;}
function runSpellsContent(member){return `<h2>Magias da jornada</h2><p class="dialog-note">Cada job concede sua magia inicial gratuitamente. Outras são obtidas em pergaminhos e lojas. Aprendidas para todo o grupo; cada personagem usa seu job ou comando herdado compatível. Reiniciam na próxima run.</p>${run.spells.map(id=>spellCatalog[id]).filter(Boolean).map(s=>`<p class="stored-gear"><span>${escapeHtml(s.command)}<small>${escapeHtml(spellDescription(s))}</small></span><span>${canCastSpell(member,s.id)?'Pode usar':'Job incompatível'}</span></p>`).join('')||'<p class="dialog-note">Nenhuma magia aprendida. Encontre pergaminhos nas recompensas ou compre na loja.</p>'}`;}
