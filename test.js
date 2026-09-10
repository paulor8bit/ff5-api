/**
 * Teste simples da API
 * Execute: node test.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

const tests = [
  { name: 'Root', path: '/' },
  { name: 'Jobs', path: '/api/jobs' },
  { name: 'Job by ID', path: '/api/jobs/job_002' },
  { name: 'Characters', path: '/api/characters' },
  { name: 'Magic', path: '/api/magic' },
  { name: 'White Magic', path: '/api/magic/white' },
  { name: 'Black Magic', path: '/api/magic/black' },
  { name: 'Summon Magic', path: '/api/magic/summon' },
  { name: 'Blue Magic', path: '/api/magic/blue' },
  { name: 'Equipment', path: '/api/equipment' },
  { name: 'Weapons', path: '/api/equipment/weapons' },
  { name: 'Armor', path: '/api/equipment/armor' },
  { name: 'Items', path: '/api/items' },
  { name: 'Monsters', path: '/api/monsters' },
  { name: 'Bosses', path: '/api/monsters/bosses' },
  { name: 'Abilities', path: '/api/abilities' },
  { name: 'Search', path: '/api/search?q=bahamut' },
  { name: 'Image Map', path: '/api/images/map' },
  { name: 'Image by ID (char 003 Galuf)', path: '/api/images/id/img_char_003' },
  { name: 'Image by ID (char 005 Krile)', path: '/api/images/id/img_char_005' },
  { name: 'Image by ID (job 008)', path: '/api/images/id/img_job_008' },
  { name: 'Image by ID (npc 007 Exdeath)', path: '/api/images/id/img_npc_007' },
  { name: 'Monsters World 1', path: '/api/monsters/world/1' },
  { name: 'Monsters World 2', path: '/api/monsters/world/2' },
  { name: 'Monsters World 3', path: '/api/monsters/world/3' },
  { name: 'Bosses World 1', path: '/api/monsters/bosses/world/1' },
  { name: 'Bosses World 3', path: '/api/monsters/bosses/world/3' },
  { name: 'Notable Monsters', path: '/api/monsters/notable' },
  { name: 'Image by ID (enemy tile 001)', path: '/api/images/id/img_enemy_001' },
  { name: 'Image by ID (enemy tile 227)', path: '/api/images/id/img_enemy_227' },
  { name: 'Image by ID (monster sprite 004)', path: '/api/images/id/img_monster_004' },
  { name: 'Raw data: monsters.json', path: '/data/monsters.json' },
  { name: 'Raw data: jobs.json', path: '/data/jobs.json' },
  { name: 'Raw data: image_map.json', path: '/data/image_map.json' },
  { name: 'Raw img: monster_004.gif', path: '/img/monsters/monster_004.gif' },
  { name: 'Raw img: img_char_001_bartz.png', path: '/img/img_char_001_bartz.png' },
];

let passed = 0;
let failed = 0;

console.log('🧪 Testando Final Fantasy V API\n');
console.log('═'.repeat(50));

function runTest(test) {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}${test.path}`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${test.name}: ${res.statusCode}`);
          passed++;
        } else {
          console.log(`❌ ${test.name}: ${res.statusCode}`);
          failed++;
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${test.name}: ERRO - ${error.message}`);
      console.log('   Certifique-se de que o servidor está rodando: npm start');
      failed++;
      resolve();
    });
    
    req.setTimeout(5000, () => {
      console.log(`❌ ${test.name}: TIMEOUT`);
      failed++;
      req.destroy();
      resolve();
    });
  });
}

async function runAllTests() {
  for (const test of tests) {
    await runTest(test);
  }
  
  console.log('═'.repeat(50));
  console.log(`\n📊 Resultado: ${passed} passou, ${failed} falhou`);
  
  if (failed === 0) {
    console.log('\n🎉 Todos os testes passaram!\n');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique se o servidor está rodando.\n');
  }
}

runAllTests();
