import { env } from "../config/env";
import type { Weekday } from "../api/types";

/**
 * Datas de calendário da arena como `YYYY-MM-DD`. "Hoje" é sempre o do fuso da
 * arena, e não o do aparelho: quem abre o app em outro fuso vê a mesma agenda.
 */

const WEEKDAYS: Weekday[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function partsIn(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

export function todayKey(now = new Date(), timeZone = env.timeZone) {
  return partsIn(now, timeZone).date;
}

/** Hora cheia atual (0–23) no fuso da arena. */
export function currentHour(now = new Date(), timeZone = env.timeZone) {
  return partsIn(now, timeZone).hour;
}

export function addDaysKey(dateKey: string, days: number) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function weekdayOf(dateKey: string): Weekday {
  const [y, m, d] = dateKey.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** `count` datas a partir de `from`, inclusive. */
export function dateRange(from: string, count: number) {
  return Array.from({ length: count }, (_, i) => addDaysKey(from, i));
}

/**
 * Hora de início de um horário RFC 3339 da API. A API manda o offset do fuso
 * da arena, então a hora do texto já é a hora local da arena.
 */
export function hourOf(rfc3339: string) {
  return Number(rfc3339.slice(11, 13));
}
