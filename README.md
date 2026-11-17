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

### Protótipo roguelike: Caminho dos Cristais

Com o servidor rodando, abra `http://localhost:3000/roguelike/`.
Uma run tem 12 encontros e quatro guardiões de cristal. Na primeira jornada,
Bartz começa solo como Aventureiro. Encontros de aliado no mapa permitem recrutar
Lenna, Faris e Krile, até quatro integrantes. Cada um tem HP, MP, ATB e job próprios.
A vez passa automaticamente ao próximo personagem pronto após concluir uma ação.

Guardiões revelam jobs: descobrir não significa aprender. Batalhas rendem 5 Pontos
de Job (PJ), elites 8 e guardiões 15. No menu Aprender jobs / Vagas, compre jobs
por 20, 35, 50 ou 70 PJ conforme a etapa do cristal. O aprendizado é individual: Bartz aprender um job não o libera para Lenna.
Selecione o personagem no treinamento e pague PJ separadamente para cada um.
Jobs aprendidos permanecem para aquele personagem entre jornadas e podem ser escolhidos antes de iniciar uma nova run.
Aliados recrutados ficam registrados permanentemente; comprar as vagas iniciais
2, 3 e 4 custa 80, 140 e 220 PJ e permite começar com mais integrantes.
PJ, jobs aprendidos, registro de aliados e vagas são salvos separadamente da run.
Itens, gil, equipamentos e ABP reiniciam na nova jornada. ABP aprende comandos:
após 30 ABP, um personagem pode levar aquele comando para outro job na mesma run.

Cada job começa com uma magia ou habilidade. Mago Branco e Mago Vermelho
começam com Cura, Mago Negro com Fogo, Mago do Tempo com Haste e Invocador
com Chocobo. Os outros jobs começam com seu comando próprio, como Roubar ou
Golpe de espada. A magia inicial é concedida gratuitamente ao iniciar ou trocar
para o job e fica no repertório compartilhado daquela run.

Outras magias são aprendidas durante a run, para todo o grupo: compre pergaminhos com gil
na aba Magias das lojas ou escolha um pergaminho nas recompensas. Uma compra
libera a magia para todos os personagens com job/comando herdado compatível,
inclusive aliados recrutados depois. Mago Branco usa Branca, Mago Negro usa Negra,
Mago Vermelho usa Branca/Negra básica e intermediária, Mago do Tempo usa Tempo e
Invocador usa invocações. Magias reiniciam na próxima run. A aba Magias no menu
do grupo mostra o repertório e a compatibilidade do personagem selecionado.
O repertório jogável tem 22 magias; o glossário também contém registros da base
completa ainda sem implementação de combate.

Aventureiro equipa somente peças básicas, mesmo que receba espólios avançados:
até 22 de ataque, 4 de defesa, 1 de bônus mágico e 500 gil, sem acessórios ou
bônus especiais de atributos/Auto-Acelerar. Outros jobs seguem suas categorias.
Peças incompatíveis em saves antigos voltam à mochila; jobs já equipados nesses
saves são preservados como aprendidos na migração.

O Glossário, acessível pelo título e pela pausa, tem busca e detalhes de sistemas,
jobs, personagens, magias, habilidades, equipamentos, itens, monstros e relíquias.
Os sistemas descrevem a adaptação; os demais registros incluem os dados de FF5,
com valores e efeitos originais que podem diferir da implementação do roguelike.

Este protótipo usa os dados e sprites existentes, com fórmulas simplificadas
e um conjunto de comandos representativos. Não reproduz todas as mecânicas
do FFV. Ataque, Magia e Item pedem confirmação do alvo; itens de cura podem
ser usados em outro aliado e Cauda de Fênix revive integrantes nocauteados;
acampamentos recuperam todo o grupo e revivem aliados nocauteados.

