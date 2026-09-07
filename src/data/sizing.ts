export interface FilaSizeInfo {
  size: string; // e.g. "F", "XS", "S", "M", "L", "XL", "XXL", "XXXL"
  label: string;
  inches: number | null;
  cm: number | null;
  isFlexible?: boolean;
  description: string;
}

export const FILA_SIZES: FilaSizeInfo[] = [
  {
    size: "F",
    label: "Free Size (Flexible)",
    inches: null,
    cm: null,
    isFlexible: true,
    description: "Elasticized or adjustable fitting suitable for most standard head sizes.",
  },
  {
    size: "XS",
    label: "Extra Small",
    inches: 22.0,
    cm: 55.9,
    description: "Snug fitting for head circumference of 22.0 inches (55.9 cm).",
  },
  {
    size: "S",
    label: "Small",
    inches: 22.5,
    cm: 57.2,
    description: "Traditional fitting for head circumference of 22.5 inches (57.2 cm).",
  },
  {
    size: "M",
    label: "Medium",
    inches: 23.0,
    cm: 58.4,
    description: "Most popular standard fitting for head circumference of 23.0 inches (58.4 cm).",
  },
  {
    size: "L",
    label: "Large",
    inches: 23.5,
    cm: 59.7,
    description: "Comfortable spacious fitting for head circumference of 23.5 inches (59.7 cm).",
  },
  {
    size: "XL",
    label: "Extra Large",
    inches: 24.0,
    cm: 61.0,
    description: "Generous fitting for head circumference of 24.0 inches (61.0 cm).",
  },
  {
    size: "XXL",
    label: "Double Extra Large",
    inches: 24.5,
    cm: 62.2,
    description: "Broad ceremonial fitting for head circumference of 24.5 inches (62.2 cm).",
  },
  {
    size: "XXXL",
    label: "Triple Extra Large",
    inches: 25.0,
    cm: 63.5,
    description: "Maximum room crown fitting for head circumference of 25.0 inches (63.5 cm).",
  },
];

export interface MeasurementStep {
  step: number;
  title: string;
  description: string;
  tip?: string;
}

export const MEASUREMENT_STEPS: MeasurementStep[] = [
  {
    step: 1,
    title: "Fìlà Yorùbá Sizing",
    description:
      "FÌLÀ YORÙBÁ size is based on the circumference of the head. To determine the proper FÌLÀ size for yourself, it is necessary to take a measurement of your head.",
    tip: "Fìlà is traditionally worn resting slightly tilted or upright above the eyebrows.",
  },
  {
    step: 2,
    title: "Use a Measuring Tape",
    description:
      "Place the measuring tape around your head just above your ears and about one inch above your eyebrows. Tape must be straight and not twisted, and parallel to the ground, not slanted.",
    tip: "Ensure the tape sits exactly where you want your Fìlà crown rim to rest.",
  },
  {
    step: 3,
    title: "Piece of String Method",
    description:
      "Alternatively, you can use a piece of string or ribbon to measure your head, then measure the length of the string with a flat ruler. Make sure the string or tape is snug but not too tight.",
    tip: "Keep the string comfortably snug, without pinching your temples.",
  },
  {
    step: 4,
    title: "Buy the Larger One (Golden Rule)",
    description:
      "If you are not certain about your size, or your measurement falls between two sizes, buy the larger size. In other words, choose the larger size for a regal, comfortable fit.",
    tip: "Handwoven Aso-Oke holds its architectural fold best when not overstretched.",
  },
];

export const STANDARD_SIZE_CODES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
