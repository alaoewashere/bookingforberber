# Barber Appointment Scheduler

Next.js 14 barbershop scheduling app with Supabase.

## Setup

1. Copy `.env.example` to `.env.local` and fill in your Supabase URL and anon key plus `ADMIN_PASSWORD`.

2. Run the SQL migration in Supabase (see below).

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase migration

Run `supabase/migrations/001_create_appointments.sql` in the Supabase SQL Editor.

## Routes

- `/` — list of schedule days
- `/day/[date]` — daily slots (YYYY-MM-DD)
- `/admin` — password-protected admin table
