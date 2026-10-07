import type { SportId } from "../data/arena";

export interface Booking {
  id: string;
  courtId: string;
  date: string; // yyyy-MM-dd
  hours: number[];
  sport: SportId;
  name: string;
  phone: string;
  players: number;
  notes: string;
  total: number;
  createdAt: string;
  status: "confirmada" | "cancelada";
}

export interface Profile {
  name: string;
  phone: string;
}

const BOOKINGS_KEY = "arena-brasil:bookings";
const PROFILE_KEY = "arena-brasil:profile";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* modo privado / storage cheio: o protótipo segue funcionando em memória */
  }
  window.dispatchEvent(new Event("arena-storage"));
}

export function getBookings(): Booking[] {
  return read<Booking[]>(BOOKINGS_KEY, []);
}

export function saveBooking(booking: Booking) {
  write(BOOKINGS_KEY, [booking, ...getBookings()]);
}

export function cancelBooking(id: string) {
  write(
    BOOKINGS_KEY,
    getBookings().map((b) => (b.id === id ? { ...b, status: "cancelada" } : b)),
  );
}

export function getProfile(): Profile {
  return read<Profile>(PROFILE_KEY, { name: "", phone: "" });
}

export function saveProfile(profile: Profile) {
  write(PROFILE_KEY, profile);
}
