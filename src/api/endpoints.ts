import { request } from "./client";
import type { AvailableSlots, Booking, BusinessHours, Court, CourtSlots, CreateBookingRequest } from "./types";

/** Quadras ativas, ordenadas por nome. */
export const getCourts = (signal?: AbortSignal) => request<Court[]>("/api/v1/courts", { signal });

/** Slots de uma quadra entre `from` e `to` (inclusive, no máximo 31 dias). */
export const getCourtSlots = (courtId: string, from: string, to: string, signal?: AbortSignal) =>
  request<CourtSlots>(`/api/v1/courts/${encodeURIComponent(courtId)}/slots`, { query: { from, to }, signal });

/** Slots livres de todas as quadras na data, sem os que já começaram. */
export const getAvailableSlots = (date: string, signal?: AbortSignal) => request<AvailableSlots>("/api/v1/available-slots", { query: { date }, signal });

export const getBusinessHours = (signal?: AbortSignal) => request<BusinessHours>("/api/v1/business-hours", { signal });

export const createBooking = (body: CreateBookingRequest) => request<Booking>("/api/v1/bookings", { method: "POST", body });
