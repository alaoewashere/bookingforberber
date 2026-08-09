const ARABIC_MARKS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/gu;
const INVISIBLE = /[\u00ad\u061c\u180e\u200b-\u200f\u202a-\u202e\u2060\u2061\u2062\u2063\u2064\u2066-\u206f\ufeff]/gu;
const TATWEEL = /\u0640/gu;

const DIGIT_FOLDS: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "6": "g", "7": "t", "8": "b", "9": "g",
  "٠": "o", "١": "i", "٣": "e", "٤": "a", "٥": "s", "٦": "g", "٧": "t", "٨": "b", "٩": "g",
};

const CONFUSABLE_FOLDS: Record<string, string> = {
  // Latin/Cyrillic/Greek lookalikes commonly used in obfuscation.
  а: "a", е: "e", о: "o", р: "p", с: "c", х: "x", у: "y", і: "i", ј: "j",
  Α: "a", Β: "b", Ε: "e", Ι: "i", Κ: "k", Μ: "m", Ν: "n", Ο: "o", Ρ: "p", Τ: "t", Χ: "x",
  "ı": "i", "İ": "i", "ß": "ss", "æ": "ae", "œ": "oe",
};

const ARABIC_FOLDS: Record<string, string> = {
  أ: "a", إ: "a", آ: "a", ٱ: "a", ؤ: "w", ئ: "y", ى: "y", ة: "h",
  ا: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "dh",
  ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh",
  ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n", ه: "h", و: "w", ي: "y", ء: "a",
};

export function normalizeCustomerName(input: string): string {
  return input
    .normalize("NFKC")
    .replace(INVISIBLE, "")
    .replace(TATWEEL, "")
    .replace(ARABIC_MARKS, "")
    .replace(/[\u00a0\s]+/gu, " ")
    .trim();
}

export function normalizeForModeration(input: string): string {
  return normalizeCustomerName(input)
    .toLocaleLowerCase("und")
    .replace(/[ء-ي]/gu, (char) => ARABIC_FOLDS[char] ?? char)
    .replace(/\p{M}/gu, "")
    .replace(/[\p{Cf}\p{Cc}]/gu, "")
    .split("")
    .map((char) => DIGIT_FOLDS[char] ?? CONFUSABLE_FOLDS[char] ?? char)
    .join("");
}

export function compactModerationKey(input: string): string {
  return normalizeForModeration(input)
    .replace(/[\p{P}\p{S}\s_]+/gu, "")
    .replace(/(.)\1+/gu, "$1");
}

export function hasLetters(input: string): boolean {
  return /\p{L}/u.test(input);
}

export function validateNameShape(input: unknown): string {
  if (typeof input !== "string") throw new Error("INVALID_NAME");
  const normalized = normalizeCustomerName(input);
  if (normalized.length < 2 || normalized.length > 50) throw new Error("INVALID_NAME");
  if (!hasLetters(normalized)) throw new Error("INVALID_NAME");
  if (/(?:https?:\/\/|www\.|javascript:|data:text\/html)/iu.test(normalized)) throw new Error("INVALID_NAME");
  if (/<[^>]*>|[{}<>]/u.test(normalized)) throw new Error("INVALID_NAME");
  if (/\b(?:select|insert|update|delete|drop|union)\b.{0,20}\b(?:from|into|where|table)\b/iu.test(normalized)) throw new Error("INVALID_NAME");
  if (/[^\p{L}\p{M}\p{N}\s'.’\-()]/u.test(normalized)) throw new Error("INVALID_NAME");
  if ((normalized.match(/[\p{S}\p{P}]/gu) ?? []).length > Math.max(3, Math.ceil(normalized.length * 0.25))) throw new Error("INVALID_NAME");
  if (/(.)\1{5,}/u.test(normalized)) throw new Error("INVALID_NAME");
  return normalized;
}

export function validatePhone(input: unknown): string {
  if (typeof input !== "string") throw new Error("INVALID_PHONE");
  const normalized = input.normalize("NFKC").replace(/[\s().-]/gu, "");
  if (!/^\+?[0-9]{8,15}$/u.test(normalized)) throw new Error("INVALID_PHONE");
  return normalized;
}

export function validateEmail(input: unknown): string {
  if (typeof input !== "string") throw new Error("INVALID_EMAIL");
  const normalized = input.normalize("NFKC").trim().toLowerCase();
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized)) {
    throw new Error("INVALID_EMAIL");
  }
  return normalized;
}

export function validateService(input: unknown): "hair" | "beard" | "hair_beard" {
  if (input === "hair" || input === "beard" || input === "hair_beard") return input;
  throw new Error("INVALID_SERVICE");
}
