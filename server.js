/**
 * Final Fantasy V API
 * API REST completa com todos os dados do jogo
 * 
 * @author FF5 Community
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (página web)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/wiki', express.static(path.join(__dirname, 'wiki')));

// Log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// =============================================
// CARREGAR DADOS DOS ARQUIVOS JSON
// =============================================
const jsonDir = path.join(__dirname, 'json');

// Dados e imagens em arquivos brutos (para a wiki e outros consumidores)
app.use('/data', express.static(jsonDir));
app.use('/img', express.static(path.join(__dirname, 'images')));

const loadData = () => {
  try {
    return {
      jobs: JSON.parse(fs.readFileSync(path.join(jsonDir, 'jobs.json'), 'utf8')),
      characters: JSON.parse(fs.readFileSync(path.join(jsonDir, 'characters.json'), 'utf8')),
      magic: JSON.parse(fs.readFileSync(path.join(jsonDir, 'magic.json'), 'utf8')),
      equipment: JSON.parse(fs.readFileSync(path.join(jsonDir, 'equipment.json'), 'utf8')),
      items: JSON.parse(fs.readFileSync(path.join(jsonDir, 'items.json'), 'utf8')),
      monsters: JSON.parse(fs.readFileSync(path.join(jsonDir, 'monsters.json'), 'utf8')),
      abilities: JSON.parse(fs.readFileSync(path.join(jsonDir, 'abilities.json'), 'utf8')),
      imageMap: JSON.parse(fs.readFileSync(path.join(jsonDir, 'image_map.json'), 'utf8')).map
    };
  } catch (error) {
    console.error('Erro ao carregar arquivos JSON:', error.message);
    process.exit(1);
  }
};

const data = loadData();

const nameIncludes = (name, query) => {
  if (name == null) return false;
  const strings = typeof name === 'string' ? [name] : Object.values(name);
  return strings.some((s) => typeof s === 'string' && s.toLowerCase().includes(query));
};

const flattenMonsters = (world) => {
  const list = [];
  Object.values(world).forEach((area) => {
    if (Array.isArray(area)) list.push(...area);
  });
  return list;
};

const collectWorldMonsters = (world) => {
  if (Array.isArray(world)) return world;
  return flattenMonsters(world);
};

// =============================================
// ROTA RAIZ - Documentação
// =============================================
app.get('/', (req, res) => {
  res.json({
    name: '🎮 Final Fantasy V API',
    version: '1.0.0',
    description: 'API REST completa com todos os dados de Final Fantasy V',
    total_records: {
      jobs: data.jobs.jobs.length,
      characters: data.characters.characters.length,
      npcs: data.characters.npcs.length,
      white_magic: data.magic.white_magic.spells.length,
      black_magic: data.magic.black_magic.spells.length,
      time_magic: data.magic.time_magic.spells.length,
      summon_magic: data.magic.summon_magic.spells.length,
      blue_magic: data.magic.blue_magic.spells.length,
      monsters: data.monsters.metadata.total_monsters,
      bosses: Object.values(data.monsters.bosses).flat().length
    },
    endpoints: {
      jobs: {
        list: 'GET /api/jobs',
        single: 'GET /api/jobs/:id',
        by_crystal: 'GET /api/jobs/crystal/:crystal'
      },
      characters: {
        list: 'GET /api/characters',
        single: 'GET /api/characters/:id',
        npcs: 'GET /api/characters/npcs'
      },
      magic: {
        all: 'GET /api/magic',
        white: 'GET /api/magic/white',
        black: 'GET /api/magic/black',
        time: 'GET /api/magic/time',
        summon: 'GET /api/magic/summon',
        blue: 'GET /api/magic/blue',
        spell: 'GET /api/magic/spell/:id'
      },
      equipment: {
        weapons: 'GET /api/equipment/weapons',
        weapons_by_type: 'GET /api/equipment/weapons/:type',
        armor: 'GET /api/equipment/armor',
        armor_by_type: 'GET /api/equipment/armor/:type'
      },
      items: {
        all: 'GET /api/items',
        recovery: 'GET /api/items/recovery',
        battle: 'GET /api/items/battle',
        key_items: 'GET /api/items/key',
        stat_boosters: 'GET /api/items/boosters'
      },
      monsters: {
        all: 'GET /api/monsters',
        by_world: 'GET /api/monsters/world/:number',
        bosses: 'GET /api/monsters/bosses',
        bosses_by_world: 'GET /api/monsters/bosses/world/:number',
        notable: 'GET /api/monsters/notable',
        summons: 'GET /api/monsters/summons',
        special: 'GET /api/monsters/special'
      },
      abilities: {
        all: 'GET /api/abilities',
        command: 'GET /api/abilities/command',
        support: 'GET /api/abilities/support',
        innate: 'GET /api/abilities/innate'
      },
      images: {
        serve: 'GET /api/images/:folder/:filename',
        list: 'GET /api/images/list',
        by_id: 'GET /api/images/id/:image_id',
        map: 'GET /api/images/map'
      },
      search: 'GET /api/search?q=query&type=optional_type'
    },
    static_files: {
      wiki: 'GET /wiki (enciclopédia; lê json/* e images/* diretamente, sem API)',
      data: 'GET /data/:file (arquivos JSON brutos da pasta json/)',
      images: 'GET /img/:path (arquivos de imagem brutos da pasta images/)'
    },
    credits: {
      game: 'Final Fantasy V © Square Enix',
      api: 'Dados compilados pela comunidade'
    }
  });
});

// =============================================
// JOBS - Classes/Profissões
// =============================================

/**
 * @api {get} /api/jobs Listar todos os jobs
 * @apiName GetJobs
 * @apiGroup Jobs
 * @apiSuccess {Array} jobs Lista de todos os 26 jobs
 */
