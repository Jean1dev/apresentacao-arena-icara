import type { Booking, BusinessHours, Court, CourtSlots, Slot, SlotDay, Weekday } from "../api/types";
import { addDaysKey, weekdayOf } from "../lib/businessDate";

/** Quinta-feira, 10h no fuso da arena. */
export const NOW = new Date("2026-10-08T10:00:00-03:00");
export const TODAY = "2026-10-08";

export const QUADRA_1: Court = {
  id: "781a0ff6-0750-4345-841c-a1d988383a99",
  name: "Quadra 1",
  type: "INDOOR",
  minHourlyPriceCents: 13000,
  active: true,
  createdAt: "2026-10-01T12:00:00Z",
  updatedAt: "2026-10-01T12:00:00Z",
};

export const QUADRA_4: Court = {
  id: "2f9c3a51-91d4-4a3e-8c35-6a6f0b8e4d10",
  name: "Quadra 4",
  type: "OUTDOOR",
  minHourlyPriceCents: 11000,
  active: true,
  createdAt: "2026-10-01T12:00:00Z",
  updatedAt: "2026-10-01T12:00:00Z",
};

export const COURTS = [QUADRA_1, QUADRA_4];

/** Segunda a sábado, 8h–22h; domingo fechado. */
export const BUSINESS_HOURS: BusinessHours = {
  timezone: "America/Sao_Paulo",
  days: (["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as Weekday[]).map((weekday) => ({ weekday, openHour: 8, closeHour: 22 })),
};

export const stamp = (date: string, hour: number) => `${date}T${String(hour).padStart(2, "0")}:00:00-03:00`;

export function slotDay(court: Court, date: string, statusOf: (hour: number) => Slot["status"] = () => "AVAILABLE"): SlotDay {
  const weekday = weekdayOf(date);
  const window = BUSINESS_HOURS.days.find((d) => d.weekday === weekday);
  const slots: Slot[] = [];
  if (window) {
    for (let h = window.openHour; h < window.closeHour; h++) {
      slots.push({ start: stamp(date, h), end: stamp(date, h + 1), status: statusOf(h), priceCents: court.minHourlyPriceCents });
    }
  }
  return { date, weekday, open: !!window, slots };
}

export function courtSlots(court: Court, from: string, to: string, statusOf: (date: string, hour: number) => Slot["status"]): CourtSlots {
  const days: SlotDay[] = [];
  for (let d = from; d <= to; d = addDaysKey(d, 1)) days.push(slotDay(court, d, (h) => statusOf(d, h)));
  return { courtId: court.id, timezone: "America/Sao_Paulo", days };
}

export function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "0b6f4f3e-5d1a-4d4b-9a51-0c1f2e3d4a5b",
    courtId: QUADRA_1.id,
    courtName: QUADRA_1.name,
    date: TODAY,
    slots: [{ start: stamp(TODAY, 20), end: stamp(TODAY, 21), priceCents: 13000 }],
    totalPriceCents: 13000,
    name: "Ana",
    whatsapp: "48999999999",
    players: 4,
    notes: "",
    sport: "BEACH_TENNIS",
    status: "CONFIRMED",
    createdAt: "2026-10-08T13:00:00Z",
    ...overrides,
  };
}
