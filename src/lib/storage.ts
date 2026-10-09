import type { Booking } from "../api/types";

/**
 * Histórico deste aparelho. A API não tem leitura pública de reservas, então
 * guardamos a resposta da criação (dados reais do servidor).
 */

export interface Profile {
  name: string;
  whatsapp: string;
}

const BOOKINGS_KEY = "arena-brasil:bookings:v2";
const PROFILE_KEY = "arena-brasil:profile";
/** Reservas falsas do protótipo, que não existem no servidor. */
const LEGACY_KEYS = ["arena-brasil:bookings"];

export const STORAGE_EVENT = "arena-storage";

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* modo privado / storage cheio: o app segue funcionando em memória */
  }
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function isBooking(value: unknown): value is Booking {
  const b = value as Booking;
  return !!b && typeof b.id === "string" && typeof b.date === "string" && Array.isArray(b.slots) && b.slots.length > 0;
}

export function getBookings(): Booking[] {
  const list = read(BOOKINGS_KEY);
  return Array.isArray(list) ? list.filter(isBooking) : [];
}

export function saveBooking(booking: Booking) {
  write(BOOKINGS_KEY, [booking, ...getBookings().filter((b) => b.id !== booking.id)]);
}

export function getProfile(): Profile {
  const p = read(PROFILE_KEY) as (Partial<Profile> & { phone?: string }) | undefined;
  // `phone` é o nome do campo no protótipo.
  return { name: p?.name ?? "", whatsapp: p?.whatsapp ?? p?.phone ?? "" };
}

export function saveProfile(profile: Profile) {
  write(PROFILE_KEY, profile);
}

export function dropLegacyData() {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* sem storage */
  }
}
