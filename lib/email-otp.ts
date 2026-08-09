type VerifyResponse = { access_token?: string };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function authRequest(path: string, body: Record<string, string | boolean>) {
  const response = await fetch(`${supabaseUrl}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: supabaseAnonKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("EMAIL_AUTH_FAILED");
  return response;
}

export async function sendEmailOtp(email: string): Promise<void> {
  await authRequest("otp", { email, create_user: true });
}

export async function verifyEmailOtp(email: string, token: string): Promise<string> {
  const response = await authRequest("verify", { email, token, type: "email" });
  const data = (await response.json()) as VerifyResponse;
  if (!data.access_token) throw new Error("EMAIL_AUTH_FAILED");
  return data.access_token;
}
