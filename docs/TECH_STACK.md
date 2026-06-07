# TECH_STACK.md

## Purpose

This document defines the recommended NutriON technology stack, installation commands, scripts, environment variables, and project conventions for the AI agent.

## Core Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js App Router | Full-stack React application and API routes |
| Language | TypeScript | Type safety |
| Styling | TailwindCSS | Utility-first styling |
| UI Components | shadcn/ui | Accessible reusable components |
| ORM | Drizzle ORM | Type-safe MySQL queries and migrations |
| Database | MySQL | Relational storage |
| HTTP Client | Axios | Client/server HTTP requests when needed |
| Auth | Auth.js/NextAuth-style custom credentials flow | Authentication/session patterns |
| Email/OTP | Brevo API | Transactional email and OTP delivery |
| AI | Gemini API | AI nutrition tips and food-log analysis |
| Charts | Recharts | Dashboard and progress charts |
| Validation | Zod | Runtime schema validation |
| Forms | React Hook Form + Zod Resolver | Typed form validation |
| Password Hashing | Argon2id or bcrypt | Secure password storage |
| Icons | lucide-react | UI icons |
| Notifications | sonner | Toast notifications |
| Containerization | Docker + Docker Compose | Local/prod packaging |
| Testing | Vitest, Testing Library, Playwright | Unit, component, and E2E tests |
| Lint/Format | ESLint, Prettier | Code quality |

## Project Creation

```bash
npx create-next-app@latest nutrion   --typescript   --tailwind   --eslint   --app   --src-dir   --import-alias "@/*"

cd nutrion
```

## Install Dependencies

```bash
npm install drizzle-orm mysql2 zod axios
npm install react-hook-form @hookform/resolvers
npm install next-auth @auth/drizzle-adapter
npm install @google/generative-ai
npm install @getbrevo/brevo
npm install argon2 jose
npm install recharts lucide-react sonner date-fns
npm install clsx tailwind-merge class-variance-authority
```

## Install Dev Dependencies

```bash
npm install -D drizzle-kit vitest @vitejs/plugin-react jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D playwright prettier eslint-config-prettier
npm install -D dotenv tsx
```

## shadcn/ui Setup

Initialize shadcn/ui:

```bash
npx shadcn@latest init
```

Add all available shadcn/ui components:

```bash
npx shadcn@latest add --all --yes
```

If the `--all` flag changes in the future, check the shadcn CLI help:

```bash
npx shadcn@latest add --help
```

## Recommended shadcn/ui Components for NutriON

The full install is recommended for AI-agent speed, but these components are especially important:

```bash
npx shadcn@latest add accordion alert alert-dialog avatar badge button calendar card chart checkbox command dialog drawer dropdown-menu form input input-otp label navigation-menu popover progress radio-group select separator sheet skeleton sonner switch table tabs textarea toast tooltip --yes
```

## Drizzle Setup

Create `drizzle.config.ts`:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Recommended scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/db/seed.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

## Docker Compose for Local Development

Create `docker-compose.yml`:

```yaml
services:
  mysql:
    image: mysql:8.4
    container_name: nutrion_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: nutrion_db
      MYSQL_USER: nutrion_user
      MYSQL_PASSWORD: nutrion_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

volumes:
  mysql_data:
```

Start database:

```bash
docker compose up -d
```

## Production Dockerfile

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

Set `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

## Environment Variables

Create `.env.example`:

```env
# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=mysql://nutrion_user:nutrion_password@localhost:3306/nutrion_db

# Auth
AUTH_SECRET=replace-with-random-secret
JWT_ACCESS_SECRET=replace-with-random-secret
REFRESH_TOKEN_SECRET=replace-with-random-secret
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=30

# Brevo
BREVO_API_KEY=replace-with-brevo-api-key
BREVO_SENDER_EMAIL=no-reply@example.com
BREVO_SENDER_NAME=NutriON

# Gemini
GEMINI_API_KEY=replace-with-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
```

## Recommended Folder Structure

```txt
src/
  app/
    (auth)/
      login/
      register/
      verify-otp/
    (dashboard)/
      dashboard/
      meals/
      history/
      progress/
      lessons/
      profile/
    admin/
      lessons/
      reports/
      users/
    api/
      auth/
      profile/
      goals/
      foods/
      meals/
      summaries/
      ai/
      admin/
  components/
    ui/
    forms/
    layout/
    charts/
    nutrition/
  db/
    schema/
    migrations/
    seed.ts
    index.ts
  lib/
    auth/
    brevo/
    gemini/
    validators/
    security/
    utils.ts
  server/
    modules/
    repositories/
    services/
  tests/
```

## Database Schema Files

Recommended schema split:

```txt
src/db/schema/
  index.ts
  users.ts
  auth.ts
  profiles.ts
  goals.ts
  foods.ts
  meals.ts
  ai.ts
  lessons.ts
  notifications.ts
  admin.ts
  audit.ts
```

## Additional Recommended Packages

### Security and Server Utilities

```bash
npm install nanoid cookie csrf
npm install @upstash/redis @upstash/ratelimit
```

Use Upstash only if Redis-based rate limiting is desired. Otherwise, implement database-backed rate limiting for simplicity.

### PWA Support

```bash
npm install next-pwa
```

Use PWA support if the client wants an app-like mobile install experience.

### Optional Food Data Source

Start with a seeded internal food database. Later, integrate a third-party food database API if the project scope allows it.

## AI Integration: Gemini API

Recommended use cases:

- Generate short nutrition tips from recent logs.
- Summarize eating patterns.
- Normalize simple free-text food entries.

Do not use Gemini for:

- Medical diagnosis.
- Treatment plans.
- Unsafe dieting plans.
- Emergency health advice.

## Brevo Integration

Recommended use cases:

- Registration OTP.
- Forgot password OTP.
- Meal reminder emails if browser notifications are not enough.

Do not send:

- Passwords.
- Raw tokens.
- Sensitive health summaries unless explicitly required and consented.

## Axios Usage Rules

Use Axios mainly in client components that need browser-side calls. Prefer server actions or direct server-side service calls when possible.

Create a shared Axios client:

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  withCredentials: true,
});
```

## Testing Stack

| Test Type | Tool | Target |
|---|---|---|
| Unit tests | Vitest | Services, validators, utilities |
| Component tests | Testing Library | Forms and UI states |
| Integration tests | Vitest + test DB | Repositories and APIs |
| E2E tests | Playwright | Login, meal logging, dashboard, admin lessons |

## CI Checklist

Every pull request should run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Optional:

```bash
npm run test:e2e
```

## Agent Dependency Rules

- Prefer stable, widely used packages.
- Do not introduce a new package if native Next.js, React, or existing utilities can solve the problem.
- Keep all API keys server-side.
- Keep all database access inside server modules.
- Use Zod validation at every API boundary.
- Use Drizzle migrations for schema changes.
