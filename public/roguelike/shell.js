/* Menus are outside run state: opening them cannot advance combat. */
let shellMode='title', shellReturn='title', confirmReturn='title', hasSavedRun=false;
let preferences={speed:1,scanlines:true,motion:true};
try{
  hasSavedRun=!!localStorage.getItem('ffv-crystal-run-v1');
  const stored=JSON.parse(localStorage.getItem('ffv-settings-v1'))||{};
  if([.75,1,1.5].includes(stored.speed))preferences.speed=stored.speed;
  for(const key of ['scanlines','motion'])if(typeof stored[key]==='boolean')preferences[key]=stored[key];
}catch{}
function applyPreferences(){
  const el=document.querySelector('.console');
  if(el?.setAttribute){el.setAttribute('data-scanlines',preferences.scanlines?'on':'off');el.setAttribute('data-motion',preferences.motion?'on':'off');}
}
function storePreferences(){try{localStorage.setItem('ffv-settings-v1',JSON.stringify(preferences));}catch{}applyPreferences();}
function shellButton(action,label,disabled=false){return `<button class="menu-option" data-shell="${action}" ${disabled?'disabled':''}>${label}</button>`;}
function openPause(){if(!run||shellMode!=='game')return;save();shellMode='pause';render();}
function shellAction(action){
  if(action==='continue'||action==='resume'){if(!hasSavedRun)return;shellMode='game';lastTime=performance.now();}
  else if(action==='group'){shellMode='game';openGroup();return;}
  else if(action==='new'){
    if(hasSavedRun&&!['won','lost'].includes(run.phase)){confirmReturn=shellMode;shellMode='confirm-new';}
    else{openRunSetup();return;}
  }else if(action==='start-new'){openRunSetup();return;}
  else if(action==='begin-run'){if(shellMode==='setup')newRun(true);return;}
  else if(action==='setup-cancel'){shellMode='title';}
  else if(action==='cancel-new')shellMode=confirmReturn;
  else if(['settings','controls','credits','progression','glossary'].includes(action)){if(action==='progression'&&shellMode==='game')learningCharacter=run.members[run.active].id;shellReturn=shellMode;shellMode=action;}
  else if(action==='back')shellMode=shellReturn;
  else if(action==='title'){save();shellMode='title';groupOpen=false;menuOpen=false;mapPreview=false;}
  else if(action==='audio')window.MenuAudio.toggle();
  else if(action==='scanlines'){preferences.scanlines=!preferences.scanlines;storePreferences();}
  else if(action==='motion'){preferences.motion=!preferences.motion;storePreferences();}
  render();
}
function renderShell(){
  if(shellMode==='glossary'){renderGlossary();return;}
  const title=shellMode==='title';let heading='',body='';
  if(title){
    body=`${shellButton('continue','Continuar jornada',!hasSavedRun)}${hasSavedRun?`<p class="save-summary">Encontro ${run.floor}/12 · ${run.members.length} integrante${run.members.length>1?'s':''} · ${run.gil} gil</p>`:'<p class="save-summary">Uma jornada começa com uma escolha.</p>'}${shellButton('new','Nova jornada')}${shellButton('progression','Aprender jobs / Vagas')}${shellButton('glossary','Glossário')}${shellButton('settings','Configurações')}${shellButton('controls','Como jogar')}${shellButton('credits','Créditos')}`;
  }else if(shellMode==='pause'){
    heading='Jornada pausada';body=`<p class="shell-subtitle">Encontro ${run.floor}/12 · Progresso salvo</p>${shellButton('resume','Retomar')}${shellButton('group','Item / Equipamento')}${shellButton('progression','Aprender jobs / Vagas')}${shellButton('glossary','Glossário')}${shellButton('settings','Configurações')}${shellButton('controls','Como jogar')}${shellButton('new','Nova jornada')}${shellButton('title','Salvar e voltar ao título')}`;
  }else if(shellMode==='progression'){heading='Memória dos Cristais';body=progressionContent();
  }else if(shellMode==='setup'){heading='Preparar nova jornada';body=setupContent();
  }else if(shellMode==='settings'){
    heading='Configurações';body=`<div class="settings-list">${shellButton('audio',`Sons de menu <span>${window.MenuAudio.isEnabled()?'Ligados':'Desligados'}</span>`)}<label class="setting-row" for="effect-volume">Volume dos efeitos <output id="volume-value">${Math.round(window.MenuAudio.getVolume()*100)}%</output><input id="effect-volume" type="range" min="0" max="100" value="${Math.round(window.MenuAudio.getVolume()*100)}"></label><label class="setting-row" for="battle-speed">Velocidade do combate<select id="battle-speed"><option value="0.75" ${preferences.speed===.75?'selected':''}>Tranquila</option><option value="1" ${preferences.speed===1?'selected':''}>Normal</option><option value="1.5" ${preferences.speed===1.5?'selected':''}>Rápida</option></select></label>${shellButton('scanlines',`Filtro de tela CRT <span>${preferences.scanlines?'Ligado':'Desligado'}</span>`)}${shellButton('motion',`Animações da interface <span>${preferences.motion?'Ligadas':'Reduzidas'}</span>`)}</div><p class="shell-subtitle">Preferências salvas automaticamente neste navegador.</p>${shellButton('back','Voltar')}`;
  }else if(shellMode==='controls'){
    heading='Como jogar';body=`<div class="help-copy"><p>Escolha um caminho no mapa. Batalhas dão recompensas; elites são mais difíceis; acampamentos recuperam seu grupo. Lojas permitem comprar, vender e curar. Eventos oferecem escolhas com consequências. Tesouros concedem relíquias passivas para toda a run.</p><p>Aguarde a barra ATB, escolha Ataque, Magia ou Item e depois confirme o alvo. Item abre a mochila; Esc cancela sem gastar o turno. O tempo para enquanto alguém está pronto.</p><p>Compre magias com gil na aba Magias da loja ou escolha pergaminhos nas recompensas. O repertório vale para todo o grupo nesta run; cada personagem usa as escolas de seu job ou comando herdado. Consulte a aba Magias no menu do grupo.</p><p>Guardiões revelam jobs. Gaste Pontos de Job para aprendê-los permanentemente para o personagem escolhido. Eventos recrutam aliados; compre vagas para levá-los desde o início. Troque classes entre encontros; 30 ABP permitem levar um comando para outro job.</p><p>Vença os quatro guardiões para concluir a run. A derrota de todo o grupo encerra a jornada.</p><dl><dt>↑ ↓ / ← →</dt><dd>Navegar pelos menus</dd><dt>Enter</dt><dd>Confirmar</dd><dt>Esc</dt><dd>Pausar ou voltar</dd><dt>M</dt><dd>Consultar mapa</dd><dt>I</dt><dd>Mochila e equipamento</dd><dt>J</dt><dd>Jobs entre encontros</dd></dl><p>O progresso é salvo neste navegador. Fechar a página não encerra sua run.</p></div>${shellButton('back','Voltar')}`;
  }else if(shellMode==='credits'){
    heading='Créditos';body=`<div class="help-copy"><p>Caminho dos Cristais</p><p>Projeto de fã inspirado em Final Fantasy V e na progressão de roguelikes por rotas.</p><p>Final Fantasy V, personagens e sprites: Square Enix. Dados e recursos da base FF5 API.</p><p>Referência visual dos menus: cafeTechne / Final-Fantasy-CSS. Fonte VT323: Peter Hull, licença SIL OFL.</p><p>Efeitos de menu sintetizados para este projeto.</p></div>${shellButton('back','Voltar')}`;
  }else{
    heading='Começar outra jornada?';body=`<p class="help-copy">A run salva no encontro ${run.floor} será substituída. Itens, gil e ABP dessa jornada serão reiniciados. Jobs aprendidos, PJ, aliados registrados e vagas iniciais permanecem.</p>${shellButton('cancel-new','Manter minha jornada')}${shellButton('start-new','Começar nova jornada')}`;
  }
  app.innerHTML=`<div class="shell-screen ${title?'title-screen':''}"><div class="title-stars" aria-hidden="true"></div>${title?`<div class="title-brand"><svg class="title-crystal" viewBox="0 0 60 90" aria-hidden="true"><path fill="#64bbdf" d="m30 0 27 28-10 42-17 20L13 70 3 28Z"/><path fill="#ddfaff" d="M30 0 3 28l27 13Z"/><path fill="#2c6ba3" d="m30 41 27-13-10 42-17 20Z"/><path fill="#8edef1" d="M30 0v41l27-13Z"/></svg><p>UMA JORNADA · QUATRO CRISTAIS</p><h1>Caminho dos<br><strong>Cristais</strong></h1></div>`:''}<section class="ff-window shell-window"><div class="ff-window-content">${heading?`<h1 class="shell-heading">${heading}</h1>`:''}<div class="shell-options">${body}</div></div></section>${title?'<p class="title-footnote">↑ ↓ Escolher · Enter Confirmar</p>':''}</div>`;
  app.querySelectorAll('[data-shell]').forEach(b=>b.onclick=()=>shellAction(b.dataset.shell));
  const volume=document.querySelector('#effect-volume');if(volume){volume.oninput=e=>{window.MenuAudio.setVolume(Number(e.target.value)/100);const output=document.querySelector('#volume-value');if(output)output.textContent=e.target.value+'%';};volume.onchange=()=>window.MenuAudio.play('confirm');}
  const speed=document.querySelector('#battle-speed');if(speed)speed.onchange=e=>{preferences.speed=Number(e.target.value);storePreferences();};
  bindProgression();applyPreferences();
}
