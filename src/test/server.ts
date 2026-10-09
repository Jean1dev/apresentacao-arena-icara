import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { Booking, CreateBookingRequest, ErrorBody, FreeSlot } from "../api/types";
import { BUSINESS_HOURS, COURTS, courtSlots, slotDay, stamp } from "./fixtures";

export const API = "http://api.test/api/v1";

/**
 * Backend em memória com as regras públicas da API: horas ocupadas por quadra e
 * data, 409 em conflito, e as listas de slots refletem as reservas criadas.
 */
export const db = {
  /** `${courtId}|${date}|${hour}` -> status */
  taken: new Map<string, "BOOKED" | "MONTHLY">(),
  bookings: [] as Booking[],
  reset() {
    this.taken.clear();
    this.bookings = [];
  },
};

const key = (courtId: string, date: string, hour: number) => `${courtId}|${date}|${hour}`;
const statusOf = (courtId: string) => (date: string, hour: number) => db.taken.get(key(courtId, date, hour)) ?? "AVAILABLE";

export const apiError = (status: number, code: string, fields?: ErrorBody["error"]["fields"]) =>
  HttpResponse.json<ErrorBody>({ error: { code, message: code.toLowerCase(), fields } }, { status });

export const handlers = [
  http.get(`${API}/courts`, () => HttpResponse.json(COURTS)),

  http.get(`${API}/business-hours`, () => HttpResponse.json(BUSINESS_HOURS)),

  http.get(`${API}/courts/:id/slots`, ({ params, request }) => {
    const court = COURTS.find((c) => c.id === params.id);
    if (!court) return apiError(404, "COURT_NOT_FOUND");
    const url = new URL(request.url);
    const from = url.searchParams.get("from")!;
    return HttpResponse.json(courtSlots(court, from, url.searchParams.get("to") ?? from, statusOf(court.id)));
  }),

  http.get(`${API}/available-slots`, ({ request }) => {
    const date = new URL(request.url).searchParams.get("date")!;
    const now = Date.now();
    const slots: FreeSlot[] = COURTS.flatMap((court) =>
      slotDay(court, date, (h) => statusOf(court.id)(date, h))
        .slots.filter((s) => s.status === "AVAILABLE" && Date.parse(s.start) > now)
        .map((s) => ({ courtId: court.id, courtName: court.name, courtType: court.type, start: s.start, end: s.end, priceCents: s.priceCents })),
    ).sort((a, b) => a.start.localeCompare(b.start) || a.courtName.localeCompare(b.courtName));
    return HttpResponse.json({ date, timezone: "America/Sao_Paulo", slots });
  }),

  http.post(`${API}/bookings`, async ({ request }) => {
    const body = (await request.json()) as CreateBookingRequest;
    const court = COURTS.find((c) => c.id === body.courtId);
    if (!court) return apiError(400, "VALIDATION_ERROR", [{ field: "courtId", message: "unknown court" }]);
    if (body.hours.some((h) => db.taken.has(key(court.id, body.date, h)))) return apiError(409, "SLOT_UNAVAILABLE");
    body.hours.forEach((h) => db.taken.set(key(court.id, body.date, h), "BOOKED"));
    const created: Booking = {
      id: crypto.randomUUID(),
      courtId: court.id,
      courtName: court.name,
      date: body.date,
      slots: body.hours.map((h) => ({ start: stamp(body.date, h), end: stamp(body.date, h + 1), priceCents: court.minHourlyPriceCents })),
      totalPriceCents: body.hours.length * court.minHourlyPriceCents,
      name: body.name,
      whatsapp: body.whatsapp.replace(/\D/g, ""),
      players: body.players ?? null,
      notes: body.notes ?? "",
      sport: body.sport ?? null,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };
    db.bookings.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),
];

export const server = setupServer(...handlers);
