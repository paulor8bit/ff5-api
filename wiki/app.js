/* Final Fantasy V - Wiki (app.js)
   A wiki é estática e lê os arquivos JSON brutos (json/*.json)
   + imagens direto do disco (images/*) — sem depender da API.
*/

const API = {
  /* lê um arquivo JSON bruto da pasta json/ (servida em /data) */
  async get(file) {
    const res = await fetch('/data/' + file);
    if (!res.ok) throw new Error(`${res.status} ${file}`);
    return res.json();
  },
};

/* Resolve image_id -> URL de imagem via /data/image_map.json */
const IMG = {
  _map: null,
  async init() {
    if (this._map) return this._map;
    const d = await API.get('image_map.json');
    this._map = d.map || {};
    return this._map;
  },
  async url(id) {
    if (!id) return null;
    const map = await this.init();
    return this.urlSync(id);
  },
  /* resolvedor síncrono: chame IMG.init() antes (ou use em datasource já carregado) */
  urlSync(id) {
    if (!id || !this._map) return null;
    const p = this._map[id];
    return p ? '/img/' + p : null;
  },
};
/* URL direta do sprite de um monstro (independente do mapa) */
const imURL = (m) => {
  const id = (m && m.image_id) || (m && m.id) || '';
  return '/img/monsters/' + id + '.gif';
};

const $ = (sel) => document.querySelector(sel);
const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));

/* ---- shared layout helpers ---- */

function renderNav(active) {
  const links = [
    ['index.html', '🏰', 'Início'],
    ['bestiary.html', '👹', 'Bestiário'],
    ['jobs.html', '⚔️', 'Jobs'],
    ['magic.html', '✨', 'Magias'],
    ['equipment.html', '🛡️', 'Equipamentos'],
    ['items.html', '🎒', 'Itens'],
    ['abilities.html', '💪', 'Habilidades'],
    ['characters.html', '🧙', 'Personagens'],
    ['images.html', '🖼️', 'Imagens'],
  ];
  const html = `
    <div class="wiki-logo"><span class="crystal">◆</span>FFV Wiki<small>· enciclopédia da API</small></div>
    <nav class="wiki-nav-links">
      ${links.map(([href, ic, label]) =>
        `<a href="${href}" class="${href === active ? 'active' : ''}">${ic} ${label}</a>`).join('')}
      <a href="/" target="_blank" title="Documentação da API">📡 API</a>
    </nav>`;
  $('#wiki-nav').innerHTML = html;
}

const badgeFor = (cat) => {
  if (cat.startsWith('world_one')) return ['Um', 'one'];
  if (cat.startsWith('world_two')) return ['Dois', 'two'];
  if (cat.startsWith('world_three')) return ['Três', 'three'];
  if (cat === 'bosses' || cat.startsWith('boss')) return ['Chefe', 'boss'];
  if (cat === 'summons' || cat === 'summon') return ['Inv', 'summon'];
  if (cat === 'special') return ['Esp', 'special'];
  return cat;
};

/* monster entry -> category slug */
function monsterCategorySlug(m, worldHint) {
  const id = m.id || '';
  if (id.startsWith('boss_')) return 'boss';
  if (id.startsWith('summon_')) return 'summon';
  if (id.startsWith('special_')) return 'special';
  if (worldHint === 1) return 'world_one';
  if (worldHint === 2) return 'world_two';
  if (worldHint === 3) return 'world_three';
  return 'regular';
}

/* ---- load all monsters (regulars + bosses + summons + specials) ---- */
let allMonstersCache = null;
async function loadAllMonsters() {
  if (allMonstersCache) return allMonstersCache;
  const d = await API.get('monsters.json');
  const list = [];
  const push = (m, cat, world) => list.push({ ...m, _cat: cat, _world: world });
  (d.world_one_enemies || []).forEach((m) => push(m, 'world_one', 1));
  (d.world_two_enemies || []).forEach((m) => push(m, 'world_two', 2));
  (d.world_three_enemies || []).forEach((m) => push(m, 'world_three', 3));
  const boss = d.bosses || {};
  ['world_one_bosses', 'world_two_bosses', 'world_three_bosses', 'optional_bosses'].forEach((k) => {
    const arr = boss[k] || [];
    const world = k.includes('one') ? 1 : k.includes('two') ? 2 : k.includes('three') || k.includes('optional') ? 3 : null;
    arr.forEach((m) => push(m, 'boss', world));
  });
  (d.special_monsters && d.special_monsters.items || []).forEach((m) => push(m, 'special', null));
  (d.summons || []).forEach((m) => push(m, 'summon', null));
  allMonstersCache = list;
  return list;
}

function nameOf(m) {
  if (!m) return '';
  if (typeof m.name === 'string') return m.name;
  return (m.name && m.name.en) || '';
}

function weaknessOf(m) {
  if (!m) return '—';
  if (typeof m.weakness === 'string') return m.weakness;
  if (m.weakness && typeof m.weakness.en === 'string') return m.weakness.en;
  return m.weakness ? JSON.stringify(m.weakness) : '—';
}

function locationOf(m) {
  if (!m || !m.location) return null;
  return typeof m.location === 'string' ? m.location : m.location.en;
}

function elementSlug(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('fire')) return '🔥';
  if (n.includes('ice') || n.includes('frost')) return '❄️';
  if (n.includes('light') || n.includes('thunder')) return '⚡';
  if (n.includes('water') || n.includes('aqua')) return '💧';
  if (n.includes('holy')) return '✨';
  if (n.includes('poison')) return '☠️';
  if (n.includes('wind') || n.includes('air')) return '🌪️';
  if (n.includes('earth')) return '🪨';
  if (n.includes('none')) return '—';
  return '';
}

function showSpinner(el, msg) {
  if (!el) return;
  el.innerHTML = '<div class="loading"><span class="spinner"></span>' + esc(msg || 'Carregando...') + '</div>';
}

function showError(el, err) {
  if (!el) return;
  el.innerHTML = '<div class="error">❌ ' + esc((err && err.message) || 'Erro ao carregar dados') + '</div>';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => renderNav(document.body.dataset.page));
} else {
  renderNav(document.body.dataset.page);
}