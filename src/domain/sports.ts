import type { Sport } from "../api/types";

export interface SportInfo {
  id: Sport;
  name: string;
  emoji: string;
}

export const SPORTS: SportInfo[] = [
  { id: "BEACH_TENNIS", name: "Beach tennis", emoji: "🎾" },
  { id: "FOOTVOLLEY", name: "Futevôlei", emoji: "⚽" },
  { id: "BEACH_VOLLEYBALL", name: "Vôlei de praia", emoji: "🏐" },
];

export const DEFAULT_SPORT: Sport = "BEACH_TENNIS";

export function getSport(id: Sport | null | undefined): SportInfo | undefined {
  return SPORTS.find((s) => s.id === id);
}

export function isSport(value: unknown): value is Sport {
  return SPORTS.some((s) => s.id === value);
}
