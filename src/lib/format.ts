import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getCourt, getSport } from "../data/arena";
import type { Booking } from "./storage";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const money = (value: number) => brl.format(value);

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

export const longDate = (dateKey: string) =>
  capitalize(format(parseISO(dateKey), "EEEE, d 'de' MMMM", { locale: ptBR }));

export const shortDate = (dateKey: string) => format(parseISO(dateKey), "dd/MM", { locale: ptBR });

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function bookingSummary(b: Booking) {
  const court = getCourt(b.courtId);
  const sport = getSport(b.sport);
  return `🏖️ Reserva Arena Brasil\n${sport.emoji} ${sport.name} · ${court.name} (${court.type})\n📅 ${longDate(b.date)}\n⏰ ${rangesLabel(b.hours)}\n💰 ${money(b.total)}`;
}

function icsStamp(dateKey: string, hour: number) {
  return `${dateKey.replace(/-/g, "")}T${String(hour).padStart(2, "0")}0000`;
}

export function downloadIcs(b: Booking) {
  const court = getCourt(b.courtId);
  const sport = getSport(b.sport);
  const events = ranges(b.hours).map(
    ([start, end], i) => [
      "BEGIN:VEVENT",
      `UID:${b.id}-${i}@arena-brasil`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART:${icsStamp(b.date, start)}`,
      `DTEND:${icsStamp(b.date, end)}`,
      `SUMMARY:${sport.name} · ${court.name} – Arena Brasil`,
      "LOCATION:Arena Brasil",
      "END:VEVENT",
    ].join("\r\n"),
  );
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Arena Brasil//Reservas//PT", ...events, "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
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
