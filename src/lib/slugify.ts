/**
 * Generates an SEO-friendly, clean URL route slug from any text.
 * Handles Yoruba diacritics / tone marks (e.g. à, á, è, é, ẹ, ì, í, ò, ó, ọ, ù, ú, ṣ),
 * unicode accents, punctuation, and multiple whitespaces.
 */
export function generateSlug(text: string): string {
  if (!text || typeof text !== "string") return "";

  return text
    .toString()
    .normalize("NFD") // Decompose accented glyphs: 'ṣ' -> 's' + combining dot, 'á' -> 'a' + acute
    .replace(/[\u0300-\u036f]/g, "") // Remove all combining diacritical marks
    .toLowerCase()
    .trim()
    .replace(/&/g, "and") // Replace & with 'and' for clearer routes
    .replace(/[^a-z0-9\s-]/g, "") // Remove remaining non-alphanumeric characters
    .replace(/[\s_]+/g, "-") // Replace whitespace and underscores with hyphens
    .replace(/-+/g, "-") // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}
