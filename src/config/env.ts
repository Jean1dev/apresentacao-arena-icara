/** Configuração lida das variáveis VITE_* no build. */

function apiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  if (import.meta.env.DEV) return "http://localhost:8080";
  throw new Error("VITE_API_BASE_URL não definida: configure a URL da API no ambiente de build.");
}

/** WhatsApp da Arena Brasil: +55 48 9633-1978. */
const DEFAULT_ARENA_WHATSAPP = "554896331978";

/** Só dígitos, com DDI, no formato que o wa.me espera. */
function arenaWhatsapp() {
  const digits = import.meta.env.VITE_ARENA_WHATSAPP?.replace(/\D/g, "") || DEFAULT_ARENA_WHATSAPP;
  return digits.length >= 12 ? digits : null;
}

export const env = {
  apiBaseUrl: apiBaseUrl(),
  arenaWhatsapp: arenaWhatsapp(),
  /** Fuso da arena: datas e horários da API são calendário local deste fuso. */
  timeZone: import.meta.env.VITE_ARENA_TIMEZONE?.trim() || "America/Sao_Paulo",
};
