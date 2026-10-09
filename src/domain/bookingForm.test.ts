import { describe, expect, it } from "vitest";
import { normalizeWhatsapp, splitApiFieldErrors, toBookingRequest, validateForm, type DetailsForm } from "./bookingForm";

const valid: DetailsForm = { name: " Ana ", whatsapp: "(48) 99999-9999", sport: "BEACH_TENNIS", players: 4, notes: "  " };

describe("normalizeWhatsapp", () => {
  it.each([
    ["(48) 99999-9999", "48999999999"],
    ["+55 (48) 99999-9999", "48999999999"],
    ["48 3333-4444", "4833334444"],
    ["5548999999999", "48999999999"],
  ])("aceita %s", (raw, expected) => expect(normalizeWhatsapp(raw)).toBe(expected));

  it.each(["99999", "(05) 99999-9999", "123456789012345", ""])("rejeita %s", (raw) => expect(normalizeWhatsapp(raw)).toBeNull());
});

describe("validateForm", () => {
  it("passa com dados válidos", () => expect(validateForm(valid)).toEqual({}));

  it("aponta cada campo inválido", () => {
    const errors = validateForm({ ...valid, name: "  ", whatsapp: "99999", players: 21, notes: "x".repeat(501) });
    expect(Object.keys(errors).sort()).toEqual(["name", "notes", "players", "whatsapp"]);
  });
});

describe("toBookingRequest", () => {
  it("ordena as horas e apara os textos", () => {
    expect(toBookingRequest("c1", "2026-10-08", [21, 20], valid)).toEqual({
      courtId: "c1",
      date: "2026-10-08",
      hours: [20, 21],
      name: "Ana",
      whatsapp: "(48) 99999-9999",
      players: 4,
      notes: "",
      sport: "BEACH_TENNIS",
    });
  });
});

describe("splitApiFieldErrors", () => {
  it("separa erros do formulário dos da agenda", () => {
    const { form, other } = splitApiFieldErrors([
      { field: "whatsapp", message: "invalid" },
      { field: "hours[0]", message: "already started" },
    ]);
    expect(Object.keys(form)).toEqual(["whatsapp"]);
    expect(other).toEqual([{ field: "hours[0]", message: "already started" }]);
  });
});
