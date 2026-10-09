import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { getBookings } from "../lib/storage";
import { QUADRA_1, TODAY } from "../test/fixtures";
import { renderApp } from "../test/render";
import { API, apiError, db, server } from "../test/server";

async function openCourt(user: ReturnType<typeof renderApp>["user"], name = "Quadra 1") {
  await user.click(await screen.findByRole("heading", { name }));
  await screen.findByText("Escolha os horários");
}

const slotButton = (hour: string) => screen.findByRole("button", { name: new RegExp(`^${hour}`) });

async function fillDetails(user: ReturnType<typeof renderApp>["user"]) {
  await user.click(screen.getByRole("button", { name: /Continuar/ }));
  await user.type(await screen.findByPlaceholderText("Como te chamamos?"), "Ana Souza");
  await user.type(screen.getByPlaceholderText("(48) 99999-9999"), "48999999999");
}

describe("reserva", () => {
  it("lista as quadras e os livres de hoje vindos da API", async () => {
    db.taken.set(`${QUADRA_1.id}|${TODAY}|11`, "MONTHLY");
    renderApp();
    expect(await screen.findByRole("heading", { name: "Quadra 1" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quadra 4" })).toBeInTheDocument();
    // 11h–21h livres, menos a das 11h do mensalista.
    expect(await screen.findByText("10 livres hoje")).toBeInTheDocument();
    expect(screen.getByText("11 livres hoje")).toBeInTheDocument();
    expect(screen.getByText("Livres hoje")).toBeInTheDocument();
  });

  it("reserva um horário e guarda a resposta do servidor no aparelho", async () => {
    const { user } = renderApp();
    await openCourt(user);
    await user.click(await slotButton("20h"));
    await fillDetails(user);
    await user.click(screen.getByRole("button", { name: /Confirmar reserva/ }));

    expect(await screen.findByText("Reserva confirmada!")).toBeInTheDocument();
    expect(db.bookings).toHaveLength(1);
    expect(db.bookings[0]).toMatchObject({ courtId: QUADRA_1.id, date: TODAY, name: "Ana Souza", whatsapp: "48999999999", sport: "BEACH_TENNIS", players: 4 });
    expect(getBookings()).toEqual([db.bookings[0]]);
    expect(screen.getByText(db.bookings[0].id.slice(0, 8).toUpperCase())).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Informações importantes/ })).toBeInTheDocument();
    expect(screen.getByText(/mau tempo/)).toBeInTheDocument();
  });

  it("no 409 avisa, volta para os horários e tira o horário que foi tomado", async () => {
    const { user } = renderApp();
    await openCourt(user);
    await user.click(await slotButton("20h"));
    await fillDetails(user);
    // Outra pessoa reserva as 20h enquanto o formulário é preenchido.
    db.taken.set(`${QUADRA_1.id}|${TODAY}|20`, "BOOKED");
    await user.click(screen.getByRole("button", { name: /Confirmar reserva/ }));

    expect(await screen.findByText(/Alguém acabou de reservar/)).toBeInTheDocument();
    expect(await screen.findByText("Escolha os horários")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("button", { name: /Continuar/ })).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /^20h/ })).not.toBeInTheDocument();
    expect(getBookings()).toEqual([]);
  });

  it("mostra no campo o erro de validação devolvido pela API", async () => {
    server.use(http.post(`${API}/bookings`, () => apiError(400, "VALIDATION_ERROR", [{ field: "whatsapp", message: "invalid whatsapp" }])));
    const { user } = renderApp();
    await openCourt(user);
    await user.click(await slotButton("20h"));
    await fillDetails(user);
    await user.click(screen.getByRole("button", { name: /Confirmar reserva/ }));

    expect(await screen.findByText("WhatsApp com DDD, por favor")).toBeInTheDocument();
    expect(screen.getByText("Confirme sua reserva")).toBeInTheDocument();
  });

  it("não envia com dados inválidos", async () => {
    const { user } = renderApp();
    await openCourt(user);
    await user.click(await slotButton("20h"));
    await user.click(screen.getByRole("button", { name: /Continuar/ }));
    await user.click(await screen.findByRole("button", { name: /Confirmar reserva/ }));

    expect(screen.getByText("Conta pra gente seu nome")).toBeInTheDocument();
    expect(db.bookings).toHaveLength(0);
  });

  it("limita a 6 horas por reserva", async () => {
    const { user } = renderApp();
    await openCourt(user);
    for (const h of ["11h", "12h", "13h", "14h", "15h", "16h", "17h"]) await user.click(await slotButton(h));

    expect(await screen.findByText(/até 6 horas por vez/)).toBeInTheDocument();
    expect(screen.getByText(/6 horas · 11h–17h/)).toBeInTheDocument();
  });

  it("mostra dia fechado", async () => {
    const { user } = renderApp();
    await openCourt(user);
    await user.click(screen.getByRole("button", { name: "domingo, 11 de outubro" }));
    expect(await screen.findByText("Fechado neste dia")).toBeInTheDocument();
  });

  it("mostra erro com nova tentativa quando a API está fora do ar", async () => {
    let fail = true;
    server.use(http.get(`${API}/courts`, () => (fail ? HttpResponse.error() : undefined)));
    const { user } = renderApp();
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("Não foi possível carregar as quadras.")).toBeInTheDocument();

    fail = false;
    await user.click(within(alert).getByRole("button", { name: /Tentar novamente/ }));
    expect(await screen.findByRole("heading", { name: "Quadra 1" })).toBeInTheDocument();
  });
});
