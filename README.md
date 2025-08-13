# Mani News - Progressive Web App Portal de Notícias

Portal de notícias moderno e responsivo com PWA, construído com Node.js, Express, MongoDB e Tailwind CSS.

## 🚀 Funcionalidades

### Frontend (Interface Pública)
- ✅ Homepage responsiva com notícias em destaque
- ✅ Páginas de categoria e busca
- ✅ Layout otimizado para mobile e desktop
- ✅ Dark mode automático/manual
- ✅ PWA com instalação nativa
- ✅ Service Worker para cache offline
- ✅ Push notifications
- ✅ Lazy loading de imagens
- ✅ Compartilhamento social integrado

### Backend e API
- ✅ Express.js com arquitetura modular
- ✅ MongoDB com Mongoose
- ✅ Sistema de categorias e autores
- ✅ Busca full-text
- ✅ Sistema de comentários
- ✅ Rate limiting e segurança
- ✅ Logs estruturados
- ✅ Validação de dados

### PWA Features
- ✅ Manifest configurado
- ✅ Service Worker com cache strategies
- ✅ Offline page
- ✅ Install prompt
- ✅ App shortcuts
- ✅ Background sync

### Segurança
- ✅ Helmet.js para headers de segurança
- ✅ Rate limiting configurável
- ✅ Validação e sanitização de inputs
- ✅ Proteção CSRF
- ✅ Proteção XSS e SQL injection
- ✅ Logs de segurança

## 🛠️ Tecnologias

- **Backend**: Node.js, Express.js v5.x
- **Database**: MongoDB com Mongoose v8.x
- **Frontend**: EJS, Tailwind CSS v4.x
- **PWA**: Workbox v7.x, Service Workers
- **Security**: Helmet, Rate Limiting, Input Validation
- **Logs**: Winston
- **Images**: Sharp para otimização

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ LTS
- MongoDB 5.0+
- NPM ou Yarn

### Passos

1. **Clone o repositório**
```bash
git clone <repository-url>
cd maninews
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o ambiente**
```bash
cp .env.example .env
```

4. **Configure as variáveis de ambiente** (edite o arquivo `.env`):
```env
# Database
MONGODB_URI=mongodb://localhost:27017/maninews

# Server
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=seu_jwt_secret_aqui
SESSION_SECRET=seu_session_secret_aqui
```

5. **Inicie o MongoDB**
```bash
# Se usando MongoDB local
mongod

# Ou use MongoDB Atlas (cloud)
```

6. **Execute o projeto**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Build CSS (se necessário)
npm run build-css
```

7. **Acesse a aplicação**
```
http://localhost:3000
```

## 🎯 Scripts Disponíveis

```bash
# Desenvolvimento com auto-reload
npm run dev

# Produção
npm start

# Build CSS do Tailwind
npm run build-css

# Build CSS minificado para produção
npm run build-css-prod
```

## 📁 Estrutura do Projeto

```
maninews/
├── src/
│   ├── models/           # Schemas do MongoDB
│   │   ├── Post.js
│   │   ├── Category.js
│   │   ├── Author.js
│   │   └── Comment.js
│   ├── views/            # Templates EJS
│   │   ├── layouts/      # Layout principal
│   │   ├── pages/        # Páginas
│   │   └── partials/     # Componentes reutilizáveis
│   ├── middleware/       # Middleware customizado
│   └── utils/            # Utilitários
├── public/               # Assets estáticos
│   ├── css/              # Estilos (Tailwind)
│   ├── js/               # JavaScript do cliente
│   ├── images/           # Imagens
│   └── icons/            # Ícones PWA
├── uploads/              # Uploads de usuários
├── logs/                 # Logs da aplicação
├── app.js                # Servidor principal
├── package.json
└── README.md
```

## 🔧 Configuração

### Banco de Dados
O projeto cria automaticamente:
- Categorias padrão (Política, Economia, Esportes, etc.)
- Usuários administrativos iniciais
- Índices otimizados para busca

### PWA
- Manifest configurado em `/public/manifest.json`
- Service Worker em `/public/sw.js`
- Ícones em múltiplos tamanhos em `/public/icons/`

### Segurança
- Rate limiting: 100 req/15min por IP
- Headers de segurança via Helmet
- Validação de todos os inputs
- Logs de segurança

## 🚀 Deploy

### Buildpack Deployment (Heroku/EasyPanel)
O projeto inclui os arquivos necessários para deploy com buildpacks:
- `Procfile` - Define o comando de start
- `package.json` - Com engines especificados
- `.npmrc` - Configurações NPM

### Variáveis de Ambiente para Produção
```env
NODE_ENV=production
MONGODB_URI=mongodb://usuario:senha@host:27017/maninews
JWT_SECRET=jwt_secret_super_seguro_aqui
SESSION_SECRET=session_secret_super_seguro_aqui
PORT=3000
```

### PM2 (Recomendado para VPS)
```bash
npm install -g pm2
pm2 start app.js --name maninews
pm2 startup
pm2 save
```

### Docker
```bash
# Build da imagem
docker build -t maninews .

# Executar container
docker run -d \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://host:27017/maninews \
  -e NODE_ENV=production \
  --name maninews \
  maninews
```

### Troubleshooting Deploy

**Erro: "No buildpack groups passed detection"**
- Verifique se o `package.json` está na raiz
- Confirme que o `Procfile` existe
- Verifique se as engines estão especificadas

**Erro de conexão MongoDB**
- O app inicia mesmo sem DB para health checks
- Verifique a string de conexão `MONGODB_URI`
- Confirme que o MongoDB está acessível

**Timeout no build**
- Remova `node_modules` antes do deploy
- Use `.dockerignore` ou `.slugignore` adequados

## 📱 PWA Features

### Instalação
- Banner de instalação automático
- Suporte a múltiplas plataformas
- Ícones adaptativos

### Offline
- Cache de páginas visitadas
- Fallback para página offline
- Sync em background quando online

### Performance
- Lazy loading de imagens
- Compressão automática
- Cache de assets estáticos

## 🔍 API Endpoints

### Públicos
- `GET /` - Homepage
- `GET /noticia/:slug` - Página da notícia
- `GET /categoria/:slug` - Páginas de categoria
- `GET /buscar?q=termo` - Busca
- `GET /health` - Health check

### Futuros (Admin)
- `POST /api/posts` - Criar notícia
- `PUT /api/posts/:id` - Editar notícia
- `DELETE /api/posts/:id` - Excluir notícia
- `GET /api/admin/dashboard` - Dashboard

## 🛡️ Segurança

### Implementado
- ✅ Rate limiting por IP
- ✅ Validação de inputs
- ✅ Sanitização XSS
- ✅ Headers de segurança
- ✅ CSRF protection
- ✅ Logs de segurança

### Recomendações Adicionais
- Use HTTPS em produção
- Configure firewall adequado
- Monitore logs regularmente
- Atualize dependências frequentemente

## 📊 Monitoramento

### Logs
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`
- Security logs: incluídos nos logs principais

### Health Check
- Endpoint: `GET /health`
- Retorna status da aplicação e banco

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença ISC.

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no repositório
- Email: suporte@maninews.com

---

**Mani News** - Portal de notícias moderno e progressivo 📱✨# mani-news
