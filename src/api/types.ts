/**
 * Tipos públicos da Arena Brasil Scheduler API (espelham docs/openapi.yaml do
 * repositório arena-brasil-scheduler-api). Dinheiro é sempre em centavos;
 * datas são `YYYY-MM-DD` no fuso da arena e horários são RFC 3339 com o offset dele.
 */

export type CourtType = "INDOOR" | "OUTDOOR";

export interface Court {
  id: string;
  name: string;
  type: CourtType;
  minHourlyPriceCents: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Qualquer valor diferente de `AVAILABLE`, inclusive desconhecidos, é indisponível. */
export type SlotStatus = "AVAILABLE" | "BOOKED" | "MONTHLY" | (string & {});

export interface Slot {
  start: string;
  end: string;
  status: SlotStatus;
  priceCents: number;
}

export type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export interface SlotDay {
  date: string;
  weekday: Weekday;
  open: boolean;
  slots: Slot[];
}

export interface CourtSlots {
  courtId: string;
  timezone: string;
  days: SlotDay[];
}

export interface FreeSlot {
  courtId: string;
  courtName: string;
  courtType: CourtType;
  start: string;
  end: string;
  priceCents: number;
}

export interface AvailableSlots {
  date: string;
  timezone: string;
  slots: FreeSlot[];
}

export interface BusinessWindow {
  weekday: Weekday;
  openHour: number;
  /** 24 = meia-noite no fim do dia. */
  closeHour: number;
}

export interface BusinessHours {
  timezone: string;
  /** Só os dias abertos aparecem. */
  days: BusinessWindow[];
}

export type Sport = "BEACH_TENNIS" | "FOOTVOLLEY" | "BEACH_VOLLEYBALL";

export interface CreateBookingRequest {
  courtId: string;
  date: string;
  hours: number[];
  name: string;
  whatsapp: string;
  players?: number;
  notes?: string;
  sport?: Sport;
}

export interface BookingSlot {
  start: string;
  end: string;
  priceCents: number;
}

export interface Booking {
  id: string;
  courtId: string;
  courtName: string;
  date: string;
  slots: BookingSlot[];
  totalPriceCents: number;
  name: string;
  /** Só dígitos, sem DDI. */
  whatsapp: string;
  players: number | null;
  notes: string;
  sport: Sport | null;
  status: string;
  createdAt: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ErrorBody {
  error: {
    code: string;
    message: string;
    fields?: FieldError[];
  };
}
