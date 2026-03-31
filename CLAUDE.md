# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Backend for AltMess - a real-time messaging application with chat, user management, and WebSocket support.

## Tech Stack

- **Runtime**: Node.js with TypeScript (ESM)
- **Framework**: Fastify 5.x with plugins
- **Database**: PostgreSQL with Prisma ORM
- **WebSocket**: @fastify/websocket for real-time messaging
- **Auth**: JWT-based authentication via @fastify/jwt
- **Package Manager**: pnpm (monorepo with pnpm-workspace)

## Commands

```bash
# Install dependencies
pnpm install

# Development (apps/api)
cd apps/api
pnpm dev                    # Start dev server with hot reload
pnpm start                  # Start production server
pnpm build                  # Compile TypeScript

# Database
pnpm migrate                # Run Prisma migrations
pnpm generate               # Generate Prisma client

# Testing
pnpm test                   # Run test suite

# Docker (from root)
docker-compose -f docker-compose.dev.yaml up -d   # Start PostgreSQL
```

## Architecture

### Monorepo Structure
- `apps/api` - Main Fastify API server
- `packages/*` - Shared packages (if any)

### API Structure (`apps/api/src`)

```
src/
├── server.ts           # Entry point, server configuration
├── app.ts              # Main app setup, Prisma connection, plugin registration
├── plugins/            # Fastify plugins (jwt, websocket)
├── modules/            # Feature modules (auth, user, chat, message)
│   ├── auth/           # JWT auth: /auth/register, /auth/login
│   ├── user/           # User CRUD: /user/me, /user/:id, /user/search
│   ├── chat/           # Chat management + WS: /chat/*, /chat/ws
│   └── message/        # Messages + WS: /message/:chatId, /message/ws/:chatId
├── shared/             # Shared utilities (webSocketService)
└── types/              # TypeScript type declarations
```

### Module Pattern

Each module follows a consistent structure:
- `index.ts` - Module registration with Fastify
- `*.routes.ts` - Route handlers
- `*.service.ts` - Business logic
- `*.schemas.ts` - Zod/validation schemas

### Key Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | No | Register new user |
| POST | /auth/login | No | Login, returns JWT |
| GET | /user/me | Yes | Get current user |
| GET | /user/search?username= | Yes | Search users |
| POST | /chat | Yes | Create chat |
| GET | /chat/ws | Yes | WebSocket for chat list |
| GET | /message/:chatId | Yes | Get messages |
| POST | /message | Yes | Send message |
| GET | /message/ws/:chatId | Yes | WebSocket for messages |

### Database Schema

- **User** - username, password (bcrypt), name, contacts
- **Chat** - title, chatCreatorId, users (M:M), messages
- **Message** - content, chatId, senderId, createdAt
- **Contact** - userId, contactId (user contacts/favorites)

### Environment Variables

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/altmess
JWT_SECRET=your-secret-key
PORT=3000
HOST=0.0.0.0
```

### WebSocket Protocol

Messages are JSON with `type` and `payload`:
- `chats:list` - Subscribe/receive chat list
- `messages:list` - Subscribe/receive messages for a chat
