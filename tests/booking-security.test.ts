import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { moderateCustomerText, validateCustomerName } from "../lib/moderation/server";
import { normalizeCustomerName, validateNameShape } from "../lib/moderation/normalize";
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
  assert.match(appointments, /\.update\(\{ customer_name: normalizedName,[\s\S]*status: "booked"/);
  assert.match(appointments, /\.eq\("date", date\)\.eq\("time_slot", normalizedSlot\)\.eq\("status", "available"\)/);
  assert.doesNotMatch(appointments, /from\("appointments"\)\s*\.insert\(/);
});
