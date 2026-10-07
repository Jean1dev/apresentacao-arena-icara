import { addDays, format, isToday, startOfDay } from "date-fns";
import { CLOSE_HOUR, DAYS_AHEAD, NIGHT_FROM, OPEN_HOUR, priceFor, type Court } from "../data/arena";
import type { Booking } from "./storage";

export type SlotStatus = "livre" | "ocupado" | "passado" | "seu";

export interface Slot {
  hour: number;
  price: number;
  night: boolean;
  status: SlotStatus;
}

export function toKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function upcomingDays(): Date[] {
  const today = startOfDay(new Date());
  return Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i));
}

/** Hash simples e determinístico para a ocupação "fake" ser estável entre recarregamentos. */
function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function mockTaken(courtId: string, dateKey: string, hour: number, date: Date) {
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  let chance = hour >= 18 && hour <= 21 ? 0.62 : hour >= NIGHT_FROM ? 0.42 : hour < 8 ? 0.3 : 0.18;
  if (weekend) chance += 0.15;
  return hash(`${courtId}|${dateKey}|${hour}`) < chance;
}

export function slotsFor(court: Court, date: Date, bookings: Booking[]): Slot[] {
  const dateKey = toKey(date);
  const nowHour = new Date().getHours();
  const mine = new Set(
    bookings
      .filter((b) => b.status === "confirmada" && b.courtId === court.id && b.date === dateKey)
      .flatMap((b) => b.hours),
  );

  const slots: Slot[] = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    let status: SlotStatus = "livre";
    if (mine.has(hour)) status = "seu";
    else if (isToday(date) && hour <= nowHour) status = "passado";
    else if (mockTaken(court.id, dateKey, hour, date)) status = "ocupado";
    slots.push({ hour, price: priceFor(court, hour), night: hour >= NIGHT_FROM, status });
  }
  return slots;
}

export function freeCount(court: Court, date: Date, bookings: Booking[]) {
  return slotsFor(court, date, bookings).filter((s) => s.status === "livre").length;
}
