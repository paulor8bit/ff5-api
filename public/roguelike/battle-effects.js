// Presentation only: effects never change HP, resources or the saved run.
let battleEffects=[];
function currentBattleEffect(){return battleEffects[0]||null;}
function clearBattleEffects(){battleEffects=[];}
function queueBattleEffect(effect){battleEffects.push({...effect,elapsed:0,duration:preferences.motion?1.05:.7});}
function advanceBattleEffects(seconds){
  const effect=currentBattleEffect();if(!effect)return false;
  effect.elapsed+=Math.max(0,seconds);
  if(effect.elapsed>=effect.duration){battleEffects.shift();return true;}
  return false;
}
function battleSnapshot(){return {ally:run.members.map(m=>({hp:m.hp,mp:m.mp})),enemy:run.enemies.map(m=>({hp:m.hp,mp:0}))};}
function showPlayerEffect(action,index,before){
  const item=catalog[itemActionId(action)],command=commandFor(action);
  const kind=action==='guard'?'guard':item?item.rule.kind==='damage'?'item-hit':'heal':['heal','revive'].includes(command?.kind)?'heal':command?.kind==='protect'?'guard':command?.kind==='haste'?'haste':command?.kind==='steal'?'steal':command?.cost>0?'magic':'attack';
  const side=action==='guard'?'ally':commandSide(action),all=item?.rule.all||command?.kind==='all';
  const source=run.members[run.active],targets=[];
  const selected=action==='guard'?run.active:index;
  const list=side==='ally'?run.members:run.enemies;
  list.forEach((member,i)=>{
    const old=before[side][i];if(!old)return;
    if(all?old.hp>0:i===selected){const hp=member.hp-old.hp,mp=Math.max(0,(member.mp||0)-old.mp);
      const label=hp?`${hp>0?'+':''}${Math.abs(hp)}`:mp?`+${mp} MP`:kind==='guard'?'DEFESA':kind==='haste'?'ACELERAR':kind==='steal'?'ROUBAR':'0';
      targets.push({side,index:i,hp,mp,label});
    }
  });
  queueBattleEffect({source:{side:'ally',index:run.active},name:source.name,command:action==='attack'?'Ataque':action==='guard'?'Defender':item?nameOf(item.name):command.command,kind,targets});
}
function effectClasses(side,index){
  const effect=currentBattleEffect();if(!effect)return '';
  return `${effect.source.side===side&&effect.source.index===index?'effect-source':''} ${effect.targets.some(t=>t.side===side&&t.index===index)?'effect-target':''} effect-${effect.kind}`;
}
function effectOverlay(side,index){
  const effect=currentBattleEffect(),target=effect?.targets.find(t=>t.side===side&&t.index===index);
  if(!target)return '';
  return `<span class="impact-vfx" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="combat-number ${target.hp>0||target.mp>0?'restored':''}" aria-label="${escapeHtml(target.label)}">${escapeHtml(target.label)}</span>`;
}
function effectActorPose(index,fallback){
  const effect=currentBattleEffect();if(effect?.source.side==='ally'&&effect.source.index===index)return ['attack','steal'].includes(effect.kind)?'attack':effect.kind==='guard'?'idle':'cast';
  return fallback;
}
function effectMessage(){const effect=currentBattleEffect();return effect?`${effect.name} → ${effect.command}`:null;}
