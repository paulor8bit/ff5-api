/* Original synthesized menu cues: no sampled game audio or network requests. */
(function(root){
  const cues={
    move:[[1400,0,.025],[1900,.025,.035]],
    confirm:[[740,0,.045],[1110,.04,.055],[1480,.085,.075]],
    cancel:[[880,0,.05],[440,.045,.085]],
    travel:[[440,0,.065],[660,.06,.065],[880,.12,.12]],
    reward:[[660,0,.07],[880,.075,.07],[1100,.15,.07],[1320,.225,.16]]
  };
  let context=null,enabled=true,lastMove=-Infinity,volume=1;
  try{const saved=localStorage.getItem('ffv-menu-volume');if(saved!==null&&saved!==undefined&&Number.isFinite(Number(saved)))volume=Math.max(0,Math.min(1,Number(saved)));}catch{}
  try{enabled=localStorage.getItem('ffv-menu-audio')!=='off';}catch{}
  function unlock(){
    if(!enabled)return;
    try{const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)return;context ||= new Audio();if(context.state==='suspended')context.resume().catch(()=>{});}catch{}
  }
  function play(kind='move'){
    if(!enabled||volume===0||!context||context.state!=='running')return;
    const now=context.currentTime;
    if(kind==='move'&&now-lastMove<.05)return;
    if(kind==='move')lastMove=now;
    for(const [frequency,delay,duration] of cues[kind]||cues.move){
      const osc=context.createOscillator(),gain=context.createGain(),start=now+delay;
      osc.type='square';osc.frequency.setValueAtTime(frequency,start);
      gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.035*volume,start+.003);
      gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      osc.connect(gain);gain.connect(context.destination);osc.start(start);osc.stop(start+duration+.01);
      osc.onended=()=>{osc.disconnect();gain.disconnect();};
    }
  }
  function sync(){const button=document.querySelector('#sound-toggle');if(button){button.textContent=enabled?'Som: ligado':'Som: desligado';button.setAttribute('aria-pressed',String(enabled));}}
  function toggle(){enabled=!enabled;try{localStorage.setItem('ffv-menu-audio',enabled?'on':'off');}catch{}sync();if(enabled){unlock();play('confirm');}}
  function setVolume(value){if(!Number.isFinite(value))return;volume=Math.max(0,Math.min(1,value));try{localStorage.setItem('ffv-menu-volume',String(volume));}catch{}}
  root.MenuAudio={play,unlock,toggle,setVolume,getVolume:()=>volume,isEnabled:()=>enabled};
  if(typeof document.addEventListener!=='function')return;
  document.addEventListener('pointerdown',unlock,{capture:true});
  document.addEventListener('keydown',unlock,{capture:true});
  document.addEventListener('pointerover',event=>{const b=event.target.closest('button,select');if(b&&!b.disabled&&!b.contains(event.relatedTarget))play('move');});
  document.addEventListener('focusin',event=>{if(event.target.matches('button:not(:disabled),select'))play('move');});
  document.addEventListener('change',event=>{if(event.target.matches('select'))play('confirm');});
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||b.disabled)return;
    if(b.id==='sound-toggle'){toggle();return;}
    play(['close-jobs','close-map'].includes(b.id)?'cancel':b.dataset.node?'travel':b.dataset.reward?'reward':'confirm');
  },{capture:true});
  sync();
})(window);
