# NutriON 🥗

NutriON is a modern, premium student health and nutrition tracking application. It features real-time macro breakdowns, USDA-powered food searching, personalized Google Gemini AI coaching, and automatic logging reminders.

---

## 🛠️ Tech Stack

*   **Frontend & Backend**: Next.js (App Router, TS, Tailwind CSS, Framer Motion)
*   **Database & ORM**: MySQL with Drizzle ORM
*   **External Integrations**:
    *   **USDA FoodData Central API**: Caches food items locally to prevent rate limits.
    *   **Google Gemini AI**: Personalized student-health coaching tips.
    *   **Brevo (Sendinblue) API**: Sends OTP verification emails on registration.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) and [Docker](https://www.docker.com/) installed.

### 2. Clone & Install
```bash
git clone <repository-url>
cd NutriON
npm install
```

### 3. Environment Variables
Copy the template and configure your API keys:
```bash
cp .env.example .env
```
Open `.env` and fill in the secrets (such as `GEMINI_API_KEY`, `BREVO_API_KEY`, etc.).

### 4. Run Services (Docker)
Start the local MySQL database container:
```bash
docker-compose up -d
```

### 5. Run Database Migrations & Seed
Deploy the database schema and load initial foods and nutrition articles:
```bash
npm run db:generate   # Generate migration SQL files
npm run db:migrate    # Apply migrations to MySQL database
npm run db:seed       # Seed initial foods and lessons data
```

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💾 Database Reset & Migration Commands

### Complete Database Reset (Fresh Start)
To completely wipe all user logs, profiles, and tables, recreate the schema, and seed the initial data:
```bash
# 1. Stop the database and delete its Docker persistent volume
docker-compose down -v

# 2. Start a fresh database container
docker-compose up -d

# 3. Apply the migrations and load seed data
npm run db:migrate
npm run db:seed
```

### Regular Schema Updates (Adding/Changing Tables)
When modifying files in `src/db/schema/`:
```bash
# 1. Generate new migration files
npm run db:generate

# 2. Apply migrations to your database
npm run db:migrate
```

### Database Studio (Visual Table Explorer)
To view and edit database rows visually in a local web interface:
```bash
npm run db:studio
```