app.get('/api/jobs', (req, res) => {
  res.json({
    total: data.jobs.jobs.length,
    jobs: data.jobs.jobs
  });
});

/**
 * @api {get} /api/jobs/:id Buscar job por ID
 * @apiName GetJob
 * @apiGroup Jobs
 * @apiParam {String} id ID do job (ex: job_002)
 */
app.get('/api/jobs/:id', (req, res) => {
  const job = data.jobs.jobs.find(j => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ 
      error: 'Job não encontrado',
      id: req.params.id,
      valid_format: 'job_XXX (ex: job_001, job_002)'
    });
  }
  res.json(job);
});

/**
 * @api {get} /api/jobs/crystal/:crystal Buscar jobs por cristal
 * @apiName GetJobsByCrystal
 * @apiGroup Jobs
 * @apiParam {String} crystal Nome do cristal (wind, water, fire, earth, gba)
 */
app.get('/api/jobs/crystal/:crystal', (req, res) => {
  const crystal = req.params.crystal.toLowerCase();
  const filtered = data.jobs.jobs.filter(j => 
    j.crystal.toLowerCase().includes(crystal)
  );
  
  if (filtered.length === 0) {
    return res.status(404).json({
      error: 'Nenhum job encontrado para este cristal',
      crystal: req.params.crystal,
      available_crystals: ['wind', 'water', 'fire', 'earth', 'gba exclusive']
    });
  }
  
  res.json({
    crystal: crystal,
    total: filtered.length,
    jobs: filtered
  });
});

// =============================================
// CHARACTERS - Personagens
// =============================================

/**
 * @api {get} /api/characters Listar personagens jogáveis
 * @apiName GetCharacters
 * @apiGroup Characters
 */
app.get('/api/characters', (req, res) => {
  res.json({
    total: data.characters.characters.length,
    characters: data.characters.characters
  });
});

/**
 * @api {get} /api/characters/npcs Listar NPCs
 * @apiName GetNPCs
 * @apiGroup Characters
 */
app.get('/api/characters/npcs', (req, res) => {
  res.json({
    total: data.characters.npcs.length,
    npcs: data.characters.npcs
  });
});

/**
 * @api {get} /api/characters/:id Buscar personagem por ID
 * @apiName GetCharacter
 * @apiGroup Characters
 */
app.get('/api/characters/:id', (req, res) => {
  const char = data.characters.characters.find(c => c.id === req.params.id);
  if (!char) {
    return res.status(404).json({ 
      error: 'Personagem não encontrado',
      id: req.params.id
    });
  }
  res.json(char);
});

// =============================================
// MAGIC - Magias
// =============================================

