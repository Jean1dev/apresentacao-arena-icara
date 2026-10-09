import { describe, expect, it } from "vitest";
import { addDaysKey, currentHour, dateRange, hourOf, todayKey, weekdayOf } from "./businessDate";

describe("businessDate", () => {
  // 23h30 de quinta em São Paulo; o aparelho dos testes está em Tóquio, onde já é sexta.
  const lateThursday = new Date("2026-10-09T02:30:00Z");

  it("usa o calendário da arena, não o do aparelho", () => {
    expect(todayKey(lateThursday)).toBe("2026-10-08");
    expect(currentHour(lateThursday)).toBe(23);
  });

  it("soma dias atravessando mês e ano", () => {
    expect(addDaysKey("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDaysKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(dateRange("2026-10-30", 3)).toEqual(["2026-10-30", "2026-10-31", "2026-11-01"]);
  });

  it("descobre o dia da semana da data", () => {
    expect(weekdayOf("2026-10-08")).toBe("THURSDAY");
    expect(weekdayOf("2026-10-11")).toBe("SUNDAY");
  });

  it("lê a hora do texto RFC 3339 sem converter de fuso", () => {
    expect(hourOf("2026-10-08T20:00:00-03:00")).toBe(20);
    expect(hourOf("2026-10-08T00:00:00-03:00")).toBe(0);
  });
});
