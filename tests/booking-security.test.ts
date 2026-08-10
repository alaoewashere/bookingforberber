import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { moderateCustomerText, validateCustomerName, validateCustomerNameField, validateCustomerNamePair } from "../lib/moderation/server";
import { normalizeCustomerName, validateEmail, validateNameField, validateNameShape } from "../lib/moderation/normalize";
import { isValidDateParam, isWithinPublicBookingRange, normalizeTimeSlot } from "../lib/slots";

test("normal Arabic, Turkish, and English names remain valid", () => {
  for (const name of ["محمد علي", "Çağrı Şahin", "Charlotte O'Neil"]) assert.equal(validateCustomerName(name), name);
});

test("moderation rejects multilingual abuse and bypass forms", () => {
  for (const name of [
    "كس ام", "كـس", "ك س", "s.i.k", "sıııkk", "f.u.c.k", "Fuuuck", "merde", "scheisse",
    "mierda", "stronzo", "caralho", "блядь", "блядь", "کیر", "हरामी", "kurwa", "γαμώ", "זונה", "傻逼", "くそ", "씨발",
  ]) {
    assert.equal(moderateCustomerText(name).abusive, true, name);
    assert.throws(() => validateCustomerName(name), /ABUSIVE_NAME/);
  }
});

test("normalization handles obfuscation without changing legitimate display names", () => {
  assert.equal(normalizeCustomerName("  مُحَمَّــد   علي  "), "محمد علي");
  for (const name of ["f.u.c.k", "f_u_c_k", "f0ck", "F U C K", "كس\u200bام", "كـِس. اَم"]) {
    assert.equal(moderateCustomerText(name).abusive, true, name);
  }
});

test("legitimate international names remain valid", () => {
  for (const name of ["محمد", "أحمد", "علي", "مصطفى", "عبد الرحمن", "عبدالله", "Omar", "Ahmad", "Mehmet", "Mustafa", "Ali", "Jean", "John", "Иван", "Мария", "张伟", "山田太郎", "김민준", "שירה", "رضا"]) {
    assert.doesNotThrow(() => validateNameShape(name), name);
  }
});

test("first and last names are required single Unicode words", () => {
  for (const [first, last] of [["محمد", "أحمد"], ["Omar", "Hussein"], ["Mustafa", "Ali"], ["Mehmet", "Yilmaz"], ["Çağrı", "Şahin"]]) {
    assert.equal(validateCustomerNameField(first), first);
    assert.equal(validateCustomerNameField(last), last);
  }
  for (const value of ["محمد علي", "Omar Hussein", "multiple  spaces", "a", "a".repeat(31), "123", "!!!", "https://example.com", "<script>", "😀", "A\u200bli", "مـحمد."]) {
    assert.throws(() => validateNameField(value), value);
  }
});

test("both name fields receive centralized multilingual moderation", () => {
  for (const value of ["كس", "s.i.k", "f.u.c.k", "merde", "scheisse", "mierda", "stronzo", "caralho", "блядь", "کیر", "हरामी", "傻逼", "くそ", "씨발"]) {
    assert.throws(() => validateCustomerNameField(value), value);
  }
});

test("name moderation also evaluates a phrase split across two fields", () => {
  assert.deepEqual(validateCustomerNamePair("Omar", "Hussein"), { firstName: "Omar", lastName: "Hussein" });
  assert.throws(() => validateCustomerNamePair("mother", "fucker"), /ABUSIVE_NAME/);
  assert.throws(() => validateCustomerNamePair("سأ", "قتلك"), /ABUSIVE_NAME/);
});

test("empty, long, URL, HTML, script, SQL-like, and symbol spam names are rejected", () => {
  for (const name of ["", " ", "a", "https://example.com", "<script>alert(1)</script>", "javascript:alert(1)", "SELECT * FROM appointments", "🔥🔥🔥🔥🔥🔥", "a".repeat(51)]) {
    assert.throws(() => validateNameShape(name), name);
  }
});