/**
 * @api {get} /api/magic Listar todas as magias
 * @apiName GetMagic
 * @apiGroup Magic
 */
app.get('/api/magic', (req, res) => {
  res.json({
    metadata: data.magic.metadata,
    schools: {
      white_magic: { total: data.magic.white_magic.spells.length, endpoint: '/api/magic/white' },
      black_magic: { total: data.magic.black_magic.spells.length, endpoint: '/api/magic/black' },
      time_magic: { total: data.magic.time_magic.spells.length, endpoint: '/api/magic/time' },
      summon_magic: { total: data.magic.summon_magic.spells.length, endpoint: '/api/magic/summon' },
      blue_magic: { total: data.magic.blue_magic.spells.length, endpoint: '/api/magic/blue' }
    }
  });
});

/**
 * @api {get} /api/magic/white Magias Brancas
 * @apiName GetWhiteMagic
 * @apiGroup Magic
 */
app.get('/api/magic/white', (req, res) => {
  res.json(data.magic.white_magic);
});

/**
 * @api {get} /api/magic/black Magias Negras
 * @apiName GetBlackMagic
 * @apiGroup Magic
 */
app.get('/api/magic/black', (req, res) => {
  res.json(data.magic.black_magic);
});

/**
 * @api {get} /api/magic/time Magias do Tempo
 * @apiName GetTimeMagic
 * @apiGroup Magic
 */
app.get('/api/magic/time', (req, res) => {
  res.json(data.magic.time_magic);
});

/**
 * @api {get} /api/magic/summon Invocações
 * @apiName GetSummonMagic
 * @apiGroup Magic
 */
app.get('/api/magic/summon', (req, res) => {
  res.json(data.magic.summon_magic);
});

/**
 * @api {get} /api/magic/blue Blue Magic
 * @apiName GetBlueMagic
 * @apiGroup Magic
 */
app.get('/api/magic/blue', (req, res) => {
  res.json(data.magic.blue_magic);
});

/**
 * @api {get} /api/magic/spell/:id Buscar magia específica
 * @apiName GetSpell
 * @apiGroup Magic
 */
app.get('/api/magic/spell/:id', (req, res) => {
  const id = req.params.id;
  const types = [
    { key: 'white_magic', name: 'white' },
    { key: 'black_magic', name: 'black' },
    { key: 'time_magic', name: 'time' },
    { key: 'summon_magic', name: 'summon' },
    { key: 'blue_magic', name: 'blue' }
  ];
  
  for (const type of types) {
    const spell = data.magic[type.key].spells.find(s => s.id === id);
    if (spell) {
      return res.json({ 
        ...spell, 
        school: type.name,
        school_description: data.magic[type.key].description
      });
    }
  }
  
  res.status(404).json({ 
    error: 'Magia não encontrada',
    id
  });
});

// =============================================
// EQUIPMENT - Equipamentos
// =============================================

/**
 * @api {get} /api/equipment Listar equipamentos
 * @apiName GetEquipment
 * @apiGroup Equipment
 */
app.get('/api/equipment', (req, res) => {
  res.json({
    weapons: {
      types: Object.keys(data.equipment.weapons),
      endpoint: '/api/equipment/weapons'
    },
    armor: {
      types: Object.keys(data.equipment.armor),
      endpoint: '/api/equipment/armor'
    }
  });
});

/**
 * @api {get} /api/equipment/weapons Todas as armas
 * @apiName GetWeapons
 * @apiGroup Equipment
 */
app.get('/api/equipment/weapons', (req, res) => {
  const weaponTypes = Object.keys(data.equipment.weapons).filter(type => type !== 'description');
  const result = {};
  let total = 0;
  
  weaponTypes.forEach(type => {
    result[type] = {
      description: data.equipment.weapons[type].description,
      total: data.equipment.weapons[type].items.length,
      items: data.equipment.weapons[type].items
    };
    total += data.equipment.weapons[type].items.length;
  });
  
  res.json({
    total_weapons: total,
    weapon_types: weaponTypes,
    weapons: result
  });
});

/**
 * @api {get} /api/equipment/weapons/:type Armas por tipo
 * @apiName GetWeaponsByType
 * @apiGroup Equipment
 */
