export interface ShippingZone {
  id: string;
  name: string;
  price: number;
}

export const shippingZones: ShippingZone[] = [
  {
    id: "lagos",
    name: "Lagos",
    price: 2000,
  },
  {
    id: "south-west",
    name: "South West",
    price: 3000,
  },
  {
    id: "south-east",
    name: "South East",
    price: 4000,
  },
  {
    id: "south-south",
    name: "South South",
    price: 4000,
  },
  {
    id: "north-central",
    name: "North Central",
    price: 5000,
  },
  {
    id: "north-east",
    name: "North East",
    price: 6000,
  },
  {
    id: "north-west",
    name: "North West",
    price: 6000,
  },
];

export function getZoneForState(stateName?: string): string {
  if (!stateName) return "";
  const s = stateName.trim().toLowerCase();

  if (s.includes("lagos")) return "lagos";
  if (["ogun", "oyo", "osun", "ondo", "ekiti"].some((st) => s.includes(st))) return "south-west";
  if (["abia", "anambra", "ebonyi", "enugu", "imo"].some((st) => s.includes(st))) return "south-east";
  if (["akwa ibom", "bayelsa", "cross river", "delta", "edo", "rivers"].some((st) => s.includes(st))) return "south-south";
  if (["benue", "fct", "abuja", "kogi", "kwara", "nasarawa", "niger", "plateau"].some((st) => s.includes(st))) return "north-central";
  if (["adamawa", "bauchi", "borno", "gombe", "taraba", "yobe"].some((st) => s.includes(st))) return "north-east";
  if (["kaduna", "kano", "katsina", "kebbi", "jigawa", "sokoto", "zamfara"].some((st) => s.includes(st))) return "north-west";

  return "";
}