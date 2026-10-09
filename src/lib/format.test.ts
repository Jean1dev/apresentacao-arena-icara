import { describe, expect, it } from "vitest";
import { booking, stamp, TODAY } from "../test/fixtures";
import { bookingIcs, cancelRequestUrl, money, ranges, rangesLabel } from "./format";

describe("money", () => {
  it("converte centavos e só mostra centavos quando há", () => {
    expect(money(13000)).toMatch(/^R\$\s130$/);
    expect(money(12550)).toMatch(/^R\$\s125,50$/);
  });
});

describe("ranges", () => {
  it("junta horas seguidas", () => {
    expect(ranges([21, 18, 19])).toEqual([
      [18, 20],
      [21, 22],
    ]);
    expect(rangesLabel([18, 19, 21])).toBe("18h–20h · 21h–22h");
  });
});

describe("bookingIcs", () => {
  it("gera um evento por bloco seguido, em UTC", () => {
    const b = booking({
      slots: [17, 20, 21].map((h) => ({ start: stamp(TODAY, h), end: stamp(TODAY, h + 1), priceCents: 13000 })),
    });
    const ics = bookingIcs(b, new Date("2026-10-08T13:00:00Z"));
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain("DTSTART:20261008T200000Z"); // 17h em São Paulo
    expect(ics).toContain("DTSTART:20261008T230000Z"); // 20h
    expect(ics).toContain("DTEND:20261009T010000Z"); // 22h
  });
});

describe("cancelRequestUrl", () => {
  it("abre o WhatsApp da arena com código, quadra e horário", () => {
    const url = new URL(cancelRequestUrl(booking(), "5548999990000"));
    expect(url.origin + url.pathname).toBe("https://wa.me/5548999990000");
    const text = url.searchParams.get("text")!;
    expect(text).toContain("Código: 0B6F4F3E");
    expect(text).toContain("Quadra 1");
    expect(text).toContain("20h–21h");
  });
});