app.get('/api/equipment/weapons/:type', (req, res) => {
  const type = req.params.type;
  const weapons = data.equipment.weapons[type];
  
  if (!weapons) {
    return res.status(404).json({ 
      error: 'Tipo de arma não encontrado',
      requested: type,
      available_types: Object.keys(data.equipment.weapons)
    });
  }
  res.json(weapons);
});

/**
 * @api {get} /api/equipment/armor Todas as armaduras
 * @apiName GetArmor
 * @apiGroup Equipment
 */
app.get('/api/equipment/armor', (req, res) => {
  const armorTypes = Object.keys(data.equipment.armor).filter(type => type !== 'description');
  const result = {};
  let total = 0;
  
  armorTypes.forEach(type => {
    result[type] = {
      description: data.equipment.armor[type].description,
      total: data.equipment.armor[type].items.length,
      items: data.equipment.armor[type].items
    };
    total += data.equipment.armor[type].items.length;
  });
  
  res.json({
    total_armor: total,
    armor_types: armorTypes,
    armor: result
  });
});

/**
 * @api {get} /api/equipment/armor/:type Armaduras por tipo
 * @apiName GetArmorByType
 * @apiGroup Equipment
 */
app.get('/api/equipment/armor/:type', (req, res) => {
  const type = req.params.type;
  const armor = data.equipment.armor[type];
  
  if (!armor) {
    return res.status(404).json({ 
      error: 'Tipo de armadura não encontrado',
      requested: type,
      available_types: Object.keys(data.equipment.armor)
    });
  }
  res.json(armor);
});

// =============================================
// ITEMS - Itens
// =============================================

/**
 * @api {get} /api/items Listar itens
 * @apiName GetItems
 * @apiGroup Items
 */
app.get('/api/items', (req, res) => {
  res.json({
    metadata: data.items.metadata,
    categories: {
      recovery: { endpoint: '/api/items/recovery' },
      battle: { endpoint: '/api/items/battle' },
      stat_boosters: { endpoint: '/api/items/boosters' },
      key_items: { endpoint: '/api/items/key' },
      catchable_monsters: { endpoint: '/api/items/catchable' }
    }
  });
});

/**
 * @api {get} /api/items/recovery Itens de recuperação
 * @apiName GetRecoveryItems
 * @apiGroup Items
 */
app.get('/api/items/recovery', (req, res) => {
  res.json(data.items.recovery_items);
});

/**
 * @api {get} /api/items/battle Itens de batalha
 * @apiName GetBattleItems
 * @apiGroup Items
 */
app.get('/api/items/battle', (req, res) => {
  res.json(data.items.battle_items);
});

/**
 * @api {get} /api/items/boosters Itens de boost de stats
 * @apiName GetStatBoosters
 * @apiGroup Items
 */
app.get('/api/items/boosters', (req, res) => {
  res.json(data.items.stat_boosters);
});

/**
 * @api {get} /api/items/key Itens chave
 * @apiName GetKeyItems
 * @apiGroup Items
 */
app.get('/api/items/key', (req, res) => {
  res.json(data.items.key_items);
});

/**
 * @api {get} /api/items/catchable Monstros capturáveis
 * @apiName GetCatchableMonsters
 * @apiGroup Items
 */
app.get('/api/items/catchable', (req, res) => {
  res.json(data.items.catchable_monsters);
});

// =============================================
// MONSTERS - Monstros
// =============================================

/**
 * @api {get} /api/monsters Listar monstros
 * @apiName GetMonsters
 * @apiGroup Monsters
 */
app.get('/api/monsters', (req, res) => {
  res.json({
    metadata: data.monsters.metadata,
    categories: {
      regular_enemies: {
        worlds: ['world_1', 'world_2', 'world_3'],
        endpoint: '/api/monsters/world/:number'
      },
      bosses: {
        endpoint: '/api/monsters/bosses'
      },
      notable: {
        endpoint: '/api/monsters/notable'
      }
    }
  });
});

/**
 * @api {get} /api/monsters/world/:world Monstros por mundo
 * @apiName GetMonstersByWorld
 * @apiGroup Monsters
 */
