import { FILA_SIZES, FilaSizeInfo, STANDARD_SIZE_CODES } from "@/data/sizing";

/**
 * Normalizes any input size string (e.g. "22.5", "S", "s", "23", "23.5", "L")
 * to its corresponding FilaSizeInfo object.
 */
export function getSizeInfo(sizeStr: string): FilaSizeInfo | undefined {
  if (!sizeStr) return undefined;
  const clean = sizeStr.trim().toUpperCase();

  // Direct letter match (e.g. "XS", "S", "M", "L", "XL", "XXL", "XXXL", "F")
  const directMatch = FILA_SIZES.find((s) => s.size.toUpperCase() === clean);
  if (directMatch) return directMatch;

  // Numeric string match (e.g. "22", "22.0", "22.5", "23", "23.5", "24", "24.5", "25")
  const numVal = parseFloat(clean);
  if (!isNaN(numVal)) {
    const numMatch = FILA_SIZES.find(
      (s) => s.inches !== null && Math.abs(s.inches - numVal) < 0.1
    );
    if (numMatch) return numMatch;
  }

  // Legacy numeric fallbacks (e.g. old Oyo measurements)
  if (clean === "21" || clean === "21.0" || clean === "21.5" || clean === "22" || clean === "22.0" || clean.includes("XS")) {
    return FILA_SIZES.find((s) => s.size === "XS");
  }
  if (clean === "22.5" || clean === "S") return FILA_SIZES.find((s) => s.size === "S");
  if (clean === "23" || clean === "23.0" || clean === "M") return FILA_SIZES.find((s) => s.size === "M");
  if (clean === "23.5" || clean === "L") return FILA_SIZES.find((s) => s.size === "L");
  if (clean === "24" || clean === "24.0" || clean === "XL") return FILA_SIZES.find((s) => s.size === "XL");
  if (clean === "24.5" || clean === "XXL" || clean === "2XL") return FILA_SIZES.find((s) => s.size === "XXL");
  if (clean === "25" || clean === "25.0" || clean === "XXXL" || clean === "3XL") return FILA_SIZES.find((s) => s.size === "XXXL");
  if (clean === "F" || clean.includes("FREE")) return FILA_SIZES.find((s) => s.size === "F");

  return undefined;
}

/**
 * Normalizes and deduplicates an array of product sizes,
 * ensuring each standard size code appears exactly once without duplicates.
 */
export function normalizeProductSizes(sizes?: string[]): string[] {
  if (!sizes || sizes.length === 0) {
    return [...STANDARD_SIZE_CODES];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const s of sizes) {
    const info = getSizeInfo(s);
    const code = info ? info.size : s.trim().toUpperCase();
    if (!seen.has(code)) {
      seen.add(code);
      normalized.push(code);
    }
  }

  return normalized.length > 0 ? normalized : [...STANDARD_SIZE_CODES];
}

/**
 * Formats size label for display in UI, Cart, Checkout, and Orders.
 * 
 * - "short": "S (22.5″)" or "F (Flexible)"
 * - "detailed": "S (22.5″ / 57.2 cm)"
 * - "badge": "Size S • 22.5″"
 * - "inches": "22.5″"
 */
export function formatSizeLabel(
  size: string,
  mode: "short" | "detailed" | "badge" | "inches" = "short"
): string {
  if (!size) return "";
  const info = getSizeInfo(size);

  if (!info) {
    // If not in standard table, format as inches fallback
    return size.endsWith("″") || size.endsWith('"') ? size : `${size}″`;
  }

  if (info.isFlexible) {
    if (mode === "badge") return "Size F • Free Size";
    return "F (Free Size)";
  }

  switch (mode) {
    case "badge":
      return `Size ${info.size} • ${info.inches}″`;
    case "detailed":
      return `${info.size} (${info.inches}″ / ${info.cm} cm)`;
    case "inches":
      return `${info.inches}″`;
    case "short":
    default:
      return `${info.size} (${info.inches}″)`;
  }
}

/**
 * Recommends the ideal Fìlà Yorùbá size from user head circumference measurement.
 * Implements Rule #4 from the official guide: "When between two sizes, buy the larger one."
 */
export function recommendSize(
  measurement: number,
  unit: "in" | "cm" = "in"
): {
  recommended: FilaSizeInfo;
  exactMatch: boolean;
  note: string;
} {
  const numericSizes = FILA_SIZES.filter((s) => s.inches !== null && s.cm !== null);

  // Convert measurement to inches for comparison if input is cm
  const inchesValue = unit === "cm" ? measurement / 2.54 : measurement;
  const cmValue = unit === "cm" ? measurement : measurement * 2.54;

  // Below minimum size -> suggest XS
  const smallest = numericSizes[0];
  if (inchesValue <= smallest.inches!) {
    return {
      recommended: smallest,
      exactMatch: Math.abs(inchesValue - smallest.inches!) < 0.15,
      note: `Fits snug for ${inchesValue.toFixed(1)}″ (${cmValue.toFixed(1)} cm).`,
    };
  }

  // Above maximum size -> suggest XXXL
  const largest = numericSizes[numericSizes.length - 1];
  if (inchesValue >= largest.inches!) {
    return {
      recommended: largest,
      exactMatch: Math.abs(inchesValue - largest.inches!) < 0.15,
      note: `Standard ceremonial maximum fit for ${inchesValue.toFixed(1)}″ (${cmValue.toFixed(1)} cm).`,
    };
  }

  // Find exact or next larger size (Rule 4)
  for (let i = 0; i < numericSizes.length; i++) {
    const current = numericSizes[i];
    const diff = Math.abs(inchesValue - current.inches!);

    // Close enough to exact match (within ~0.1 inches)
    if (diff <= 0.1) {
      return {
        recommended: current,
        exactMatch: true,
        note: `Exact fit for ${current.inches}″ (${current.cm} cm).`,
      };
    }

    // Measurement is smaller than current size -> since we loop ascending,
    // current is the NEXT LARGER size!
    if (inchesValue < current.inches!) {
      return {
        recommended: current,
        exactMatch: false,
        note: `Your measurement (${inchesValue.toFixed(1)}″ / ${cmValue.toFixed(1)} cm) falls between sizes. As recommended for Fìlà Yorùbá, we selected the larger size ${current.size} for a regal, comfortable fit.`,
      };
    }
  }

  return {
    recommended: numericSizes[2], // Default to Medium (23.0")
    exactMatch: false,
    note: "Standard Medium size recommended.",
  };
}
