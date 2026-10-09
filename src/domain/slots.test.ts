import { describe, expect, it } from "vitest";
import { booking, QUADRA_1, QUADRA_4, slotDay, stamp, TODAY } from "../test/fixtures";
import { freeCount, freeHoursOf, myHoursByDate, toUiDay, totalCents } from "./slots";

const NOW = Date.parse(`${TODAY}T10:00:00-03:00`);

describe("toUiDay", () => {
  const statuses: Record<number, string> = { 18: "MONTHLY", 19: "BOOKED", 20: "BOOKED", 21: "BLOCKED" };
  const day = slotDay(QUADRA_1, TODAY, (h) => statuses[h] ?? "AVAILABLE");
  const mine = myHoursByDate([booking()], QUADRA_1.id); // a reserva das 20h é deste aparelho

  it("esconde os horários que já começaram", () => {
    const ui = toUiDay(day, mine, NOW);
    expect(ui.slots[0].hour).toBe(11);
    expect(ui.slots.some((s) => s.hour === 10)).toBe(false);
  });

  it("mapeia o status: livre, ocupado, seu, e desconhecido conta como ocupado", () => {
    const byHour = new Map(toUiDay(day, mine, NOW).slots.map((s) => [s.hour, s.status]));
    expect(byHour.get(17)).toBe("livre");
    expect(byHour.get(18)).toBe("ocupado");
    expect(byHour.get(19)).toBe("ocupado");
    expect(byHour.get(20)).toBe("seu");
    expect(byHour.get(21)).toBe("ocupado");
  });

  it("calcula livres e total pelas horas escolhidas", () => {
    const ui = toUiDay(day, mine, NOW);
    expect(freeCount(ui)).toBe(7); // 11h–17h
    expect(totalCents(ui, [11, 12])).toBe(26000);
  });

  it("dia fechado vem sem horários", () => {
    const sunday = toUiDay(slotDay(QUADRA_1, "2026-10-11"), mine, NOW);
    expect(sunday).toEqual({ date: "2026-10-11", open: false, slots: [] });
  });
});

describe("freeHoursOf", () => {
  it("filtra os livres de uma quadra", () => {
    const slots = [
      { courtId: QUADRA_1.id, courtName: "Quadra 1", courtType: "INDOOR" as const, start: stamp(TODAY, 17), end: stamp(TODAY, 18), priceCents: 1 },
      { courtId: QUADRA_4.id, courtName: "Quadra 4", courtType: "OUTDOOR" as const, start: stamp(TODAY, 18), end: stamp(TODAY, 19), priceCents: 1 },
    ];
    expect([...freeHoursOf(slots, QUADRA_1.id)]).toEqual([17]);
  });
});
