import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Booking, BookingSlot } from "../api/types";
import { bookingHours, shortId } from "../domain/booking";
import { getSport } from "../domain/sports";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const brlCents = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

/** Centavos -> "R$ 130" (ou "R$ 125,50" quando há centavos). */
export const money = (cents: number) => (cents % 100 === 0 ? brl : brlCents).format(cents / 100);

export const hh = (hour: number) => `${String(hour).padStart(2, "0")}h`;

/** [18, 19, 21] -> [[18, 20], [21, 22]] (início, fim) */
export function ranges(hours: number[]): [number, number][] {
  const sorted = [...hours].sort((a, b) => a - b);
  const out: [number, number][] = [];
  for (const h of sorted) {
    const last = out[out.length - 1];
    if (last && last[1] === h) last[1] = h + 1;
    else out.push([h, h + 1]);
  }
  return out;
}

export const rangesLabel = (hours: number[]) =>
  ranges(hours)
    .map(([a, b]) => `${hh(a)}–${hh(b)}`)
    .join(" · ");

export const longDate = (dateKey: string) => capitalize(format(parseISO(dateKey), "EEEE, d 'de' MMMM", { locale: ptBR }));

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function bookingSummary(b: Booking) {
  const sport = getSport(b.sport);
  return [
    "🏖️ Reserva Arena Brasil",
    `${sport ? `${sport.emoji} ${sport.name} · ` : ""}${b.courtName}`,
    `📅 ${longDate(b.date)}`,
    `⏰ ${rangesLabel(bookingHours(b))}`,
    `💰 ${money(b.totalPriceCents)}`,
  ].join("\n");
}

/** Mensagem pronta para pedir o cancelamento à arena pelo WhatsApp. */
export function cancelRequestUrl(b: Booking, arenaWhatsapp: string) {
  const text = [
    "Olá! Quero cancelar minha reserva na Arena Brasil.",
    `Código: ${shortId(b.id)}`,
    `${b.courtName} · ${longDate(b.date)} · ${rangesLabel(bookingHours(b))}`,
    `Nome: ${b.name}`,
  ].join("\n");
  return `https://wa.me/${arenaWhatsapp}?text=${encodeURIComponent(text)}`;
}

/** Junta horários seguidos ([20h–21h, 21h–22h] -> [20h–22h]). */
function mergeSlots(slots: BookingSlot[]) {
  const out: { start: string; end: string }[] = [];
  for (const s of [...slots].sort((a, b) => a.start.localeCompare(b.start))) {
    const last = out[out.length - 1];
    if (last && last.end === s.start) last.end = s.end;
    else out.push({ start: s.start, end: s.end });
  }
  return out;
}

/** RFC 3339 com offset -> data UTC do iCalendar (20261008T230000Z). */
const icsUtc = (rfc3339: string) => new Date(rfc3339).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

export function bookingIcs(b: Booking, now = new Date()) {
  const sport = getSport(b.sport);
  const events = mergeSlots(b.slots).map((range, i) =>
    [
      "BEGIN:VEVENT",
      `UID:${b.id}-${i}@arena-brasil`,
      `DTSTAMP:${icsUtc(now.toISOString())}`,
      `DTSTART:${icsUtc(range.start)}`,
      `DTEND:${icsUtc(range.end)}`,
      `SUMMARY:${sport ? `${sport.name} · ` : ""}${b.courtName} – Arena Brasil`,
      "LOCATION:Arena Brasil",
      "END:VEVENT",
    ].join("\r\n"),
  );
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Arena Brasil//Reservas//PT", ...events, "END:VCALENDAR"].join("\r\n");
}

export function downloadIcs(b: Booking) {
  const url = URL.createObjectURL(new Blob([bookingIcs(b)], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `arena-brasil-${b.date}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function haptic(ms = 10) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* sem suporte */
  }
}
