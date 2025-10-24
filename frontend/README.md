# LMS Films - Frontend (Next.js)

Frontend em Next.js com TypeScript para o sistema de avaliação de filmes e séries.

## 🚀 Tecnologias Utilizadas

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Axios** - Requisições HTTP
- **React Hook Form** - Gerenciamento de formulários
- **js-cookie** - Gerenciamento de cookies
- **Turbopack** - Build tool (modo dev)

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx          # Página de login/registro
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard principal
│   ├── layout.tsx            # Layout global
│   ├── page.tsx              # Página inicial (redireciona)
│   └── globals.css           # Estilos globais
├── lib/
│   ├── api.ts               # Configuração do Axios
│   ├── auth.ts              # Serviços de autenticação
│   ├── movieService.ts      # Serviços de filmes/séries
│   └── types.ts             # Tipos TypeScript
└── components/              # Componentes reutilizáveis (futuro)
```

## ⚙️ Configuração

### 1. Instalar dependências:

```bash
npm install
```

### 2. Configurar variáveis de ambiente:

Criar arquivo `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Executar em desenvolvimento:

```bash
npm run dev
```

## 🔗 URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080

## 🔐 Sistema de Autenticação

### Fluxo de Login:

1. Usuário acessa `/` → redireciona para `/login`
2. Faz login → recebe JWT token
3. Token salvo em cookies (7 dias)
4. Redireciona para `/dashboard`

### Proteção de Rotas:

- Todas as rotas exceto `/login` são protegidas
- Token JWT verificado automaticamente
- Redirecionamento automático se não autenticado

### Logout:

- Remove cookies de autenticação
- Redireciona para `/login`

## 📡 Integração com Backend

### Configuração da API (`lib/api.ts`):

- Base URL configurável via `.env.local`
- Interceptors para adicionar token automaticamente
- Tratamento de erros 401 (não autorizado)
- Headers padrão para JSON

### Serviços Disponíveis:

#### Autenticação (`lib/auth.ts`):

- `login(credentials)` - Fazer login
- `register(userData)` - Registrar usuário
- `logout()` - Fazer logout
- `isAuthenticated()` - Verificar se está logado
- `getCurrentUser()` - Obter dados do usuário
- `isAdmin()` - Verificar se é admin

#### Filmes/Séries (`lib/movieService.ts`):

- `getUserMovies()` - Buscar filmes avaliados
- `rateMovie(data)` - Avaliar filme
- `getFavoriteMovies()` - Buscar favoritos
- `toggleFavoriteMovie(id)` - Adicionar/remover favorito
- Métodos similares para séries

## 🎨 Interface

### Página de Login (`/login`):

- Formulário de login/registro alternável
- Validação de campos
- Tratamento de erros
- Design responsivo com Tailwind

### Dashboard (`/dashboard`):

- Header com nome do usuário
- Cards de navegação para funcionalidades
- Estatísticas básicas
- Botão de logout

## 📋 Formulários

Usando **React Hook Form** para:

- Validação em tempo real
- Tipagem TypeScript
- Performance otimizada
- Mensagens de erro customizadas

## 🍪 Gerenciamento de Estado

### Cookies (js-cookie):

- `auth_token` - JWT token (7 dias)
- `user_data` - Dados do usuário (7 dias)

### Estado Local:

- React hooks para estado de componentes
- Loading states para UX

## 🔧 Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento (Turbopack)
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # Linting com Biome
npm run format   # Formatação com Biome
```

## 🚨 Tratamento de Erros

### Interceptors Axios:

- Erro 401 → logout automático
- Outros erros → propagados para componentes
- Loading states para feedback visual

### Validação de Formulários:

- Campos obrigatórios
- Formato de email
- Tamanho mínimo de senha
- Confirmação de senha

## 🔄 Próximos Passos

1. ✅ Sistema de autenticação
2. ✅ Estrutura base da API
3. 🚧 Páginas de filmes/séries
4. 🚧 Integração com TMDB API
5. 🚧 Sistema de favoritos
6. 🚧 Perfil do usuário
7. 🚧 Admin panel (se role = ADMIN)

## 🐛 Troubleshooting

### Erro de CORS:

Verificar se backend está configurado para aceitar `http://localhost:3000`

### Token expirado:

O sistema faz logout automático e redireciona para login

### Problemas de build:

```bash
rm -rf .next node_modules
npm install
npm run dev
```
