import { describe, expect, it } from "vitest";
import { getProfile, saveProfile } from "./storage";

describe("perfil", () => {
  it("salva e lê nome e WhatsApp", () => {
    saveProfile({ name: "Ana Souza", whatsapp: "(48) 99999-9999" });
    expect(getProfile()).toEqual({ name: "Ana Souza", whatsapp: "(48) 99999-9999" });
  });

  it("aproveita o perfil salvo pelo protótipo", () => {
    localStorage.setItem("arena-brasil:profile", JSON.stringify({ name: "Ana", phone: "(48) 99999-9999" }));
    expect(getProfile()).toEqual({ name: "Ana", whatsapp: "(48) 99999-9999" });
  });

  it("começa vazio sem nada salvo ou com dado corrompido", () => {
    expect(getProfile()).toEqual({ name: "", whatsapp: "" });
    localStorage.setItem("arena-brasil:profile", "{oops");
    expect(getProfile()).toEqual({ name: "", whatsapp: "" });
  });
});
