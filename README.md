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

Run migrations `001_create_appointments.sql` through `20260809190000_email_booking_verification.sql`, including `20260809165025_split_customer_names_email_cooldown.sql` and `20260809165530_atomic_email_booking_cooldown.sql`, in the Supabase SQL Editor.

Public booking is moderated and rate-limited server-side. Customers enter one-word first and last names, verify an email address with Supabase Email OTP, and may use the same email only once per two-day cooldown before creating an appointment. Configure the Supabase Auth email template to include `{{ .Token }}` so the message contains a verification code.

## Routes

- `/` — list of schedule days
- `/day/[date]` — daily slots (YYYY-MM-DD)
- `/admin` — password-protected admin table
