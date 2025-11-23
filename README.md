# Prompt Management SaaS

A modern prompt management platform built with Next.js, NestJS, and PostgreSQL.

## Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Backend**: NestJS 10
- **Database**: PostgreSQL with Prisma
- **Monorepo**: Turborepo

## Project Structure

```
prompt-manage/
├── apps/
│   ├── api/          # NestJS backend API
│   └── web/          # Next.js frontend
├── packages/
│   ├── database/     # Prisma schema and client
│   ├── logger/       # Logging utilities
│   ├── schemas/      # Zod schemas
│   └── utils/        # Shared utilities
```

## Getting Started

### Prerequisites

- Node.js >= 20
- Docker and Docker Compose (for database)
- npm 9.6.7

### Installation

```bash
# Install dependencies
npm install

# Start PostgreSQL database with Docker
docker-compose up -d

# Set up environment variables
cp .env.example .env
# Edit .env if needed (default values should work)

# Generate Prisma client
npm run db:generate
```

### Database Setup with Docker

```bash
# Start PostgreSQL container
docker-compose up -d

# Check if database is running
docker-compose ps

# View database logs
docker-compose logs postgres

# Stop database
docker-compose down

# Stop and remove all data (⚠️ deletes data)
docker-compose down -v
```

### Development

```bash
# Start all apps in development mode
npm run dev

# Start only API
cd apps/api && npm run dev

# Start only Web
cd apps/web && npm run dev
```

### Database

```bash
# Make sure Docker PostgreSQL is running
docker-compose up -d

# Pull database schema (if database already has tables)
npm run db:pull

# Generate Prisma client
npm run db:generate

# Create and run migrations
npx prisma migrate dev

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Scripts

- `npm run dev` - Start all apps in development
- `npm run build` - Build all apps
- `npm run lint` - Lint all apps
- `npm run typecheck` - Type check all apps
- `npm run test` - Run tests
- `npm run db:generate` - Generate Prisma client

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

The `.env` file includes:

```env
# Database (Docker PostgreSQL)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=prompt_manage
POSTGRES_PORT=3690
DATABASE_URL="postgresql://postgres:postgres@localhost:3690/prompt_manage"

# API
PORT=3001
FRONTEND_URL=http://localhost:3000

# Other configs...
```

**Note:** Default values work for local development. Change passwords and secrets for production!

## Next Steps

1. Set up your database schema in `packages/database/prisma/schema.prisma`
2. Create your first module in `apps/api/src/`
3. Build your frontend pages in `apps/web/src/app/`

## License

UNLICENSED
