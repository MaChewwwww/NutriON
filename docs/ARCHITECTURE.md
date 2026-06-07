# ARCHITECTURE.md

## Purpose

This document defines the target technical architecture for NutriON so an AI agent can reason about modules, responsibilities, boundaries, data flow, and deployment.

## Architecture Style

NutriON should start as a modular monolith using Next.js App Router. This is simpler for a student/client project while still allowing clean separation of concerns. The codebase should be organized by domain modules so it can later be split into services if needed.

## High-Level Architecture

```txt
[User Browser / PWA]
        |
        | HTTPS
        v
[Next.js App Router]
  |-- Server Components
  |-- Client Components
  |-- Route Handlers
  |-- Server Actions
        |
        | Internal service calls
        v
[Application Services]
  |-- Auth Service
  |-- User/Profile Service
  |-- Meal Logging Service
  |-- Food Search Service
  |-- Nutrition Summary Service
  |-- AI Recommendation Service
  |-- Lesson Service
  |-- Notification/OTP Service
  |-- Admin Report Service
        |
        v
[Drizzle ORM]
        |
        v
[MySQL Database]

External Services:
- Brevo API for OTP and transactional email
- Gemini API for AI nutrition recommendations
```

## Runtime Components

| Component | Responsibility |
|---|---|
| Next.js Frontend | Pages, layouts, forms, mobile-first UI, PWA shell |
| Next.js Route Handlers | API endpoints, auth flows, webhook-like service endpoints |
| Server Actions | Safe server-side mutations from forms where appropriate |
| Drizzle ORM | Type-safe database queries and migrations |
| MySQL | Persistent relational data storage |
| Auth Module | Login, registration, OTP, token refresh, logout, role guards |
| Brevo Module | OTP and transactional email delivery |
| Gemini Module | AI recommendation generation |
| Docker | Local development and production packaging |

## Recommended Domain Modules

```txt
src/server/modules/
  auth/
    auth.service.ts
    auth.repository.ts
    token.service.ts
    otp.service.ts
    password.service.ts
  users/
    user.service.ts
    user.repository.ts
  profiles/
    profile.service.ts
    profile.repository.ts
  goals/
    goal.service.ts
    goal.repository.ts
  meals/
    meal.service.ts
    meal.repository.ts
  foods/
    food.service.ts
    food.repository.ts
  summaries/
    summary.service.ts
  ai/
    recommendation.service.ts
    prompt-builder.ts
    safety.ts
  lessons/
    lesson.service.ts
    lesson.repository.ts
  notifications/
    reminder.service.ts
    email.service.ts
  admin/
    reports.service.ts
```

## Data Model Overview

### Core Tables

| Table | Purpose |
|---|---|
| `users` | Stores registered user accounts |
| `accounts` | Optional Auth.js-compatible account records |
| `sessions` | Optional database sessions |
| `refresh_tokens` | Hashed refresh tokens and rotation metadata |
| `email_otps` | Hashed OTP codes with expiration and attempt count |
| `health_profiles` | Age, sex, height, weight, activity level |
| `nutrition_goals` | User selected nutrition/fitness goal |
| `foods` | Searchable food database |
| `meal_logs` | Meal-level log records |
| `meal_log_items` | Food items inside each meal log |
| `daily_summaries` | Optional cached daily totals |
| `ai_recommendations` | Generated AI tips and prompt metadata |
| `nutrition_lessons` | Admin-managed educational content |
| `reminder_settings` | User meal reminder preferences |
| `notification_logs` | Sent reminders and OTP email logs |
| `usage_events` | Product analytics and admin reports |
| `audit_logs` | Security and admin activity trail |

## Suggested Entity Relationships

```txt
users 1---1 health_profiles
users 1---many nutrition_goals
users 1---many meal_logs
meal_logs 1---many meal_log_items
foods 1---many meal_log_items
users 1---many ai_recommendations
users 1---many reminder_settings
users 1---many refresh_tokens
users 1---many email_otps
users 1---many usage_events
```