test("date and time validation is strict and bounded", () => {
  assert.equal(isValidDateParam("2026-02-30"), false);
  assert.equal(normalizeTimeSlot("25:99"), "");
  assert.equal(normalizeTimeSlot("12:00"), "12:00");
  assert.equal(normalizeTimeSlot("12:0"), "");
  assert.equal(isWithinPublicBookingRange("2026-08-10", new Date("2026-08-09T12:00:00")), true);
  assert.equal(isWithinPublicBookingRange("2026-11-09", new Date("2026-08-09T12:00:00")), false);
});

test("email verification input is normalized and validated", () => {
  assert.equal(validateEmail("  Customer@Example.COM "), "customer@example.com");
  assert.throws(() => validateEmail("not-an-email"), /INVALID_EMAIL/);
  assert.throws(() => validateEmail("a".repeat(255) + "@example.com"), /INVALID_EMAIL/);
});

test("RLS migration removes public appointment mutations and grants rate limit only to service role", () => {
  const sql = fs.readFileSync(new URL("../supabase/migrations/004_booking_security.sql", import.meta.url), "utf8");
  assert.match(sql, /drop policy if exists "Allow public insert appointments"/i);
  assert.match(sql, /revoke all on function public\.consume_booking_rate_limit/i);
  assert.match(sql, /grant execute on function public\.consume_booking_rate_limit[\s\S]*to service_role/i);
  const hardened = fs.readFileSync(new URL("../supabase/migrations/20260809143502_harden_appointment_data.sql", import.meta.url), "utf8");
  assert.match(hardened, /revoke select on public\.appointments from anon, authenticated/i);
  assert.match(hardened, /phone_verified boolean not null default false/i);
  assert.match(hardened, /char_length\(customer_name\) between 1 and 50/i);
});

