import { compactModerationKey, normalizeCustomerName, normalizeForModeration, validateEmail, validateNameField, validateNameShape, validatePhone, validateService } from "@/lib/moderation/normalize";

// Server-only language packs. They are deliberately kept out of the client bundle.
// This local layer catches common profanity and obfuscation even if an external
// provider is unavailable. Add reviewed terms by language, not in UI code.
const LANGUAGE_PACKS: Record<string, readonly string[]> = {
  ar: ["كس", "شرموط", "شرموطة", "متناك", "متناكة", "عرص", "خول", "قحبة", "زب", "نيك", "خرا", "كلب"],
  en: ["fuck", "fock", "fucking", "shit", "bitch", "asshole", "cunt", "dick", "pussy", "whore", "slut", "bastard"],
  tr: ["amk", "orospu", "sik", "siktir", "piç", "göt", "yarrak", "şerefsiz", "kahpe"],
  fr: ["merde", "putain", "connard", "connasse", "salope", "nique", "enculé"],
  de: ["scheisse", "fick", "ficken", "arschloch", "hure", "wichser", "schwanz"],
  es: ["mierda", "puta", "puto", "joder", "coño", "cabron", "maricon"],
  it: ["merda", "cazzo", "stronzo", "troia", "puttana", "vaffanculo"],
  pt: ["merda", "porra", "caralho", "puta", "puto", "viado", "foder"],
  ru: ["блядь", "блять", "сука", "хуй", "пизда", "ебать", "шлюха", "мудак"],
  uk: ["блядь", "сука", "хуй", "пизда", "їбати", "шльондра", "мудак"],
  fa: ["کونی", "کیر", "کس", "جنده", "حرامزاده", "عن", "لاشی"],
  ur: ["چوت", "لنڈ", "حرامی", "کُتا", "بےغیرت", "گدھا"],
  hi: ["चूत", "लंड", "भोसड़ी", "हरामी", "कमीना", "गधा", "मादरचोद"],
  nl: ["kanker", "kut", "lul", "hoer", "klote", "neuken"],
  pl: ["kurwa", "chuj", "cipa", "suka", "dupek", "pierdol"],
  el: ["γαμώ", "μαλάκας", "πούστης", "σκατά", "πουτάνα"],
  he: ["זונה", "זין", "חרא", "מניאק", "שרמוטה"],
  zh: ["操", "妈的", "傻逼", "屌", "婊子", "他妈的"],
  ja: ["くそ", "死ね", "ばか", "まんこ", "ちんこ", "きちがい"],
  ko: ["씨발", "개새끼", "병신", "좆", "년", "죽어"],
};

const PHRASES = [
  "fuckyou", "motherfucker", "siktirgit", "كسام", "kill you", "i will kill", "سوف اقتلك", "سأقتلك",
  "te voy a matar", "je vais te tuer", "ich werde dich töten", "я тебя убью", "eu vou te matar",
];

const TERMS = Object.values(LANGUAGE_PACKS).flat().map((term) => compactModerationKey(term));
const EXACT_TERMS = new Set(TERMS);
const NORMALIZED_PHRASES = PHRASES.map((phrase) => compactModerationKey(phrase));

function hasDangerousContext(input: string): boolean {
  const normalized = normalizeForModeration(input);
  const compact = compactModerationKey(input);
  const tokens = normalized.split(/[^\p{L}\p{N}]+/u).filter(Boolean).map(compactModerationKey);
  if (NORMALIZED_PHRASES.some((phrase) => compact.includes(phrase))) return true;
  if (tokens.some((token) => EXACT_TERMS.has(token))) return true;
  // Obfuscation is only treated as a match when the whole compact name is a
  // known term/phrase, preventing innocent names containing short substrings.
  if (EXACT_TERMS.has(compact)) return true;
  return false;
}

export type ModerationResult = { normalized: string; abusive: boolean; reason?: "content" | "invalid" };

export function moderateCustomerText(input: unknown): ModerationResult {
  if (typeof input !== "string") return { normalized: "", abusive: true, reason: "invalid" };
  let normalized: string;
  try { normalized = validateNameShape(input); } catch { return { normalized: normalizeCustomerName(input), abusive: true, reason: "invalid" }; }
  return { normalized, abusive: hasDangerousContext(normalized), reason: hasDangerousContext(normalized) ? "content" : undefined };
}

export function validateCustomerName(input: unknown): string {
  const result = moderateCustomerText(input);
  if (result.abusive) throw new Error(result.reason === "content" ? "ABUSIVE_NAME" : "INVALID_NAME");
  return result.normalized;
}

export function validateCustomerNameField(input: unknown): string {
  let normalized: string;
  try {
    normalized = validateNameField(input);
  } catch (error) {
    throw error;
  }
  if (hasDangerousContext(normalized)) throw new Error("ABUSIVE_NAME");
  return normalized;
}

export { validateEmail, validatePhone, validateService };
