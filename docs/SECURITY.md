# SECURITY.md

## Purpose

This document defines NutriON security requirements for authentication, authorization, session handling, OTP, user privacy, AI safety, and deployment hardening.

## Security Objectives

- Protect accounts from unauthorized access.
- Protect sensitive user health profile and food log data.
- Prevent token theft from client-side JavaScript.
- Prevent cross-user data access.
- Keep AI recommendations safe and non-medical.
- Ensure admin features are role-restricted and auditable.

## Authentication Strategy

Use Auth.js/NextAuth-style authentication patterns with a custom credentials flow and secure token handling.

Recommended approach:

- Email/password registration and login.
- Passwords hashed with Argon2id preferred, bcrypt acceptable.
- OTP via Brevo is REQUIRED on every login attempt.
- OTP via Brevo is REQUIRED for email verification on registration, and password resets.
- Short-lived access token in an HTTP-only cookie.
- Long-lived refresh token in an HTTP-only cookie.
- Refresh token rotation with database-backed revocation.
- Server-side role checks for admin functionality.

## Cookie Requirements

| Cookie | Purpose | JavaScript Accessible? | Lifetime | Settings |
|---|---|---:|---|---|
| `nutrion_access` | Short-lived access token | No | 10–15 minutes | `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` |
| `nutrion_refresh` | Refresh token | No | 7–30 days | `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/api/auth/refresh` |
| `csrf_token` | CSRF protection if needed | Usually yes | Session | `Secure`, `SameSite=Lax` |

Rules:

- Never store tokens in localStorage or sessionStorage.
- Never expose refresh tokens to client components.
- Use `Secure` cookies in production.
- Use short access token expiration.
- Rotate refresh tokens on every refresh.

## Refresh Token Rotation

Database table: `refresh_tokens`.

Suggested fields:

```txt
id
user_id
token_hash
family_id
expires_at
revoked_at
replaced_by_token_id
created_at
created_by_ip
created_by_user_agent
```

Rules:

- Store only a hash of the refresh token.
- On refresh, revoke the old token and issue a new one.
- If a revoked token is reused, revoke the entire token family.
- On logout, revoke the active refresh token.
- On password reset, revoke all active refresh tokens for the user.

## OTP Security

Use Brevo API to send OTP codes.

Rules:

- Generate a 6-digit random OTP with cryptographic randomness.
- Store only a hash of the OTP.
- Expire OTPs after 5–10 minutes.
- Limit attempts, recommended maximum: 5 attempts per OTP.
- Require OTP verification on *every single login attempt*.
- Rate-limit OTP requests per email and IP.
- Use generic responses: “If the email is valid, a code has been sent.”
- Mark OTPs as consumed after successful use.

Suggested table: `email_otps`.

```txt
id
email
user_id nullable
purpose
code_hash
expires_at
consumed_at
attempt_count
created_at
created_by_ip
```

## Authorization

Roles:

| Role | Access |
|---|---|
| `user` | Own profile, goals, meals, summaries, AI tips, reminders |
| `admin` | Lesson management, usage reports, user lookup, audit views |

Authorization rules:

- Every meal/profile/goal query must filter by authenticated `user_id`.
- Admin routes must verify role server-side.
- Never trust role values sent from the client.
- Use middleware for route protection, but also enforce checks inside API handlers/services.

## Data Privacy

Sensitive data:

- Email address
- Health profile: age, sex, height, weight
- Food logs and eating patterns
- Goals
- AI recommendation context
- OTPs and tokens

Privacy requirements:

- Collect only necessary health data.
- Allow users to update their profile.
- Provide a future path for account deletion and data export.
- Avoid sending unnecessary personal data to Gemini.
- Do not log full tokens, OTPs, passwords, or private health details.

## AI Safety Requirements

Gemini API must be used only for educational nutrition suggestions.

Prompt rules:

- Tell the model not to diagnose diseases.
- Tell the model not to prescribe treatment or medication.
- Tell the model not to recommend extreme diets, fasting, or unsafe calorie restriction.
- Tell the model to provide practical, simple, non-judgmental suggestions.
- Always include a disclaimer in the response.

Example system instruction:

```txt
You are NutriON, an educational nutrition assistant. Provide simple nutrition awareness tips based on the user's meal logs and goals. Do not diagnose medical conditions, prescribe treatment, or replace professional medical advice. Avoid extreme dieting advice. Keep responses short, safe, and practical.
```

## Input Validation

Use Zod schemas for all inputs.

Validate:

- Email format
- Password strength
- OTP format
- Height and weight ranges
- Meal category enum
- Quantity and serving size
- Date ranges
- Lesson title/body length
- Admin report filters

## Rate Limiting

Add rate limits for:

- Login attempts
- OTP requests
- OTP verification attempts
- Password reset requests
- Gemini recommendation generation
- Food search endpoint if abused

Recommended tools:

- `@upstash/ratelimit` with Redis, or
- database-backed rate limiting for simple deployment.

## CSRF Protection

Because authentication uses cookies, protect unsafe methods.

Options:

- SameSite=Lax cookies plus CSRF token for sensitive POST/PATCH/DELETE actions.
- Validate `Origin` and `Referer` headers for mutation requests.
- Prefer server actions with built-in framework protections where appropriate, but still validate authorization.

## Password Rules

Minimum recommended policy:

- At least 8 characters.
- Must not be identical to email or name.
- Use password breach checking later if available.
- Hash passwords with Argon2id or bcrypt.

Never:

- Store plain text passwords.
- Email passwords.
- Log password values.

## Admin Security

Admin features must include:

- Role check.
- Audit log for lesson create/update/delete.
- Audit log for user status changes.
- Confirmation dialog for destructive actions.
- No direct database IDs exposed unnecessarily in public UI.

## Environment Variables

Required secrets:

```env
DATABASE_URL=
AUTH_SECRET=
JWT_ACCESS_SECRET=
REFRESH_TOKEN_SECRET=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=
```

Rules:

- Never prefix secrets with `NEXT_PUBLIC_` unless intentionally public.
- Keep `.env` out of Git.
- Provide `.env.example` without real values.
- Rotate secrets if accidentally exposed.

## Security Test Checklist

Authentication:

- Register works with valid data.
- Duplicate email does not leak sensitive account information.
- Login fails safely with invalid credentials.
- OTP expires correctly.
- OTP cannot be reused.
- Refresh token rotates.
- Reused old refresh token revokes token family.
- Logout revokes refresh token.

Authorization:

- User A cannot read User B profile.
- User A cannot update/delete User B meals.
- Non-admin cannot access `/admin` pages or APIs.

Input validation:

- Invalid height/weight rejected.
- Invalid meal category rejected.
- XSS payloads in notes and lessons are escaped/sanitized.

AI safety:

- Gemini failure shows fallback message.
- AI output includes non-medical disclaimer.
- Prompt does not include unnecessary personal data.

Deployment:

- HTTPS enabled.
- Secure cookies enabled.
- Production build has no debug logs.
- Database backups configured.