app.get('/api/monsters/world/:world', (req, res) => {
  const world = req.params.world;
  const worldMap = { '1': 'world_one_enemies', '2': 'world_two_enemies', '3': 'world_three_enemies' };
  const worldData = data.monsters[worldMap[world]];

  if (!worldData) {
    return res.status(404).json({ 
      error: 'Mundo não encontrado',
      requested: world,
      available_worlds: ['1', '2', '3']
    });
  }
  const monsters = collectWorldMonsters(worldData);
  res.json({
    world: parseInt(world),
    total: monsters.length,
    monsters
  });
});

/**
 * @api {get} /api/monsters/bosses Todos os bosses
 * @apiName GetBosses
 * @apiGroup Monsters
 */
app.get('/api/monsters/bosses', (req, res) => {
  res.json(data.monsters.bosses);
});

/**
 * @api {get} /api/monsters/bosses/world/:world Bosses por mundo
 * @apiName GetBossesByWorld
 * @apiGroup Monsters
 */
app.get('/api/monsters/bosses/world/:world', (req, res) => {
  const world = req.params.world;
  const bossMap = { '1': 'world_one_bosses', '2': 'world_two_bosses', '3': 'world_three_bosses' };
  const bossKey = bossMap[world] || `world_${world}_bosses`;
  const bosses = data.monsters.bosses[bossKey];
  
  if (!bosses) {
    return res.status(404).json({ 
      error: 'Bosses não encontrados para este mundo',
      requested: world
    });
  }
  res.json({
    world: parseInt(world),
    total: bosses.length,
    bosses
  });
});

/**
 * @api {get} /api/monsters/notable Monstros notáveis
 * @apiName GetNotableMonsters
 * @apiGroup Monsters
 */
app.get('/api/monsters/notable', (req, res) => {
  res.json(data.monsters.notable_monsters);
});

/**
 * @api {get} /api/monsters/summons Summons (espers)
 * @apiName GetMonsterSummons
 * @apiGroup Monsters
 */
app.get('/api/monsters/summons', (req, res) => {
  res.json({
    total: data.monsters.summons.length,
    summons: data.monsters.summons
  });
});

/**
 * @api {get} /api/monsters/special Monstros especiais
 * @apiName GetSpecialMonsters
 * @apiGroup Monsters
 */
app.get('/api/monsters/special', (req, res) => {
  const special = data.monsters.special_monsters;
  res.json({
    description: special.description,
    total: special.items.length,
    monsters: special.items
  });
});

// =============================================
// ABILITIES - Habilidades
// =============================================

/**
 * @api {get} /api/abilities Listar habilidades
 * @apiName GetAbilities
 * @apiGroup Abilities
 */
app.get('/api/abilities', (req, res) => {
  res.json({
    metadata: data.abilities.metadata,
    categories: {
      command: { 
        total: data.abilities.command_abilities.abilities.length,
        endpoint: '/api/abilities/command'
      },
      support: { 
        total: data.abilities.support_abilities.abilities.length,
        endpoint: '/api/abilities/support'
      },
      innate: { 
        total: data.abilities.job_innate_abilities.abilities.length,
        endpoint: '/api/abilities/innate'
      }
    }
  });
});

/**
 * @api {get} /api/abilities/command Habilidades de comando
 * @apiName GetCommandAbilities
 * @apiGroup Abilities
 */
app.get('/api/abilities/command', (req, res) => {
  res.json(data.abilities.command_abilities);
});

/**
 * @api {get} /api/abilities/support Habilidades de suporte
 * @apiName GetSupportAbilities
 * @apiGroup Abilities
 */
app.get('/api/abilities/support', (req, res) => {
  res.json(data.abilities.support_abilities);
});

/**
 * @api {get} /api/abilities/innate Habilidades inatas
 * @apiName GetInnateAbilities
 * @apiGroup Abilities
 */
app.get('/api/abilities/innate', (req, res) => {
  res.json(data.abilities.job_innate_abilities);
});

// =============================================
// IMAGES - Servir Imagens
// =============================================

/**
 * @api {get} /api/images Servir imagens
 * @apiName GetImages
 * @apiGroup Images
 */
app.use('/api/images', express.static(path.join(__dirname, 'images')));

/**
 * @api {get} /api/images/list Listar imagens disponíveis
 * @apiName ListImages
 * @apiGroup Images
 */
