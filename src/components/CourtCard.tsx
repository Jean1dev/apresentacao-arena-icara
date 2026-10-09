import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Court } from "../api/types";
import { courtCopy } from "../domain/court";
import { money } from "../lib/format";
import { CourtBadge } from "./CourtBadge";
import { CourtIllustration } from "./CourtIllustration";

/** `free` é undefined enquanto a agenda do dia carrega. */
export function CourtCard({ court, free, onSelect }: { court: Court; free?: number; onSelect: () => void }) {
  const tone = free === undefined ? "" : free === 0 ? "bg-red-50 text-red-600" : free <= 4 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";
  return (
    <motion.button
      layout
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="group w-full overflow-hidden rounded-[28px] bg-white text-left shadow-[0_1px_2px_rgba(19,40,74,0.06),0_8px_24px_-12px_rgba(19,40,74,0.18)] ring-1 ring-sand-200"
    >
      <div className="relative h-32">
        <CourtIllustration type={court.type} className="absolute inset-0 size-full" />
        <CourtBadge type={court.type} className="absolute left-3 top-3 shadow-sm" />
        {free !== undefined && (
          <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${tone}`}>
            {free === 0 ? "Lotada hoje" : `${free} livres hoje`}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold tracking-tight">{court.name}</h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{courtCopy(court.type).description}</p>
          <p className="mt-2 text-sm">
            <span className="text-ink-soft">a partir de </span>
            <span className="font-extrabold">{money(court.minHourlyPriceCents)}</span>
            <span className="text-ink-soft">/h</span>
          </p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-white transition group-active:translate-x-0.5">
          <ChevronRight className="size-5" />
        </span>
      </div>
    </motion.button>
  );
}
