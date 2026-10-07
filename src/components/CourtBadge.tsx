import { Sun, Umbrella } from "lucide-react";
import type { CourtType } from "../data/arena";

export function CourtBadge({ type, className = "" }: { type: CourtType; className?: string }) {
  const covered = type === "coberta";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
        covered ? "bg-ocean text-white" : "bg-white text-[#C2601C]"
      } ${className}`}
    >
      {covered ? <Umbrella className="size-3.5" /> : <Sun className="size-3.5" />}
      {covered ? "Coberta" : "Ao ar livre"}
    </span>
  );
}
