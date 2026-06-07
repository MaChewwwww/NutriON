# DESIGN.md

## Purpose

This document defines the visual direction, UX rules, page layout, and reusable interface patterns for NutriON. The design should be mobile-first because the project concept is a nutrition tracking mobile application, while the implementation uses Next.js as a responsive PWA/web application.

## Design Goals

- Make food logging fast and simple.
- Make nutrition data understandable for non-technical users.
- Use a calm, healthy, student-friendly visual style.
- Prioritize daily actions: log meal, view calories, read tips, check progress.
- Avoid medical-looking UI that could imply diagnosis or clinical treatment.

## Brand Direction

### Personality

NutriON should feel:

- Friendly
- Clean
- Encouraging
- Light
- Trustworthy
- Practical

### Suggested Color Tokens

Use these as Tailwind CSS variables or shadcn theme tokens.

```css
:root {
  --background: 42 33% 97%;       /* warm off-white */
  --foreground: 145 20% 15%;      /* deep green text */
  --card: 0 0% 100%;
  --card-foreground: 145 20% 15%;
  --primary: 142 36% 32%;         /* nutrition green */
  --primary-foreground: 0 0% 100%;
  --secondary: 82 35% 88%;        /* soft lime */
  --secondary-foreground: 145 20% 15%;
  --accent: 28 69% 62%;           /* warm orange */
  --accent-foreground: 145 20% 15%;
  --muted: 90 18% 92%;
  --muted-foreground: 145 10% 40%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
  --border: 120 16% 86%;
  --input: 120 16% 86%;
  --ring: 142 36% 32%;
  --radius: 1rem;
}
```

### Visual Style (Glassmorphism & Depth)

- **Glassmorphic Cards**: Use semi-transparent backgrounds with backdrop blur (e.g., `bg-background/80 backdrop-blur-xl`).
- **Gradients**: Use vibrant gradients for primary buttons and main headings (`bg-gradient-to-r from-primary to-emerald-500`).
- **Diffused Shadows**: Replace harsh black shadows with soft, tinted shadows (e.g., `shadow-xl shadow-primary/10`).
- **Micro-animations**: Buttons must depress on click (`active:scale-95`). Cards should float smoothly on hover.
- **Bento Grid**: Use interlocking, varying-sized cards for dashboards instead of a simple vertical stack.

## Typography

Recommended font stack:

```ts
font-family: Inter, Geist, system-ui, sans-serif;
```

### Type Scale

| Use | Size | Weight |
|---|---:|---:|
| Page title | 24–32px | 700 |
| Section heading | 18–22px | 600 |
| Card title | 16–18px | 600 |
| Body text | 14–16px | 400 |
| Caption/helper text | 12–14px | 400 |

## Layout Rules

### Responsive Layout

- Main content follows standard web constraints (e.g., `max-w-md` for auth forms, `max-w-5xl` for dashboard).
- The layout should be fully responsive for mobile, tablet, and desktop screens.
- Sidebar navigation may appear on tablet/desktop.

### Spacing

Use Tailwind spacing consistently:

- Page padding: `px-4 py-4` on mobile, `px-6 py-6` on desktop.
- Card padding: `p-4` or `p-6`.
- Section gap: `gap-4` to `gap-6`.
- Form field gap: `space-y-4`.

## Navigation

### User Navigation

| Navigation Item | Route | Purpose |
|---|---|---|
| Dashboard | `/dashboard` | Daily summary and quick actions |
| Log Meal | `/meals/new` | Add food intake |
| History | `/history` | View past food logs |
| Progress | `/progress` | Charts and trends |
| Lessons | `/lessons` | Nutrition education |
| Profile | `/profile` | Health data and goals |

### Admin Navigation

| Navigation Item | Route | Purpose |
|---|---|---|
| Admin Dashboard | `/admin` | Usage overview |
| Lessons | `/admin/lessons` | Manage nutrition lessons |
| Reports | `/admin/reports` | Usage and activity reports |
| Users | `/admin/users` | User lookup and account management |

