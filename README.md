# 🎬 LMS Films

<div align="center">

<!-- ![LMS Films Logo](frontend/src/assets/logo.png) -->

**Sua plataforma definitiva para descobrir, avaliar e organizar os filmes e séries que você ama.**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.0+-6DB33F?style=flat-square&logo=spring&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Messaging-FF6600?style=flat-square&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Redis](https://img.shields.io/badge/Redis-Caching-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

[📋 Funcionalidades](#-recursos-em-destaque) • [🏗️ Arquitetura](#-arquitetura-e-tecnologias) • [📸 Interface](#-telas-da-aplicação) • [🚀 Como Executar](#-como-executar-o-projeto)

</div>

---

## 📋 Sobre a Plataforma

O **LMS Films** é uma aplicação web full-stack desenvolvida para ser o hub central do entretenimento do usuário. Integrada em tempo real com a base de dados global do **TMDB (The Movie Database)**, a plataforma vai além de um simples catálogo: ela permite que você crie sua própria biblioteca digital, avalie obras e decida o que assistir a seguir de forma interativa.

### ✨ Recursos em Destaque

🌍 **Exploração de Catálogo Ilimitada**
- Navegue por categorias dinâmicas: Populares, Em Cartaz, Mais Votados e Lançamentos.
- Busca inteligente e rápida por títulos de filmes e séries com dados ricos (sinopse, trailers oficiais, elenco e onde assistir).

⭐ **Sistema de Diário e Avaliação**
- Deixe sua nota (1 a 10) e críticas pessoais sobre os títulos que já assistiu.
- Dashboard consolidado com estatísticas do seu perfil (média de notas, total de horas assistidas, etc).

❤️ **Coleção de Favoritos**
- Salve instantaneamente suas obras preferidas em uma estante virtual personalizada.

🎲 **Watchlist Interativa com "Roleta"**
- Guarde filmes e séries para assistir mais tarde em uma lista dedicada.
- Está na dúvida do que assistir? Use o recurso de **Roleta Aleatória**, onde o sistema sorteia um título da sua Watchlist com animações imersivas para decidir a sua próxima sessão pipoca.
- Ao marcar um título como "Visto", ele é automaticamente removido da Watchlist.

---
<!--
## 📸 Telas da Aplicação

*(Adicione aqui os links das suas imagens)*

| 🏠 Página Principal | 🎬 Descoberta e Catálogo |
| :---: | :---: |
 | ![Home](frontend/src/assets/LMS-BG.png) | *[Adicione print do catálogo]* | 

| 🎲 Watchlist e Roleta | ⭐ Avaliações Pessoais |
| :---: | :---: |
| *[Adicione print da Roleta]* | *[Adicione print do Dashboard de notas]* |

---
-->

## 🏗️ Arquitetura e Tecnologias

O projeto foi desenhado sob uma arquitetura robusta de **Microsserviços**, focando em alta disponibilidade, performance e separação de domínios (Domain-Driven Design).

### 🖥️ Frontend (Client-Side)
Construído para ser extremamente rápido, reativo e otimizado (SEO).
- **Next.js 15.5 (App Router)** com **TypeScript**.
- **React Query** para gerenciamento avançado de estado assíncrono, cache de requisições e *Optimistic Updates* (atualizações instantâneas na UI).
- Interface moderna estilizada com **Tailwind CSS** e **radix-ui**.

### ⚙️ Backend (Server-Side)
Ecossistema distribuído em **Spring Boot 3+**, protegido por JWT e orquestrado por um API Gateway.
- **Service Discovery & Gateway:** Roteamento dinâmico utilizando *Spring Cloud Gateway* e *Eureka Server*.
- **Microsserviços de Domínio:**
  - `lms-filmes`: Gerencia usuários e comunicação com o TMDB.
  - `lms-rating`: Isola a lógica de avaliações e notas.
  - `lms-favorite`: Gerencia listas pessoais (Favoritos e Watchlist).
  - `lms-email`: Serviço assíncrono para notificações e recuperação de senha.
- **Mensageria (RabbitMQ):** Comunicação entre serviços (ex: disparo de e-mail de boas-vindas ao registrar).
- **Caching (Redis):** Otimização de consultas repetitivas ao banco de dados para extrema velocidade.
- **Banco de Dados (MongoDB):** Armazenamento NoSQL de alta performance, utilizando *Compound Indexes* para integridade de dados.

---

## 🚀 Como Executar o Projeto

Todo o ecossistema da aplicação foi conteinerizado para facilitar a execução. Você não precisa instalar Java, Node ou Bancos de Dados localmente, apenas o **Docker**.

### Pré-requisitos
- [Docker](https://www.docker.com/products/docker-desktop) e Docker Compose instalados.
- [Git](https://git-scm.com/)
- Uma chave de API gratuita do [TMDB](https://www.themoviedb.org/documentation/api).

### Passo a Passo

**1. Clone o repositório**
```bash
git clone [https://github.com/LucasMKS/LMS-Films.git](https://github.com/LucasMKS/LMS-Films.git)
cd LMS-Films
```

**2. Configure as Variáveis de Ambiente**
Na raiz do projeto (e/ou nas pastas específicas, se houver), localize o arquivo .example.env.
Renomeie-o para .env e insira suas credenciais, especialmente a chave do TMDB:

```bash
TMDB_API_KEY=sua_chave_aqui_12345
```

**3. Inicie os Contêineres**
Execute o comando abaixo na raiz do projeto para construir e subir toda a infraestrutura (Bancos de dados, RabbitMQ, Redis, Microsserviços e Frontend):

```Bash
docker-compose up -d --build
(Nota: A primeira execução pode levar alguns minutos enquanto o Docker baixa as imagens e o Maven compila os microsserviços).
```

**4. Acesse a Aplicação**
Tudo pronto! Seus serviços estarão rodando nestas portas:

🌐 Plataforma (Frontend): http://localhost:3000

🚀 API Gateway (Backend): http://localhost:8080

📊 Painel MongoDB (Mongo Express): http://localhost:8081

## 🛣️ Roadmap e Próximos Passos
[x] Integração completa com TMDB API.

[x] Autenticação segura com JWT.

[x] Separação de Backend em Microsserviços.

[x] Implementação de Cache com Redis.

[x] Watchlist com algoritmo de Roleta Aleatória.

[ ] Compartilhamento público de listas de filmes entre usuários.

[ ] Notificações via WebSocket para novos episódios de séries favoritas.

[ ] Responsividade aprimorada para Progressive Web App (PWA).

## **📄 Licença**
Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

<div align="center">
<b>Desenvolvido com dedicação por Lucas Marques.</b>



Se este projeto te inspirou, não esqueça de deixar uma ⭐!
</div>
