import { cookies } from "next/headers";

export const ADMIN_COOKIE = "barber_admin_session";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;
  return password === expected;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE);
  return session?.value === "authenticated";
}
