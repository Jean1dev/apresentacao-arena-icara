import type { Booking, FreeSlot, SlotDay } from "../api/types";
import { hourOf } from "../lib/businessDate";

export type UiSlotStatus = "livre" | "ocupado" | "seu";

export interface UiSlot {
  hour: number;
  priceCents: number;
  status: UiSlotStatus;
}

export interface UiDay {
  date: string;
  open: boolean;
  /** Só os horários que ainda não começaram. */
  slots: UiSlot[];
}

/** Horas que este aparelho reservou na quadra, por data. */
export function myHoursByDate(bookings: Booking[], courtId: string) {
  const map = new Map<string, Set<number>>();
  for (const b of bookings) {
    if (b.courtId !== courtId) continue;
    const set = map.get(b.date) ?? new Set<number>();
    b.slots.forEach((s) => set.add(hourOf(s.start)));
    map.set(b.date, set);
  }
  return map;
}

/**
 * Converte um dia da API para a grade. Status diferente de `AVAILABLE` é
 * ocupado (inclusive valores novos); ocupado por reserva deste aparelho é "seu".
 */
export function toUiDay(day: SlotDay, mine: Map<string, Set<number>>, now = Date.now()): UiDay {
  const myHours = mine.get(day.date);
  const slots = day.slots
    .filter((s) => Date.parse(s.start) > now)
    .map((s): UiSlot => {
      const hour = hourOf(s.start);
      const status = s.status === "AVAILABLE" ? "livre" : s.status === "BOOKED" && myHours?.has(hour) ? "seu" : "ocupado";
      return { hour, priceCents: s.priceCents, status };
    });
  return { date: day.date, open: day.open, slots };
}

export const freeHours = (day: UiDay | undefined) => new Set(day?.slots.filter((s) => s.status === "livre").map((s) => s.hour));

export const freeCount = (day: UiDay | undefined) => freeHours(day).size;

export function totalCents(day: UiDay | undefined, hours: number[]) {
  return (day?.slots ?? []).filter((s) => hours.includes(s.hour)).reduce((sum, s) => sum + s.priceCents, 0);
}

/** Horas livres de uma quadra numa resposta de `/available-slots`. */
export function freeHoursOf(slots: FreeSlot[], courtId: string) {
  return new Set(slots.filter((s) => s.courtId === courtId).map((s) => hourOf(s.start)));
}