test("server moderation is not imported by the booking modal", () => {
  const modal = fs.readFileSync(new URL("../components/BookingModal.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(modal, /moderation\/server|validateCustomerName/);
});

test("booking path is atomic and protected against duplicate slots", () => {
  const migration = fs.readFileSync(new URL("../supabase/migrations/001_create_appointments.sql", import.meta.url), "utf8");
  const appointments = fs.readFileSync(new URL("../lib/appointments.ts", import.meta.url), "utf8");
  assert.match(migration, /constraint unique_date_time unique \(date, time_slot\)/i);
  assert.match(appointments, /\.eq\("status", "available"\)/);
  assert.match(appointments, /throw new Error\("SLOT_UNAVAILABLE"\)/);
  assert.doesNotMatch(appointments, /from\("appointments"\)\s*\.insert\(/);
});

test("public booking does not require email or OTP", () => {
  const route = fs.readFileSync(new URL("../app/api/appointments/book/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(route, /getAuthenticatedEmail|authorization|validateEmail/);
  assert.match(route, /email_verified: false/);
  assert.match(route, /upsertAppointment/);
});

test("admin appointments load beyond Supabase's default 1,000-row page", () => {
  const appointments = fs.readFileSync(new URL("../lib/appointments.ts", import.meta.url), "utf8");
  assert.match(appointments, /ADMIN_PAGE_SIZE = 1000/);
  assert.match(appointments, /\.range\(offset, offset \+ ADMIN_PAGE_SIZE - 1\)/);
});

test("public booking accepts structured names and a phone number without email", () => {
  const route = fs.readFileSync(new URL("../app/api/appointments/book/route.ts", import.meta.url), "utf8");
  assert.match(route, /PUBLIC_BOOKING_KEYS = \["date", "time_slot", "first_name", "last_name"/);
  assert.doesNotMatch(route, /PUBLIC_BOOKING_KEYS[^\n]*customer_name/);
  assert.doesNotMatch(route, /"email"/);
  assert.match(route, /validateCustomerNamePair/);
});

test("public clients never receive customer names and slot updates reject text", () => {
  const appointments = fs.readFileSync(new URL("../lib/appointments.ts", import.meta.url), "utf8");
  const publicPage = fs.readFileSync(new URL("../components/HomeClient.tsx", import.meta.url), "utf8");
  const updateRoute = fs.readFileSync(new URL("../app/api/appointments/[id]/route.ts", import.meta.url), "utf8");
  assert.match(appointments, /customer_name: null/);
  assert.doesNotMatch(publicPage, /slot\.customer_name/);
  assert.match(updateRoute, /Email verification is required for booking changes/);
});

test("admin sessions are signed and all bookings require the verified booking route", () => {
  const auth = fs.readFileSync(new URL("../lib/admin-auth.ts", import.meta.url), "utf8");
  const login = fs.readFileSync(new URL("../app/api/admin/login/route.ts", import.meta.url), "utf8");
  const loginStart = fs.readFileSync(new URL("../app/api/admin/login/start/route.ts", import.meta.url), "utf8");
  const adminCreate = fs.readFileSync(new URL("../app/api/appointments/route.ts", import.meta.url), "utf8");
  const adminCalendar = fs.readFileSync(new URL("../components/AdminCalendar.tsx", import.meta.url), "utf8");
  const shell = fs.readFileSync(new URL("../components/SiteShell.tsx", import.meta.url), "utf8");
  assert.match(auth, /createHmac\("sha256"/);
  assert.match(auth, /ADMIN_SESSION_MAX_AGE_SECONDS = 60 \* 60 \* 24 \* 30/);
  assert.match(auth, /timingSafeEqual/);
  assert.doesNotMatch(auth, /value === "authenticated"/);
  assert.match(login, /sameSite: "strict"/);
  assert.match(login, /maxAge: ADMIN_SESSION_MAX_AGE_SECONDS/);
  assert.match(login, /getAuthenticatedEmail/);
  assert.match(login, /isAllowedAdminEmail/);
  assert.match(loginStart, /sendEmailOtp/);
  assert.match(loginStart, /getAdminRateLimitKeys/);
  assert.match(loginStart, /ADMIN_LOGIN_MAX_ATTEMPTS = 20/);
  assert.doesNotMatch(shell, /href="\/admin"/);
  assert.match(adminCreate, /Email verification is required for bookings/);
  assert.match(adminCalendar, /<BookingModal/);
  assert.match(adminCalendar, /"\/api\/appointments\/book"/);
  assert.doesNotMatch(adminCalendar, /requireEmailVerification=\{false\}/);
});

test("admin dashboard sanitizes historic customer text before displaying it", () => {
  const appointments = fs.readFileSync(new URL("../lib/appointments.ts", import.meta.url), "utf8");
  assert.match(appointments, /Never render unsafe historic/);
  assert.match(appointments, /validateCustomerNameField\(appointment\.first_name\)/);
  assert.match(appointments, /validateCustomerName\(appointment\.customer_name\)/);
});

test("an administrator can reopen a closed slot without changing bookings", () => {
  const calendar = fs.readFileSync(new URL("../components/AdminCalendar.tsx", import.meta.url), "utf8");
  assert.match(calendar, /function handleOpen/);
  assert.match(calendar, /status: "available"/);
  assert.match(calendar, /row\.status === "blocked"/);
  assert.match(calendar, /ar\.admin\.open/);
});

test("staff-created bookings cannot overwrite an occupied slot", () => {
  const appointments = fs.readFileSync(new URL("../lib/appointments.ts", import.meta.url), "utf8");
  assert.match(appointments, /\.eq\("status", "available"\)/);
  assert.match(appointments, /throw new Error\("SLOT_UNAVAILABLE"\)/);
});

test("releasing or deleting a booked slot archives its private booking snapshot", () => {
  const migration = fs.readFileSync(new URL("../supabase/migrations/20260809192533_archive_released_bookings.sql", import.meta.url), "utf8");
  assert.match(migration, /create table if not exists public\.appointment_archives/i);
  assert.match(migration, /appointment_snapshot jsonb not null/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /before update of status on public\.appointments/i);
  assert.match(migration, /before delete on public\.appointments/i);
  assert.match(migration, /revoke all on public\.appointment_archives from anon, authenticated/i);
});