app.get('/api/images/list', (req, res) => {
  const imagesDir = path.join(__dirname, 'images');
  
  if (!fs.existsSync(imagesDir)) {
    return res.json({ 
      message: 'Pasta de imagens não encontrada',
      instructions: 'Adicione sprites PNG na pasta /images/'
    });
  }
  
  const result = {};
  
  const listDir = (dir, obj) => {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    items.forEach(item => {
      if (item.isDirectory()) {
        obj[item.name] = {};
        listDir(path.join(dir, item.name), obj[item.name]);
      } else if (item.name.endsWith('.png') || item.name.endsWith('.gif')) {
        const key = item.name.replace(/\.[^.]+$/, '');
        obj[key] = `/api/images/${path.relative(imagesDir, path.join(dir, item.name))}`;
      }
    });
  };
  
  listDir(imagesDir, result);
  
  res.json({
    base_url: '/api/images/',
    images: result
  });
});

/**
 * @api {get} /api/images/id/:image_id Resolver image_id para arquivo
 * @apiName ResolveImage
 * @apiGroup Images
 * @apiParam {String} image_id ID da imagem (ex: img_char_003, img_job_008)
 * @apiDescription Resolve o image_id referenciado nos JSONs para o arquivo de sprite correspondente.
 */
app.get('/api/images/id/:imageId', (req, res) => {
  const { imageId } = req.params;
  const imagesDir = path.join(__dirname, 'images');

  const resolveImage = (id) => {
    if (data.imageMap[id]) {
      return path.join(imagesDir, data.imageMap[id]);
    }

    const candidates = [
      path.join(imagesDir, `${id}.png`),
      path.join(imagesDir, `${id}.gif`),
      path.join(imagesDir, `${id}_*.png`),
      path.join(imagesDir, `${id}_*.gif`)
    ];

    for (const pattern of candidates) {
      if (fs.existsSync(pattern) && fs.statSync(pattern).isFile()) {
        return pattern;
      }
      if (pattern.includes('*')) {
        const matches = fs.readdirSync(path.dirname(pattern)).filter(f => f.startsWith(id));
        if (matches.length > 0) {
          return path.join(path.dirname(pattern), matches[0]);
        }
      }
    }

    return null;
  };

  const filePath = resolveImage(imageId);

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({
      error: 'Imagem não encontrada',
      image_id: imageId,
      hint: 'Use GET /api/images/list para listar as imagens disponíveis, ou GET /api/images/id/ para ver o mapa de image_id'
    });
  }

  res.sendFile(filePath);
});

/**
 * @api {get} /api/images/map Mapa de image_id -> arquivo
 * @apiName ImageMap
 * @apiGroup Images
 * @apiDescription Retorna o mapa completo de image_id para caminhos de arquivo.
 */
app.get('/api/images/map', (req, res) => {
  const imagesDir = path.join(__dirname, 'images');
  const map = {};
  const sorted = Object.keys(data.imageMap).sort((a, b) => {
    const num = (id) => parseInt(id.replace(/\D/g, '')) || 0;
    return num(a) - num(b);
  });
  sorted.forEach(id => {
    map[id] = data.imageMap[id]
      ? `/api/images/${data.imageMap[id]}`
      : null;
  });
  res.json({
    base_url: '/api/images/',
    total_mapped: sorted.filter(id => data.imageMap[id]).length,
    total_missing: sorted.filter(id => !data.imageMap[id]).length,
    map
  });
});

// =============================================
// SEARCH - Busca Global
// =============================================

/**
 * @api {get} /api/search Busca global
 * @apiName Search
 * @apiGroup Search
 * @apiParam {String} q Termo de busca
 * @apiParam {String} [type] Tipo para filtrar (jobs, characters, monsters, magic, equipment)
 */
