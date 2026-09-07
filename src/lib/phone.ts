/**
 * Canonical Phone Normalization Utility for Nigerian & International Phone Numbers
 * 
 * Normalizes input phone numbers into canonical E.164 format (+234...)
 * Examples:
 *  - 08012345678       -> +2348012345678
 *  - 2348012345678     -> +2348012345678
 *  - +234 801 234 5678 -> +2348012345678
 *  - +1 (555) 234-5678 -> +15552345678
 */
export function normalizePhoneNumber(raw?: string | null): string {
  if (!raw) return "";
  const cleaned = raw.trim().replace(/[^\d+]/g, "");
  if (!cleaned) return "";

  // If already starts with '+', return with all internal spaces/hyphens stripped
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // Nigerian local prefix with country code (e.g. 2348012345678)
  if (cleaned.startsWith("234") && cleaned.length >= 13) {
    return `+${cleaned}`;
  }

  // Nigerian local standard 11 digits (e.g. 080..., 070..., 090..., 081...)
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    return `+234${cleaned.slice(1)}`;
  }

  // Nigerian local without leading zero (10 digits, e.g. 8012345678)
  if (cleaned.length === 10 && ["7", "8", "9"].includes(cleaned[0])) {
    return `+234${cleaned}`;
  }

  // Default fallback: attach '+' if not present
  return `+${cleaned}`;
}

/**
 * Validates whether a phone number matches standard mobile formats
 */
export function isValidPhoneNumber(phone?: string | null): boolean {
  if (!phone) return false;
  const normalized = normalizePhoneNumber(phone);
  // Valid E.164 international numbers typically have 8 to 15 digits after '+'
  return /^\+[1-9]\d{7,14}$/.test(normalized);
}
