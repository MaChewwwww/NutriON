# IMPLEMENTATION_PLAN.md

## Purpose

This document gives the AI agent a sprint-by-sprint implementation plan for building NutriON using Next.js, Drizzle ORM, MySQL, TailwindCSS, shadcn/ui, Axios, Docker, Auth.js/NextAuth-style authentication, Brevo OTP email, and Gemini API.

# NutriON Project Context

NutriON is an AI-based nutrition tracking and recommendation application for students and health-conscious users. The system helps users register, build a personal health profile, log meals, search foods, estimate calories, review nutrition history, receive AI-based nutrition tips, read nutrition lessons, view progress charts, and receive meal logging reminders.

## Primary Product Backlog Mapping

| ID | Capability | Sprint |
|---|---|---|
| PS001 | User registration with email/password | Sprint 1 |
| PS002 | User login and dashboard access | Sprint 1 |
| PS003 | Personal health profile: age, height, weight, gender | Sprint 2 |
| PS004 | Nutrition/fitness goals: weight loss, maintenance, weight gain | Sprint 3 |
| PS005 | Daily food intake logging by meal category | Sprint 3 |
| PS006 | Automatic calorie estimation | Sprint 4 |
| PS007 | Food search | Sprint 4 |
| PS008 | Daily nutrition summary | Sprint 5 |
| PS009 | Meal history and past nutrition records | Sprint 5 |
| PS010 | AI-based nutrition tips | Sprint 6 |
| PS011 | Admin-managed nutrition lessons | Sprint 6 |
| PS012 | Nutrition progress charts | Sprint 7 |
| PS013 | Meal reminder notifications | Sprint 7 |
| PS014 | Admin system usage reports | Sprint 7 |
| PS015 | QA testing, bug fixing, and final validation | Sprint 8 |

## Product Constraints

- The application gives nutrition guidance only and must not replace professional medical advice.
- User health data, food logs, email, OTPs, and authentication tokens are sensitive and must be protected.
- The initial implementation should be fully responsive for the web.
- AI recommendations must be explainable, safe, simple, and based only on user-provided logs/profile data.

## Implementation Principles

1. Build vertical slices, not isolated screens. Each sprint should include UI, API route/server action, database schema, validation, tests, and documentation.
2. Keep health and nutrition recommendations as educational guidance only.
3. Store all sensitive data server-side or in secure HTTP-only cookies.
4. Avoid localStorage for tokens, OTPs, user health data, or nutrition logs.
5. Every user story must map to a route, component, schema/table, API behavior, validation rule, and test case.

## Milestone 0: Project Setup [COMPLETED]

### Goals

- Initialize the Next.js project.
- Configure TypeScript, TailwindCSS, shadcn/ui, Drizzle, MySQL, Docker, linting, formatting, and environment variables.

### Tasks

- [x] Create Next.js App Router project.
- [x] Install and configure TailwindCSS and shadcn/ui.
- [x] Add all shadcn/ui components for fast AI-agent prototyping.
- [x] Add Drizzle ORM and Drizzle Kit.
- [x] Add MySQL database using Docker Compose.
- [x] Add environment variable validation using `zod`.
- [x] Add base folder structure.
- [x] Add seed script for food items, nutrition lessons, and admin user.
- [x] Add CI workflow for lint, typecheck, test, and build.

### Done When

- `npm run dev` starts the app.
- `docker compose up -d` starts MySQL.
- `npm run db:generate` and `npm run db:migrate` work.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.

## Milestone 1: Authentication and Account Access — PS001, PS002 [COMPLETED]

### Goals

- Allow users to register, verify login with OTP when needed, log in, refresh sessions, and log out securely.

### Tasks

- [x] Create `users`, `refresh_tokens`, and `email_otps` tables in MySQL database.
- [x] Implement email/password registration.
- [x] Hash passwords with Argon2id (using `argon2` library).
- [x] Implement login and check for mandatory OTP code generation.
- [x] Implement Brevo email OTP gateway delivery.
- [x] Implement refresh token rotation.
- [x] Store refresh token in secure HTTP-only cookie (`nutrion_refresh`).
- [x] Store short-lived access token in secure HTTP-only cookie (`nutrion_access`).
- [x] Add logout endpoint that revokes refresh token.
- [x] Add endpoint `/api/auth/resend-otp` for resending OTPs with active countdown timers.
- [x] Add auth UI: register, login, and segmented OTP verification.

### Suggested Routes

| Route | Purpose |
|---|---|
| `/register` | Account creation |
| `/login` | Login |
| `/verify-otp` | OTP verification |
| `/forgot-password` | Request reset OTP/link |
| `/reset-password` | Reset password |
| `/dashboard` | Authenticated user dashboard |
| `/api/auth/register` | Register API |
| `/api/auth/login` | Login API |
| `/api/auth/refresh` | Rotate refresh token and issue new access token |
| `/api/auth/logout` | Revoke current session |

### Done When

- Users can register, verify OTP to auto-login, trigger OTP on every login, access dashboard, refresh session, and log out.
- Invalid credentials and invalid OTPs return safe generic messages.
- Cookies are `HttpOnly`, `Secure` in production, `SameSite=Lax` or stricter, and short-lived where appropriate.

