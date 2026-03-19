FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install --production

# Copiar arquivos do projeto
COPY . .

# Expor porta
EXPOSE 3000

# Comando de inicialização
CMD ["node", "server.js"]
