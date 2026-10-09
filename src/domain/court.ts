import type { CourtType } from "../api/types";

/** Textos de apresentação por tipo: a API só tem nome, tipo e preço da quadra. */
const COPY: Record<CourtType, { label: string; area: string; description: string }> = {
  INDOOR: {
    label: "Coberta",
    area: "área coberta",
    description: "Coberta com iluminação. Joga faça chuva ou faça sol.",
  },
  OUTDOOR: {
    label: "Ao ar livre",
    area: "área externa",
    description: "Ao ar livre, com iluminação para jogar à noite.",
  },
};

export const courtCopy = (type: CourtType) => COPY[type];

export const COURT_TYPES: CourtType[] = ["INDOOR", "OUTDOOR"];