## Milestone 2: Personal Health Profile — PS003

### Goals

- Allow users to create and update basic health profile data.

### Tasks

- Create `health_profiles` table.
- Add fields: `user_id`, `age`, `sex`, `height_cm`, `weight_kg`, `activity_level`, `dietary_notes`, `created_at`, `updated_at`.
- Add validation using Zod.
- Add profile setup page after first login.
- Add profile edit page.
- Add audit logging for profile updates.

### Done When

- New users are prompted to complete profile setup.
- Profile data is validated before saving.
- Users can update their own profile only.

## Milestone 3: Goals and Meal Logging — PS004, PS005

### Goals

- Allow users to define goals and log daily meals.

### Tasks

- Create `nutrition_goals`, `meal_logs`, and `meal_log_items` tables.
- Add goal types: `lose_weight`, `maintain`, `gain_weight`, `balanced_diet`.
- Add meal categories: `breakfast`, `lunch`, `dinner`, `snack`.
- Build add/edit/delete food log flow.
- Add date picker and meal category selector.
- Add server-side ownership checks for every mutation.

### Done When

- Users can create/update goals.
- Users can add, edit, and delete meal entries.
- Meal logs are tied to authenticated user ID.

## Milestone 4: Food Search and Calorie Estimation — PS006, PS007

### Goals

- Allow users to search food items and estimate calories using a local database and a external API fallback.

### Tasks

- [x] Create `foods` table with nutrition fields per serving (in MySQL schema).
- [ ] Implement search endpoint with MySQL `LIKE %query%` lookup.
- [ ] Integrate USDA FoodData Central API as a search fallback when local results are insufficient.
- [ ] Implement USDA response parser to automatically cache returned items in the local `foods` table.
- [ ] Add optional Gemini-assisted food normalization (unstructured text parser) to extract structured food items from sentences.
- [ ] Calculate calories based on portion multiplier and serving size.

### Done When

- Users can search foods by name with low latency (<100ms for cached/local, rate-limited fallback to USDA).
- USDA food results are successfully cached locally.
- Daily totals update automatically upon saving.

## Milestone 5: Dashboard, Summary, and History — PS008, PS009

### Goals

- Display daily totals and historical meal records.

### Tasks

- Create dashboard summary cards.
- Add daily calorie total, meal count, protein/carbs/fat totals if available.
- Add meal history page with filters by date range and meal type.
- Add reusable chart components using Recharts.
- Add empty states and loading skeletons.

### Done When

- Users can see today's nutrition summary.
- Users can browse previous meal logs chronologically.
- Dashboard data belongs only to the authenticated user.

## Milestone 6: AI Nutrition Tips and Lessons — PS010, PS011

### Goals

- Generate safe AI-based nutrition tips and allow admins to manage educational lessons.

### Tasks

- [x] Create `ai_recommendations` and `nutrition_lessons` tables (in MySQL schema).
- [ ] Add Gemini API service wrapper.
- [ ] Implement query boundaries: Only call Gemini when requested by the dashboard (max once daily or manual trigger) to limit usage.
- [ ] Add prompt guardrails that prevent diagnosis, medical prescriptions, or unsafe dieting instructions.
- [ ] Store AI recommendation outputs for history and review.
- [ ] Build admin CRUD for nutrition lessons.
- [ ] Build user lesson browsing UI.

### Done When

- AI tips are generated from user logs, profile, and goal.
- AI tips include a disclaimer that they are educational and not medical advice.
- Admins can add, edit, publish, unpublish, and delete lessons.

## Milestone 7: Progress Tracking, Reminders, and Admin Reports — PS012, PS013, PS014

### Goals

- Add progress charts, meal reminder notifications, and usage reporting.

### Tasks

- Create `reminder_settings`, `notification_logs`, and `usage_events` tables.
- Add chart pages for calorie trends and meal consistency.
- Implement reminder preferences.
- For PWA reminders, use browser notifications where supported.
- For email reminders, use Brevo transactional email.
- Add admin reports for active users, meal logs created, AI tips generated, and lesson engagement.

### Done When

- Users can enable/disable reminders.
- Users can view calorie trends over time.
- Admins can view system usage reports.

## Milestone 8: QA, Hardening, and Deployment — PS015

### Goals

- Prepare the system for deployment and final demonstration.

### Tasks

- Complete unit, integration, and E2E tests.
- Run database migration checks.
- Verify access control across users and admin roles.
- Test OTP expiration, refresh token rotation, and logout revocation.
- Test Gemini API failure handling.
- Add Docker production build.
- Add deployment documentation.
- Add user guide and admin guide.

### Done When

- All tests pass.
- Final build succeeds.
- Security checklist is completed.
- Demo account and seed data are available.

## Recommended Folder Structure

```txt
src/
  app/
    (auth)/
    (dashboard)/
    admin/
    api/
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
    utils/
  server/
    services/
    repositories/
    actions/
  types/
  tests/
```

## Agent Rules

- Do not create features without mapping them to a backlog ID when possible.
- Do not bypass server-side validation.
- Do not expose tokens to client JavaScript.
- Do not put Gemini API keys, Brevo API keys, or database credentials in client components.
- Do not treat AI tips as medical advice.
