# 🎬 LMS Films

<div align="center">

![LMS Films Logo](frontend/src/assets/logo.png)

**Uma plataforma moderna para descobrir, avaliar e gerenciar seus filmes e séries favoritos**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.0+-6DB33F?style=flat-square&logo=spring&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

[📋 Sobre o Projeto](#-sobre-o-projeto) • [🛠️ Instalação](#-instalação) • [📖 Documentação](#-documentação) • [👨‍💻 Autor](#-autor)

</div>

---

## 📋 Sobre o Projeto

**LMS Films** é uma aplicação web full-stack moderna que permite aos usuários descobrir, avaliar e gerenciar filmes e séries. Integrada com a **The Movie Database (TMDB) API**, oferece informações atualizadas sobre milhares de títulos, permitindo criar listas personalizadas e acompanhar avaliações.

### ✨ Principais Funcionalidades

🎯 **Descoberta de Conteúdo**

- Explorar filmes populares, em cartaz, mais votados e próximos lançamentos
- Navegar por séries em exibição, populares e bem avaliadas
- Sistema de busca avançado por título
- Informações detalhadas com sinopse, elenco, gêneros e links oficiais

🌟 **Sistema de Avaliações**

- Avaliar filmes e séries de 1 a 10 estrelas
- Visualizar suas avaliações em dashboard personalizado
- Filtrar avaliações por tipo (filmes/séries)
- Histórico completo de avaliações

❤️ **Lista de Favoritos**

- Adicionar/remover filmes e séries dos favoritos
- Organizar favoritos por categorias
- Acesso rápido aos títulos salvos

🔐 **Autenticação Segura**

- Sistema de login/registro com JWT
- Interface moderna com design glassmorphism
- Proteção de rotas e dados pessoais

📱 **Design Responsivo**

- Interface moderna construída com shadcn/ui
- Suporte completo para dispositivos móveis
- Tema escuro/claro automático

---

## 🏗️ Arquitetura

### Backend (Spring Boot)

```
📦 lmsfilmes/
├── 🔧 config/           # Configurações (CORS, JWT, Security)
├── 🎮 controller/       # REST Controllers
├── 📊 dto/              # Data Transfer Objects
├── 🗃️ model/            # Entities (User, Movie, Serie, Rate)
├── 💾 repository/       # MongoDB Repositories
├── ⚙️ service/          # Business Logic
└── 🐳 Dockerfile        # Container Backend
```

### Frontend (Next.js)

```
📦 frontend/
├── 🎨 src/
│   ├── 📄 app/          # Pages & Layouts (App Router)
│   ├── 🧩 components/   # Components
│   │   ├── 🔐 ui/       # UI Components
│   └── 🖼️ lib/          # API & Service
└── 🐳 Dockerfile        # Container Frontend
```

---

## 🛠️ Stack Tecnológica

### Backend

- **Framework**: Spring Boot 3.0+
- **Database**: MongoDB 7.0+ com Mongo Express
- **Authentication**: JWT (JSON Web Tokens)
- **API Integration**: TMDB API para dados de filmes/séries
- **Containerization**: Docker & Docker Compose

### Frontend

- **Framework**: Next.js 15.5 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **HTTP Client**: Axios
- **State Management**: React Hooks
- **Icons**: Lucide React

### DevOps & Tools

- **Containerization**: Docker (multi-stage builds)
- **Process Management**: Script automatizado Windows
- **Code Quality**: Biome (linting & formatting)
- **Development**: Hot reload & live debugging

---

## 🚀 Instalação

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com/)

### 🐳 Setup com Docker (Recomendado)

1. **Clone o repositório**

```bash
git clone https://github.com/LucasMKS/LMS-Films.git
cd LMS-Films
```

2. **Inicie o ambiente completo**

```bash
# Opção 1: Script automatizado (Windows)
docker-manager.bat

# Opção 2: Docker Compose manual
docker-compose up -d
```

3. **Acesse a aplicação**

- 🌐 **Frontend**: http://localhost:3000
- 🚀 **Backend API**: http://localhost:8080
- 📊 **Mongo Express**: http://localhost:8081

### ⚡ Quick Start

```bash
# Para desenvolvimento rápido
quick-start.bat
```

---

## 📖 Documentação

### 🔗 URLs dos Serviços

| Serviço           | URL                       | Descrição               |
| ----------------- | ------------------------- | ----------------------- |
| **Frontend**      | http://localhost:3000     | Interface do usuário    |
| **Backend API**   | http://localhost:8080     | API REST                |
| **MongoDB**       | mongodb://localhost:27017 | Database principal      |
| **Mongo Express** | http://localhost:8081     | Admin interface MongoDB |

### 🔑 Endpoints Principais

#### Autenticação

- `POST /auth/login` - Login de usuário
- `POST /auth/register` - Registro de usuário

#### Filmes

- `GET /movies` - Listar filmes
- `GET /movies/popular` - Filmes populares
- `GET /movies/now-playing` - Filmes em cartaz
- `GET /movies/top-rated` - Filmes mais votados
- `GET /movies/upcoming` - Próximos lançamentos

#### Séries

- `GET /series` - Listar séries
- `GET /series/popular` - Séries populares
- `GET /series/airing-today` - Séries em exibição
- `GET /series/top-rated` - Séries mais votadas

#### Avaliações

- `POST /ratings` - Criar avaliação
- `GET /ratings/user/{userId}` - Avaliações do usuário
- `PUT /ratings/{id}` - Atualizar avaliação
- `DELETE /ratings/{id}` - Deletar avaliação

### 🐳 Comandos Docker

```bash
# Iniciar stack completo
docker-compose up -d

# Ver logs
docker-compose logs -f

# Rebuild específico
docker-compose build --no-cache frontend
docker-compose build --no-cache backend

# Parar serviços
docker-compose down
```

---

## 🌟 Capturas de Tela

### 🏠 Página Principal

![Landing Page](frontend/src/assets/LMS-BG.png)

### 🎬 Descoberta de Filmes

_Interface moderna para explorar filmes por categoria_

### ⭐ Sistema de Avaliações

_Dashboard personalizado com suas avaliações_

### 🔐 Autenticação

_Design glassmorphism moderno_

---

## 🛣️ Roadmap

### ✅ Concluído

- [x] Sistema de autenticação JWT
- [x] Integração com TMDB API
- [x] CRUD completo de avaliações
- [x] Sistema de favoritos
- [x] Design responsivo com shadcn/ui
- [x] Containerização Docker
- [x] Filtros por categoria
- [x] Interface de administração MongoDB

### 🔄 Em Desenvolvimento

- [ ] Compartilhamento de listas
- [ ] Notificações de novos lançamentos
- [ ] API de estatísticas de usuário

### 🔮 Futuro

- [ ] App mobile React Native
- [ ] Integração com mais APIs de streaming
- [ ] Sistema de amigos e atividades sociais
- [ ] Análise de sentimentos nos reviews
- [ ] Modo offline para listas

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🙏 Agradecimentos

- [The Movie Database (TMDB)](https://www.themoviedb.org/) pelos dados de filmes e séries
- [shadcn/ui](https://ui.shadcn.com/) pelos componentes UI
- [Lucide](https://lucide.dev/) pelos ícones

---

<div align="center">

**⭐ Se este projeto te ajudou, deixe uma estrela!**

![Stars](https://img.shields.io/github/stars/LucasMKS/LMS-Films?style=social)
![Forks](https://img.shields.io/github/forks/LucasMKS/LMS-Films?style=social)

</div>