app.get('/api/search', (req, res) => {
  const { q, type } = req.query;
  
  if (!q) {
    return res.status(400).json({ 
      error: 'Parâmetro "q" é obrigatório',
      example: '/api/search?q=knight'
    });
  }
  
  const query = q.toLowerCase();
  const results = {};
  let total = 0;
  
  // Buscar em jobs
  if (!type || type === 'jobs') {
    results.jobs = data.jobs.jobs.filter(j => 
      nameIncludes(j.name, query) ||
      nameIncludes(j.name_jp, query)
    );
    total += results.jobs.length;
  }
  
  // Buscar em personagens
  if (!type || type === 'characters') {
    results.characters = data.characters.characters.filter(c => 
      nameIncludes(c.name, query) ||
      nameIncludes(c.name_jp, query)
    );
    total += results.characters.length;
  }
  
  // Buscar em monstros
  if (!type || type === 'monsters') {
    results.monsters = [];
    ['world_one_enemies', 'world_two_enemies', 'world_three_enemies'].forEach(worldKey => {
      const world = data.monsters[worldKey];
      if (!world) return;
      const monsters = collectWorldMonsters(world);
      monsters.forEach(m => {
        if (nameIncludes(m.name, query)) {
          results.monsters.push({ ...m, world: worldKey.replace('_enemies', ''), location: (m.location && m.location.en) ? m.location.en : null });
        }
      });
    });
    if (data.monsters.special_monsters && Array.isArray(data.monsters.special_monsters.items)) {
      data.monsters.special_monsters.items.forEach(m => {
        if (nameIncludes(m.name, query)) {
          results.monsters.push({ ...m, world: 'special', location: (m.location && m.location.en) ? m.location.en : null });
        }
      });
    }
    total += results.monsters.length;
  }
  
  // Buscar em bosses
  if (!type || type === 'bosses' || type === 'monsters') {
    results.bosses = [];
    Object.keys(data.monsters.bosses).forEach(bossKey => {
      if (Array.isArray(data.monsters.bosses[bossKey])) {
        data.monsters.bosses[bossKey].forEach(b => {
          if (nameIncludes(b.name, query)) {
            results.bosses.push({ ...b, group: bossKey });
          }
        });
      }
    });
    total += results.bosses.length;
  }
  
  // Buscar em magias
  if (!type || type === 'magic') {
    results.spells = [];
    const magicTypes = ['white_magic', 'black_magic', 'time_magic', 'summon_magic', 'blue_magic'];
    magicTypes.forEach(magicType => {
      const found = data.magic[magicType].spells.filter(s => 
        nameIncludes(s.name, query)
      );
      results.spells.push(...found.map(s => ({ ...s, category: magicType.replace('_magic', '') })));
    });
    total += results.spells.length;
  }
  
  // Buscar em equipamentos
  if (!type || type === 'equipment') {
    results.weapons = [];
    Object.values(data.equipment.weapons).forEach(weaponType => {
      if (weaponType.items) {
        const found = weaponType.items.filter(w => 
          nameIncludes(w.name, query)
        );
        results.weapons.push(...found);
      }
    });
    total += results.weapons.length;
  }
  
  // Buscar em habilidades
  if (!type || type === 'abilities') {
    results.abilities = data.abilities.command_abilities.abilities.filter(a =>
      nameIncludes(a.name, query)
    );
    total += results.abilities.length;
  }
  
  res.json({
    query: q,
    type_filter: type || 'all',
    total_results: total,
    results
  });
});

// =============================================
// ERRO 404
// =============================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.path,
    method: req.method,
    documentation: 'Acesse / para ver todos os endpoints disponíveis'
  });
});

// =============================================
// TRATAMENTO DE ERROS
// =============================================
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// =============================================
// INICIAR SERVIDOR
// =============================================
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║                                                  ║');
  console.log('║     🎮 Final Fantasy V API v1.0.0               ║');
  console.log('║                                                  ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║                                                  ║');
  console.log(`║  🚀 Servidor: http://localhost:${PORT}              ║`);
  console.log('║  📚 Docs:      http://localhost:' + PORT + '/              ║');
  console.log('║                                                  ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║                                                  ║');
  console.log('║  📊 Dados carregados:                           ║');
  console.log(`║     • ${data.jobs.jobs.length} Jobs                            ║`);
  console.log(`║     • ${data.characters.characters.length} Personagens                    ║`);
  console.log(`║     • ${data.magic.white_magic.spells.length + data.magic.black_magic.spells.length + data.magic.time_magic.spells.length + data.magic.summon_magic.spells.length + data.magic.blue_magic.spells.length} Magias                          ║`);
  console.log('║     • 302 Monstros                              ║');
  console.log('║                                                  ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});