## Key Screens

## 1. Onboarding Screen

Purpose: Explain NutriON in simple terms and guide users to registration.

Main sections:

- App name and short tagline.
- Benefits: track meals, understand calories, receive simple tips.
- CTA buttons: `Create Account`, `Log In`.
- Disclaimer: “NutriON provides educational nutrition guidance and does not replace medical advice.”

## 2. Registration and Login

Design requirements:

- Split-screen desktop layout: Rich gradient/imagery on the left, glassmorphic centered form on the right.
- Mobile layout: Gradient top, form sliding up from the bottom.
- Use `Form`, `Input`, `Button`, `Card`, `Alert`, and `InputOTP` from shadcn/ui.
- Bold text gradients for the main headlines.
- Never reveal whether an email exists during forgot-password flows.

## 3. Dashboard

Dashboard priority order:

1. Today's calorie summary.
2. Quick `Log Meal` button.
3. Meals logged today.
4. AI tip card.
5. Reminder status.
6. Progress preview.

Suggested cards:

- `Today’s Calories`
- `Meals Logged`
- `Goal Progress`
- `AI Nutrition Tip`
- `Recent Meals`

## 4. Meal Logging

Form fields:

- Meal category
- Date/time
- Food search input
- Quantity
- Serving unit
- Notes

UX rules:

- Use debounced search.
- Allow manual custom food entry if food is not found.
- Show calorie estimate before saving.
- Allow edit/delete after saving.

## 5. History

Features:

- Date filter.
- Meal type filter.
- Daily grouped records.
- Summary per day.

## 6. Progress

Charts:

- Daily calorie trend.
- Meal logging consistency.
- Goal progress.

Recommended library: Recharts.

## 7. AI Tips

AI tip card structure:

- Short title.
- 2–4 practical suggestions.
- Based-on context: “Based on your recent food logs and selected goal.”
- Disclaimer.

Avoid:

- Diagnosis.
- Treatment claims.
- Extreme diet suggestions.
- Shame-based language.

## 8. Nutrition Lessons

Lesson card fields:

- Title
- Category
- Estimated reading time
- Short description
- Published status for admin

## 9. Admin Screens

Admin UI should be functional and data-focused.

- Use tables, filters, badges, and dialogs.
- Keep destructive actions behind confirmation dialogs.
- Show audit history where useful.

## Component Standards

Use shadcn/ui components as the base layer.

Recommended components:

- `accordion`
- `alert`
- `alert-dialog`
- `avatar`
- `badge`
- `button`
- `calendar`
- `card`
- `chart`
- `checkbox`
- `dialog`
- `dropdown-menu`
- `form`
- `input`
- `input-otp`
- `label`
- `navigation-menu`
- `popover`
- `progress`
- `radio-group`
- `select`
- `separator`
- `sheet`
- `skeleton`
- `sonner`
- `switch`
- `table`
- `tabs`
- `textarea`
- `toast`
- `tooltip`

## Accessibility Rules

- Every input must have a label.
- Error messages must be visible and screen-reader friendly.
- Buttons must have clear action text.
- Do not rely on color alone for status.
- Maintain sufficient contrast.
- Use loading states and skeletons for async data.

## Copywriting Rules

Use friendly and simple language.

Good examples:

- “Log your breakfast”
- “You have no meals logged today.”
- “Here is a simple tip based on your recent meals.”

Avoid:

- “You failed to meet your calorie goal.”
- “This diet will cure…”
- “You must eat…”

## Empty States

| Area | Empty State |
|---|---|
| Dashboard meals | “No meals logged yet. Start by adding your first meal.” |
| History | “No records found for this date range.” |
| AI tips | “Log more meals to receive better suggestions.” |
| Lessons | “No nutrition lessons are published yet.” |

## Loading and Error States

- Use `Skeleton` for page and card loading.
- Use `Alert` for form-level errors.
- Use `sonner` toast for successful create/update/delete actions.
- Do not expose internal errors to the user.
