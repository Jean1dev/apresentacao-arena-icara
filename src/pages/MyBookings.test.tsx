import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { saveBooking } from "../lib/storage";
import { booking, stamp } from "../test/fixtures";
import { renderApp } from "../test/render";

describe("minhas reservas", () => {
  it("separa próximas e passadas e pede cancelamento pelo WhatsApp", async () => {
    saveBooking(booking());
    saveBooking(
      booking({
        id: "9f0e1d2c-0000-4000-8000-000000000000",
        date: "2026-10-01",
        slots: [{ start: stamp("2026-10-01", 18), end: stamp("2026-10-01", 19), priceCents: 13000 }],
      }),
    );
    const { user } = renderApp("/minhas-reservas");

    expect(screen.getByRole("button", { name: "Próximas (1)" })).toBeInTheDocument();
    expect(screen.getByText("20h–21h")).toBeInTheDocument();
    expect(screen.queryByText("18h–19h")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Cancelar/ }));
    const link = await screen.findByRole("link", { name: "Abrir WhatsApp" });
    expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/5548999990000\?text=/);

    await user.click(screen.getByRole("button", { name: "Voltar" }));
    await user.click(screen.getByRole("button", { name: "Histórico" }));
    expect(await screen.findByText("18h–19h")).toBeInTheDocument();
  });

  it("ignora as reservas falsas do protótipo", () => {
    localStorage.setItem("arena-brasil:bookings", JSON.stringify([{ id: "ABR-1234", hours: [20] }]));
    renderApp("/minhas-reservas");
    expect(screen.getByText("Nenhum jogo marcado")).toBeInTheDocument();
  });
});
