let glossaryCategory='systems',glossarySearch='',glossarySelected=null;
const glossaryCategories={systems:'Sistemas',jobs:'Jobs',characters:'Personagens',magic:'Magias',abilities:'Habilidades',equipment:'Equipamentos',items:'Itens',monsters:'Monstros',relics:'Relíquias'};
function glossaryEntries(category){
  if(category==='systems')return [
    {id:'jp',name:'Pontos de Job e descoberta',description:'Batalha: 5 PJ. Elite: 8 PJ. Guardião: 15 PJ. Descobrir um job não o aprende. Compre o treinamento no menu Aprender jobs / Vagas; cada personagem precisa aprender por conta própria. O aprendizado desse personagem permanece entre runs.'},
    {id:'starter',name:'Aventureiro e equipamentos',description:'Aventureiro usa somente peças básicas: até 22 de ataque, 4 de defesa, 1 de bônus mágico e preço de até 500 gil. Acessórios avançados ficam restritos aos outros jobs. Os demais jobs seguem suas categorias de equipamento.'},
    {id:'party',name:'Recrutamento e grupo inicial',description:'Encontros de aliado recrutam personagens até o limite de quatro. O personagem recrutado fica registrado para outras jornadas. As vagas iniciais 2, 3 e 4 custam 80, 140 e 220 PJ. Escolha o grupo e os jobs aprendidos antes de começar.'},
    {id:'abp',name:'ABP e comandos',description:'Vitórias concedem 10 ABP ao job equipado. Com 30 ABP, aquele personagem pode levar o comando para outro job durante a run. ABP e comandos da run são separados dos jobs aprendidos permanentemente.'},
    {id:'spells',name:'Magias compartilhadas da run',description:'Cada job começa com uma magia ou habilidade: Branco e Vermelho com Cura, Negro com Fogo, Tempo com Haste e Invocador com Chocobo. Os demais começam com seu comando próprio. Compre outras magias em pergaminhos com gil na aba Magias das lojas ou escolha magias nas recompensas. Cada compra ensina ao grupo todo nesta run, inclusive aliados recrutados depois. Magos usam suas escolas; Mago Vermelho usa Branca e Negra de nível básico/intermediário. Comandos herdados via ABP permitem usar a escola em outro job. As magias reiniciam na próxima run.'},
    {id:'atb',name:'Batalha ATB',description:'Escolha o comando, a magia ou o item, depois o alvo. A ação passa automaticamente ao próximo personagem pronto. O tempo aguarda enquanto alguém está pronto ou uma animação é exibida.'},
    {id:'route',name:'Mapa e encontros',description:'Doze etapas com rotas conectadas. Batalhas, elites, descanso, eventos, aliados, lojas e tesouros. Guardiões nas etapas 3, 6, 9 e 12. Relíquias afetam todo o grupo até o fim da run.'}
  ];
  if(category==='relics')return Object.entries(relicCatalog).map(([id,r])=>({id,...r}));
  const entries=[],seen=new Set();
  function collect(value){if(Array.isArray(value)){value.forEach(collect);return;}if(!value||typeof value!=='object')return;if(value.id&&value.name){if(!seen.has(value.id)){seen.add(value.id);entries.push(value);}return;}for(const [key,item] of Object.entries(value))if(key!=='metadata')collect(item);}
  collect(data[category]);return entries;
}
function glossaryValue(value){
  if(value===null||value===undefined)return '—';
  if(typeof value!=='object')return escapeHtml(value);
  if(value['pt-BR'])return escapeHtml(value['pt-BR']);
  if(Array.isArray(value))return value.map(glossaryValue).join(' · ');
  return Object.entries(value).filter(([key])=>key!=='en').map(([key,v])=>`${escapeHtml(key)}: ${glossaryValue(v)}`).join('<br>');
}
function renderGlossary(){
  const fold=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const all=glossaryEntries(glossaryCategory),entries=all.filter(item=>fold(nameOf(item.name)+' '+nameOf(item.description||item.effect||'')).includes(fold(glossarySearch)));
  const selected=entries.find(item=>item.id===glossarySelected)||entries[0];glossarySelected=selected?.id||null;
  const labels={description:'Descrição',effect:'Efeito',attack:'Ataque',defense:'Defesa',mp_cost:'Custo MP',base_stats:'Atributos do job',price:'Preço da base',jobs:'Jobs da base',hp:'HP da base',mp:'MP',gil:'Gil',level:'Nível',weakness:'Fraqueza',location:'Localização',abp_cost:'Custo ABP',equipment:'Equipamentos',innate_abilities:'Habilidades nativas',learnable_abilities:'Habilidades aprendidas'};
  const detail=selected?`<h2>${escapeHtml(nameOf(selected.name))}</h2>${glossaryCategory==='jobs'?`<p class="meta-wallet">${profile.roster.some(id=>learnedJobsFor(id).includes(selected.id))?'Aprendido por: '+profile.roster.filter(id=>learnedJobsFor(id).includes(selected.id)).map(id=>escapeHtml(GameConfig.characters.find(c=>c.id===id)?.name||id)).join(', '):profile.discoveredJobs.includes(selected.id)?'Descoberto · '+jobCost(selected.id)+' PJ para aprender':E.jobs[selected.id]?'Não descoberto':'Registro da base'}</p>`:''}${catalog[selected.id]?.type==='gear'?`<p class="equipment-stats">${gearDescription(catalog[selected.id])}</p><p class="dialog-note">${basicGear(catalog[selected.id])?'Equipamento básico; Aventureiro pode equipar.':'Aventureiro não pode equipar esta peça.'}</p>`:''}<dl class="glossary-details">${Object.entries(selected).filter(([key])=>!['id','name','image_id'].includes(key)&&!key.endsWith('_en')&&!key.endsWith('_jp')).map(([key,value])=>`<dt>${escapeHtml(labels[key]||key)}</dt><dd>${glossaryValue(value)}</dd>`).join('')}</dl>`:'<p>Nenhum registro encontrado.</p>';
  app.innerHTML=`<div class="glossary-screen"><div class="glossary-heading"><h1>Glossário dos Cristais</h1><button class="menu-option" data-shell="back">Voltar</button></div><nav class="glossary-tabs">${Object.entries(glossaryCategories).map(([id,label])=>`<button data-glossary-category="${id}" class="menu-option ${id===glossaryCategory?'selected':''}">${label}</button>`).join('')}</nav><label class="glossary-search">Buscar<input id="glossary-search" value="${escapeHtml(glossarySearch)}" placeholder="Nome ou descrição"><span>${entries.length} / ${all.length}</span></label><p class="glossary-note">Sistemas descreve as regras desta run. Os demais registros incluem a base FF5 completa; valores e efeitos originais podem diferir da adaptação.</p><div class="glossary-columns">${windowPanel('glossary-list',entries.map(item=>`<button data-glossary-entry="${escapeHtml(item.id)}" class="menu-option ${item.id===glossarySelected?'selected':''}">${escapeHtml(nameOf(item.name))}</button>`).join(''))}${windowPanel('glossary-detail',detail)}</div></div>`;
  app.querySelectorAll('[data-glossary-category]').forEach(b=>b.onclick=()=>{glossaryCategory=b.dataset.glossaryCategory;glossarySearch='';glossarySelected=null;render();});
  app.querySelectorAll('[data-glossary-entry]').forEach(b=>b.onclick=()=>{glossarySelected=b.dataset.glossaryEntry;render();});
  app.querySelectorAll('[data-shell]').forEach(b=>b.onclick=()=>shellAction(b.dataset.shell));
  const search=app.querySelector('#glossary-search');if(search)search.oninput=()=>{glossarySearch=search.value;render();const input=app.querySelector('#glossary-search');input?.focus();input?.setSelectionRange(glossarySearch.length,glossarySearch.length);};
  applyPreferences();
}
