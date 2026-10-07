export type CourtType = "coberta" | "descoberta";

export interface Court {
  id: string;
  name: string;
  number: number;
  type: CourtType;
  description: string;
  features: string[];
}

export type SportId = "beach-tennis" | "futevolei" | "volei";

export interface Sport {
  id: SportId;
  name: string;
  emoji: string;
}

export const ARENA = {
  name: "Arena Brasil",
  tagline: "Esportes de areia",
};

export const COURTS: Court[] = [
  {
    id: "q1",
    name: "Quadra 1",
    number: 1,
    type: "coberta",
    description: "Coberta com iluminação LED. Joga faça chuva ou faça sol.",
    features: ["Cobertura", "LED", "Areia fina"],
  },
  {
    id: "q2",
    name: "Quadra 2",
    number: 2,
    type: "coberta",
    description: "Coberta, ao lado do bar. Ideal para jogos à noite.",
    features: ["Cobertura", "LED", "Perto do bar"],
  },
  {
    id: "q3",
    name: "Quadra 3",
    number: 3,
    type: "descoberta",
    description: "Ao ar livre, pôr do sol de frente pra quadra.",
    features: ["Ao ar livre", "LED", "Vista pôr do sol"],
  },
  {
    id: "q4",
    name: "Quadra 4",
    number: 4,
    type: "descoberta",
    description: "Ao ar livre, a mais espaçosa da arena.",
    features: ["Ao ar livre", "LED", "Mais espaço"],
  },
];

export const SPORTS: Sport[] = [
  { id: "beach-tennis", name: "Beach tennis", emoji: "🎾" },
  { id: "futevolei", name: "Futevôlei", emoji: "⚽" },
  { id: "volei", name: "Vôlei de praia", emoji: "🏐" },
];

/** Primeiro horário de início e último horário de término (blocos de 1h). */
export const OPEN_HOUR = 6;
export const CLOSE_HOUR = 23;
/** A partir desta hora vale o preço noturno. */
export const NIGHT_FROM = 17;
export const DAYS_AHEAD = 14;

const PRICES: Record<CourtType, { day: number; night: number }> = {
  coberta: { day: 100, night: 130 },
  descoberta: { day: 80, night: 110 },
};

export function priceFor(court: Court, hour: number) {
  const p = PRICES[court.type];
  return hour >= NIGHT_FROM ? p.night : p.day;
}

export function minPrice(court: Court) {
  return PRICES[court.type].day;
}

export function getCourt(id: string) {
  return COURTS.find((c) => c.id === id)!;
}

export function getSport(id: SportId) {
  return SPORTS.find((s) => s.id === id)!;
}
