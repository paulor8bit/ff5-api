# 🎮 Final Fantasy V API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)

API REST completa com todos os dados do jogo **Final Fantasy V** (SNES/GBA/Mobile/Steam).

**Todos os dados estão em Português!**

## 📊 Dados Disponíveis

| Categoria | Quantidade | Endpoint |
|-----------|------------|----------|
| Classes/Jobs | 26 | `/api/jobs` |
| Personagens | 5 + NPCs | `/api/characters` |
| Magias Brancas | 18 | `/api/magic/white` |
| Magias Negras | 18 | `/api/magic/black` |
| Magias do Tempo | 18 | `/api/magic/time` |
| Invocações | 15 | `/api/magic/summon` |
| Magias Azuis | 30 | `/api/magic/blue` |
| Armas | 70+ | `/api/equipment/weapons` |
| Armaduras | 50+ | `/api/equipment/armor` |
| Itens | 50+ | `/api/items` |
| Monstros | 302 | `/api/monsters` |
| Bosses | 40+ | `/api/monsters/bosses` |
| Habilidades | 80+ | `/api/abilities` |

## 🚀 Instalação

### Clone o repositório

```bash
git clone https://github.com/seu-usuario/ff5-api.git
cd ff5-api
```

### Instale as dependências

```bash
npm install
```

### Execute o servidor

```bash
# Produção
npm start

# Desenvolvimento (com auto-reload)
npm run dev
```

### Acesse a API

```
http://localhost:3000
```

## 📡 Endpoints

### Jobs (Classes)

```bash
GET /api/jobs                    # Lista todos os 26 jobs
GET /api/jobs/:id                # Job específico (ex: job_002)
GET /api/jobs/crystal/:crystal   # Jobs por cristal (vento, agua, fogo, terra)
```

### Personagens

```bash
GET /api/characters              # 5 personagens jogáveis
GET /api/characters/:id          # Personagem específico
GET /api/characters/npcs         # NPCs do jogo
```

### Magias

```bash
GET /api/magic                   # Visão geral das magias
GET /api/magic/white             # Magias brancas (cura)
GET /api/magic/black             # Magias negras (ataque)
GET /api/magic/time              # Magias do tempo
GET /api/magic/summon            # Invocações
GET /api/magic/blue              # Magias Azuis
GET /api/magic/spell/:id         # Magia específica
```

### Equipamentos

```bash
GET /api/equipment/weapons       # Todas as armas
GET /api/equipment/weapons/:type # Armas por tipo (swords, daggers, etc)
GET /api/equipment/armor         # Todas as armaduras
GET /api/equipment/armor/:type   # Armaduras por tipo
```

### Itens

```bash
GET /api/items                   # Visão geral
GET /api/items/recovery          # Poções, ethers, etc
GET /api/items/battle            # Itens de batalha
GET /api/items/key               # Itens chave (história)
GET /api/items/boosters          # Boosters de status
```

### Monstros

```bash
GET /api/monsters                # Visão geral
GET /api/monsters/world/:n       # Monstros por mundo (1, 2, 3)
GET /api/monsters/bosses         # Todos os bosses
GET /api/monsters/bosses/world/:n # Bosses por mundo
GET /api/monsters/notable        # Monstros especiais
```

### Habilidades

```bash
GET /api/abilities               # Visão geral
GET /api/abilities/command       # Habilidades ativas
GET /api/abilities/support       # Habilidades passivas
GET /api/abilities/innate        # Habilidades inatas
```

### Busca Global

```bash
GET /api/search?q=bahamut        # Busca em todas as categorias
GET /api/search?q=cavaleiro&type=jobs # Busca filtrada
```

### Imagens

```bash
GET /api/images/:folder/:file    # Serve imagem PNG
GET /api/images/list             # Lista imagens disponíveis
```

## 💡 Exemplos de Uso

### JavaScript (Fetch)

```javascript
// Buscar todos os jobs
const response = await fetch('http://localhost:3000/api/jobs');
const jobs = await response.json();
console.log(jobs);

// Buscar magias de invocação
const summons = await fetch('http://localhost:3000/api/magic/summon')
  .then(r => r.json());
console.log(summons);

// Busca global
const results = await fetch('http://localhost:3000/api/search?q=bahamut')
  .then(r => r.json());
console.log(results);
```

### Python (Requests)

```python
import requests

# Buscar personagens
response = requests.get('http://localhost:3000/api/characters')
characters = response.json()
print(characters)

# Buscar bosses
response = requests.get('http://localhost:3000/api/monsters/bosses')
bosses = response.json()
print(bosses)
```

### cURL

```bash
# Listar jobs
curl http://localhost:3000/api/jobs

# Buscar job específico
curl http://localhost:3000/api/jobs/job_002

# Buscar magias negras
curl http://localhost:3000/api/magic/black

# Busca global
curl "http://localhost:3000/api/search?q=exdeath"
```

## 🖼️ Sprites / Imagens

As imagens PNG transparentes dos sprites podem ser obtidas em:

| Fonte | URL |
|-------|-----|
| VideoGameSprites.net | http://www.videogamesprites.net/FinalFantasy5/ |
| Spriters Resource | https://www.spriters-resource.com/snes/ff5/ |
| Final Fantasy Wiki | https://finalfantasy.fandom.com/wiki/Final_Fantasy_V |

### Estrutura da pasta `images/`

```
images/
├── jobs/           # Sprites dos jobs
├── characters/     # Sprites dos personagens
├── monsters/
│   ├── regular/    # Monstros comuns
│   └── bosses/     # Bosses
├── spells/         # Ícones de magias
├── items/          # Ícones de itens
└── equipment/      # Sprites de equipamentos
```

## 🐳 Docker

### Build e execute com Docker

```bash
# Build da imagem
docker build -t ff5-api .

# Execute o container
docker run -p 3000:3000 ff5-api
```

### Docker Compose

```bash
docker-compose up -d
```

## ☁️ Deploy

### Vercel (Recomendado - Gratuito)

```bash
npm i -g vercel
vercel --prod
```

### Railway (Gratuito)

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### Render (Gratuito)

1. Conecte seu repositório GitHub em [render.com](https://render.com)
2. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`

## 📁 Estrutura do Projeto

```
ff5-api/
├── server.js           # Servidor Express
├── package.json        # Dependências
├── test.js             # Testes automatizados
├── .gitignore
├── README.md           # Esta documentação
├── json/               # Dados do jogo (em Português)
│   ├── jobs.json
│   ├── characters.json
│   ├── magic.json
│   ├── equipment.json
│   ├── items.json
│   ├── monsters.json
│   └── abilities.json
└── images/             # Sprites PNG
    ├── jobs/
    ├── characters/
    ├── monsters/
    ├── spells/
    ├── items/
    └── equipment/
```

## 📋 Testes

```bash
# Execute os testes (servidor deve estar rodando)
npm test
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

**Nota**: Final Fantasy V é uma marca registrada da Square Enix. Este é um projeto de fãs, não oficial, criado para fins educacionais e de preservação de dados do jogo.

## 🙏 Créditos

- **Square Enix** - Criadores de Final Fantasy V
- **Comunidade FF5** - Compilação de dados
- **VideoGameSprites.net** - Sprites do jogo

---

<p align="center">
  Feito com ❤️ para fãs de Final Fantasy V
</p>
