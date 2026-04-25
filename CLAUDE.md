# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start (auto-starts MySQL via docker-compose, then runs NestJS)
pnpm start

# Development with hot reload
pnpm start:dev

# Production build
pnpm build && pnpm start:prod

# Lint
pnpm lint

# Test
pnpm test
```

## Architecture

### Stack
- **Framework**: NestJS (HTTP server)
- **Database**: MySQL 8.0 via Docker (port 3307)
- **ORM**: Prisma 5 (schema in `prisma/schema.prisma`)
- **Auth**: JWT (passport-jwt), bcrypt password hashing
- **Validation**: class-validator with global ValidationPipe

### Module Structure
```
src/
├── main.ts                 # Bootstrap, global prefix /api, ValidationPipe
├── app.module.ts           # Root module: PrismaModule + UserModule
├── prisma/
│   ├── prisma.module.ts    # Global Prisma provider
│   └── prisma.service.ts   # PrismaClient with $connect/$disconnect lifecycle
└── user/
    ├── user.module.ts      # JwtModule (secret in .env, 7d expiry)
    ├── user.controller.ts  # POST /user/register, /user/login
    ├── user.service.ts     # Business logic with Prisma queries
    └── dto/                # RegisterUserDto, LoginUserDto
```

### Database
- Docker container: `backend111_mysql` (mysql:8.0)
- Connection: `mysql://root:root123@localhost:3307/backend111`
- Tables: `users`, `user_tokens` (Prisma-managed, run `npx prisma db push` after schema changes)

### API Prefix
All routes prefixed with `/api` via `app.setGlobalPrefix('api')`.
- `POST /api/user/register`
- `POST /api/user/login`
