import type { Booking } from "../api/types";
import { hourOf } from "../lib/businessDate";

export const bookingHours = (b: Booking) => b.slots.map((s) => hourOf(s.start));

/** Termina depois de agora. */
export const isUpcoming = (b: Booking, now = Date.now()) => Date.parse(b.slots[b.slots.length - 1].end) > now;

export const byStart = (a: Booking, b: Booking) => a.slots[0].start.localeCompare(b.slots[0].start);

/** Código curto para o cliente citar ao falar com a arena. */
export const shortId = (id: string) => id.slice(0, 8).toUpperCase();
