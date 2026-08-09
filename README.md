# Barber Appointment Scheduler

Next.js 14 barbershop scheduling app with Supabase.

## Setup

1. Copy `.env.example` to `.env.local` and fill in your Supabase URL, anon key, server-only `SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_PASSWORD`.

2. Run the SQL migration in Supabase (see below).

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase migration

Run migrations `001_create_appointments.sql` through `20260809143502_harden_appointment_data.sql` in the Supabase SQL Editor.

Public booking is moderated and rate-limited server-side. `SMS_OTP_REQUIRED=true` makes the final booking endpoint fail closed until an OTP verification handler calls the server booking function with `phoneVerified: true`; the current repository does not contain an SMS provider integration.

## Routes

- `/` — list of schedule days
- `/day/[date]` — daily slots (YYYY-MM-DD)
- `/admin` — password-protected admin table
