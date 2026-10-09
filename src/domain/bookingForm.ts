import type { CreateBookingRequest, FieldError, Sport } from "../api/types";

/** Regras de POST /api/v1/bookings (spec "Booking input validation"). */
export const LIMITS = {
  nameMax: 100,
  notesMax: 500,
  playersMin: 1,
  playersMax: 20,
  hoursMax: 6,
  /** Reserva vai de hoje até hoje + 30 dias. */
  daysAhead: 30,
} as const;

export interface DetailsForm {
  name: string;
  whatsapp: string;
  sport: Sport;
  players: number;
  notes: string;
}

export type FormField = "name" | "whatsapp" | "players" | "notes";
export type FormErrors = Partial<Record<FormField, string>>;

const MESSAGES: Record<FormField, string> = {
  name: "Conta pra gente seu nome",
  whatsapp: "WhatsApp com DDD, por favor",
  players: `De ${LIMITS.playersMin} a ${LIMITS.playersMax} jogadores`,
  notes: `Até ${LIMITS.notesMax} caracteres`,
};

/**
 * Mesma normalização do servidor: só dígitos, sem o DDI 55 quando vier junto,
 * 10 ou 11 dígitos e DDD de 11 a 99. Devolve null quando é inválido.
 */
export function normalizeWhatsapp(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return null;
  const ddd = Number(digits.slice(0, 2));
  return ddd >= 11 && ddd <= 99 ? digits : null;
}

export function validateForm(form: DetailsForm): FormErrors {
  const errors: FormErrors = {};
  const name = form.name.trim();
  if (!name || name.length > LIMITS.nameMax) errors.name = MESSAGES.name;
  if (!normalizeWhatsapp(form.whatsapp)) errors.whatsapp = MESSAGES.whatsapp;
  if (!Number.isInteger(form.players) || form.players < LIMITS.playersMin || form.players > LIMITS.playersMax) errors.players = MESSAGES.players;
  if (form.notes.trim().length > LIMITS.notesMax) errors.notes = MESSAGES.notes;
  return errors;
}

export function toBookingRequest(courtId: string, date: string, hours: number[], form: DetailsForm): CreateBookingRequest {
  return {
    courtId,
    date,
    hours: [...hours].sort((a, b) => a - b),
    name: form.name.trim(),
    whatsapp: form.whatsapp,
    players: form.players,
    notes: form.notes.trim(),
    sport: form.sport,
  };
}

/**
 * Separa os erros de campo da API entre os que o formulário mostra e os
 * demais (`courtId`, `date`, `hours[i]`), que dependem da agenda.
 */
export function splitApiFieldErrors(fields: FieldError[]) {
  const form: FormErrors = {};
  const other: FieldError[] = [];
  for (const f of fields) {
    if (f.field in MESSAGES) form[f.field as FormField] = MESSAGES[f.field as FormField];
    else other.push(f);
  }
  return { form, other };
}