## Request Flow: Login with Refresh Token

```txt
1. User submits email and password.
2. Server validates request body with Zod.
3. Server checks rate limit.
4. Server finds user by email.
5. Server verifies password hash.
6. Server optionally requires OTP if account is new or suspicious.
7. Server creates short-lived access token.
8. Server creates refresh token, hashes it, and stores it in MySQL.
9. Server sets both tokens as HTTP-only cookies.
10. User is redirected to dashboard.
```

## Request Flow: Refresh Session

```txt
1. Browser sends refresh cookie to `/api/auth/refresh`.
2. Server hashes/verifies refresh token against database record.
3. Server checks expiration, revocation, and token family reuse.
4. Server revokes the old refresh token.
5. Server issues a new refresh token and a new access token.
6. Server updates HTTP-only cookies.
```

## Request Flow: Meal Logging

```txt
1. User opens `/meals/new`.
2. User searches food items using `/api/foods/search`.
3. User selects food item and quantity.
4. Client shows estimated calories.
5. User submits meal.
6. Server validates input and ownership.
7. Server saves `meal_logs` and `meal_log_items`.
8. Server recalculates or invalidates daily summary cache.
9. Dashboard displays updated totals.
```

## Request Flow: AI Recommendation

```txt
1. User requests AI nutrition tip or dashboard loads latest tip.
2. Server retrieves user profile, goal, and recent meal summaries.
3. Server builds a bounded Gemini prompt.
4. Server sends only necessary context to Gemini.
5. Server validates and sanitizes response.
6. Server stores recommendation in `ai_recommendations`.
7. Server displays the tip with safety disclaimer.
```

## API Boundary Rules

- Client components should not directly access Drizzle or environment secrets.
- All database operations must go through repositories/services.
- All request payloads must be validated with Zod.
- All mutations must verify authenticated user and ownership.
- Admin endpoints must verify `role = admin`.
- Gemini and Brevo calls must run server-side only.

## Recommended API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/verify-otp` | POST | Verify email OTP |
| `/api/auth/refresh` | POST | Rotate refresh token |
| `/api/auth/logout` | POST | Revoke session |
| `/api/profile` | GET/PATCH | Read/update health profile |
| `/api/goals` | GET/POST/PATCH | Manage nutrition goals |
| `/api/foods/search` | GET | Search food database |
| `/api/meals` | GET/POST | List/create meal logs |
| `/api/meals/[id]` | GET/PATCH/DELETE | Read/update/delete meal log |
| `/api/summaries/daily` | GET | Daily nutrition summary |
| `/api/ai/recommendations` | GET/POST | List/generate AI tips |
| `/api/lessons` | GET | Published lessons |
| `/api/admin/lessons` | CRUD | Admin lesson management |
| `/api/admin/reports` | GET | Usage reports |

## Deployment Architecture

```txt
[Docker Container: Next.js App]
        |
        v
[Docker/Managed MySQL]
        |
        +--> persistent volume or managed DB backups

External:
- Brevo transactional email API
- Gemini API
```

## Local Development Architecture

Use Docker Compose for MySQL and optionally run the Next.js app locally.

```txt
localhost:3000 -> Next.js dev server
localhost:3306 -> MySQL container
```

## Production Notes

- Use HTTPS only.
- Set secure cookies in production.
- Use managed MySQL if possible for backups and availability.
- Use environment variables for all secrets.
- Run migrations during deployment with controlled scripts.
- Enable database backups.
- Keep Gemini and Brevo keys restricted and rotated if exposed.

## Scalability Path

Start with modular monolith. If the app grows, split these first:

1. AI Recommendation Worker: for expensive Gemini calls.
2. Notification Worker: for scheduled reminders and email sending.
3. Food Database/Search Service: if food search becomes large.
4. Analytics/Reports Module: if admin reports become slow.
