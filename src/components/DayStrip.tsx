import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { addDaysKey } from "../lib/businessDate";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface Props {
  /** Datas `YYYY-MM-DD`; a primeira é hoje. */
  days: string[];
  selected: string;
  onSelect: (dateKey: string) => void;
  /** undefined enquanto carrega; null quando a arena não abre no dia. */
  freeByDay: (dateKey: string) => number | null | undefined;
}

export function DayStrip({ days, selected, onSelect, freeByDay }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const today = days[0];
  const tomorrow = today && addDaysKey(today, 1);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[data-active=true]")?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <div ref={ref} className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 py-1">
      {days.map((key) => {
        const d = parseISO(key);
        const active = key === selected;
        const free = freeByDay(key);
        const label = key === today ? "Hoje" : key === tomorrow ? "Amanhã" : WEEKDAYS[d.getDay()];
        const dot =
          free === undefined ? "bg-transparent" : free === null ? "bg-sand-300" : free === 0 ? "bg-red-400" : free <= 4 ? "bg-amber-400" : "bg-emerald-400";
        return (
          <motion.button
            key={key}
            data-active={active}
            aria-pressed={active}
            aria-label={format(d, "EEEE, d 'de' MMMM", { locale: ptBR })}
            whileTap={{ scale: 0.94 }}
            onClick={() => onSelect(key)}
            className={`relative flex w-[68px] shrink-0 snap-center flex-col items-center rounded-2xl py-2.5 transition-colors ${
              active ? "text-white" : "bg-white text-ink ring-1 ring-sand-200"
            }`}
          >
            {active && (
              <motion.span layoutId="day-pill" className="absolute inset-0 rounded-2xl bg-ink" transition={{ type: "spring", bounce: 0.25, duration: 0.45 }} />
            )}
            <span className={`relative text-[11px] font-semibold capitalize ${active ? "text-white/70" : "text-ink-soft"}`}>{label}</span>
            <span className="relative text-xl font-extrabold leading-tight">{format(d, "d")}</span>
            <span className={`relative text-[10px] font-semibold capitalize ${active ? "text-white/70" : "text-ink-soft"}`}>
              {format(d, "MMM", { locale: ptBR }).replace(".", "")}
            </span>
            <span className={`relative mt-1 size-1.5 rounded-full ${dot}`} />
          </motion.button>
        );
      })}
    </div>
  );
}
