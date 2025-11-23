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
- PostgreSQL database
- npm 9.6.7

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and other configs
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
# Pull database schema
npm run db:pull

# Generate Prisma client
npm run db:generate

# Run migrations (when you add them)
npx prisma migrate dev
```

## Scripts

- `npm run dev` - Start all apps in development
- `npm run build` - Build all apps
- `npm run lint` - Lint all apps
- `npm run typecheck` - Type check all apps
- `npm run test` - Run tests
- `npm run db:generate` - Generate Prisma client

## Environment Variables

Create a `.env` file in the root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/prompt_manage"

# API
PORT=3001
FRONTEND_URL=http://localhost:3000

# Add other environment variables as needed
```

## Next Steps

1. Set up your database schema in `packages/database/prisma/schema.prisma`
2. Create your first module in `apps/api/src/`
3. Build your frontend pages in `apps/web/src/app/`

## License

UNLICENSED
