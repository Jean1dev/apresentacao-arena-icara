import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { API, apiError, server } from "../test/server";
import { ApiError, NETWORK_ERROR, request, UNEXPECTED_RESPONSE } from "./client";

const catchError = (p: Promise<unknown>) =>
  p.then(
    () => expect.unreachable("deveria falhar"),
    (e: unknown) => e as ApiError,
  );

describe("request", () => {
  it("devolve o JSON da resposta", async () => {
    server.use(http.get(`${API}/ping`, () => HttpResponse.json({ ok: true })));
    await expect(request("/api/v1/ping")).resolves.toEqual({ ok: true });
  });

  it("monta query string ignorando valores ausentes", async () => {
    server.use(http.get(`${API}/ping`, ({ request: req }) => HttpResponse.json({ search: new URL(req.url).search })));
    await expect(request("/api/v1/ping", { query: { date: "2026-10-08", to: undefined } })).resolves.toEqual({ search: "?date=2026-10-08" });
  });

  it("lê o envelope de erro da API", async () => {
    server.use(http.post(`${API}/bookings`, () => apiError(400, "VALIDATION_ERROR", [{ field: "whatsapp", message: "invalid" }])));
    const err = await catchError(request("/api/v1/bookings", { method: "POST", body: {} }));
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 400, code: "VALIDATION_ERROR", fields: [{ field: "whatsapp", message: "invalid" }], isClientError: true });
  });

  it("trata resposta sem JSON", async () => {
    server.use(http.get(`${API}/ping`, () => new HttpResponse("bad gateway", { status: 502 })));
    const err = await catchError(request("/api/v1/ping"));
    expect(err).toMatchObject({ status: 502, code: UNEXPECTED_RESPONSE, isClientError: false });
  });

  it("transforma falha de rede em NETWORK_ERROR", async () => {
    server.use(http.get(`${API}/ping`, () => HttpResponse.error()));
    const err = await catchError(request("/api/v1/ping"));
    expect(err).toMatchObject({ status: 0, code: NETWORK_ERROR });
  });
});