Vitórias concedem gil, ABP e um item, além de uma escolha entre arma,
proteção e consumíveis. Guardiões concedem equipamento junto da descoberta
de jobs. A etapa da run define uma faixa de potência para os equipamentos sorteados,
excluindo peças iniciais das recompensas avançadas. Elites e guardiões elevam
essa faixa; lojas seguem a mesma progressão. O sorteio considera ataque, magia,
defesa, esquiva, agilidade e Auto-Acelerar, mantém variedade de categorias e
evita repetir peças obtidas quando existem alternativas compatíveis.
Abra Item / Equipamento pelo menu de pausa, pelo mapa ou pela tecla I.
Na aba Status, consulte HP, MP, ataque, defesa, magia, agilidade, esquiva
e velocidade ATB de cada personagem, com a origem dos bônus.
Escolha um personagem e uma das cinco posições para equipar ou remover peças.
Antes de equipar ou remover uma peça, a comparação mostra os valores atuais
e futuros: ganhos em verde, perdas em vermelho e efeitos como Auto-Acelerar.
O cursor e o mouse atualizam a prévia; a troca só acontece ao confirmar.
Voltar ou Esc retorna uma etapa, sem alterar atributos ou inventário.
Na batalha, a vez passa automaticamente ao próximo integrante com ATB pronto
após concluir a ação. Se ninguém estiver pronto, o tempo volta a correr.
Cada cópia pertence à mochila ou a um único personagem; mudar de job devolve
peças incompatíveis à mochila. Ataque, defesa, magia, agilidade, esquiva e
Auto-Acelerar têm efeito no combate. Efeitos especiais de armas do FFV não
são reproduzidos. Itens de recuperação também podem ser usados entre encontros;
itens sem efeito não são consumidos fora da batalha. O inventário e equipamentos
persistem no save, preservando as poções de jornadas antigas.
Na batalha, Item abre a lista da mochila. Selecionar um item não gasta o turno;
o recurso só é consumido após confirmar um alvo válido. Esc cancela a seleção.

Validação do ciclo de combate e progressão: `npm run test:roguelike`.

A postura padrão usa um frame estático de victory.gif. Durante as ações,
os personagens usam os sprites de ataque ou conjuração. Os efeitos destacam
o atacante, o alvo atingido e o dano ou recuperação efetivos. Inimigos também
têm indicação de ataque; impactos em área aparecem em todos os alvos.
As ações são exibidas em sequência antes de liberar o próximo comando ou a
tela de vitória. Pausa e consulta aos menus suspendem a reprodução; a opção
de animações reduzidas mantém a indicação de origem, alvo e números.

A apresentação usa um campo de batalha em 4:3, sprites de personagens,
janelas azuis de comandos/status e seleção de alvos. Setas e Enter navegam os
comandos, J abre jobs entre encontros, e Esc fecha esse menu. Há modo de tela cheia.
O estilo das janelas toma [Final-Fantasy-CSS](https://github.com/cafeTechne/Final-Fantasy-CSS)
como referência, com CSS próprio adaptado ao layout SNES. A fonte local VT323
é distribuída com sua licença OFL em `public/roguelike/assets/OFL.txt`.
Os encontros usam os GIFs de monstros verificados como válidos; muitos arquivos
antigos dessa pasta contêm HTML. Saves antigos com sprites indisponíveis usam
uma silhueta, evitando mostrar a imagem de outro monstro.

O mapa da run gera rotas ramificadas com batalhas, elites, acampamentos,
lojas, eventos, tesouros e quatro guardiões. As lojas têm estoque persistente de
consumíveis, equipamentos e relíquias, venda de peças da mochila e um serviço
limitado de cura. Compras exigem gil suficiente; equipamentos equipados não
podem ser vendidos. Quatro eventos originais permitem recuperar HP/MP, oferecer
vitalidade por uma relíquia, treinar ataque ou trocar suprimentos por gil.
As consequências aparecem antes da escolha, com opções indisponíveis quando
faltam recursos. Cada evento ou tesouro só pode ser resolvido uma vez.
Tesouros oferecem relíquias que concedem ataque, defesa ou magia/agilidade a
todo o grupo durante a run; consulte os efeitos na aba Status.
Estoque, resultados e relíquias persistem no save. Mapas anteriores recebem
os novos tipos apenas nos encontros futuros, preservando o trajeto percorrido,
o encontro atual e as conexões. Somente nós conectados ao encontro anterior podem ser escolhidos.
O trajeto e o mapa persistem no save; saves anteriores são migrados automaticamente.
O botão Mapa (ou M) permite consultar as rotas durante a batalha, pausando o ATB.

Os menus têm sons sintetizados originais de navegação, confirmação, retorno e
recompensa. O áudio começa após a primeira interação e pode ser silenciado pelo
botão Som; essa preferência é salva no navegador. Não há gravações extraídas do FFV.
Para trocar nomes, edite `public/roguelike/config.js`: os IDs e os caminhos dos
sprites são independentes dos nomes exibidos, inclusive ao carregar uma run salva.

O jogo abre na tela de título, com Continuar, Nova jornada, Configurações,
Como jogar e Créditos. Esc ou Menu / Pausa interrompe o ATB; é possível retomar,
configurar ou salvar e voltar ao título. Uma nova jornada pede confirmação dentro
do jogo antes de substituir uma run em andamento. O volume dos efeitos, velocidade
do combate, filtro CRT e animações da interface são configuráveis e persistem
separadamente do save. Não há música de fundo nesta versão.

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
