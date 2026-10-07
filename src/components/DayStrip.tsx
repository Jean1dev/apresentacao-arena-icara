import { format, isSameDay, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
import { useEffect, useRef } from "react";

interface Props {
  days: Date[];
  selected: Date;
  onSelect: (d: Date) => void;
  freeByDay: (d: Date) => number;
}

export function DayStrip({ days, selected, onSelect, freeByDay }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[data-active=true]")?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <div ref={ref} className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 py-1">
      {days.map((d) => {
        const active = isSameDay(d, selected);
        const free = freeByDay(d);
        const label = isToday(d) ? "Hoje" : isTomorrow(d) ? "Amanhã" : WEEKDAYS[d.getDay()];
        return (
          <motion.button
            key={d.toISOString()}
            data-active={active}
            whileTap={{ scale: 0.94 }}
            onClick={() => onSelect(d)}
            className={`relative flex w-[68px] shrink-0 snap-center flex-col items-center rounded-2xl py-2.5 transition-colors ${
              active ? "text-white" : "bg-white text-ink ring-1 ring-sand-200"
            }`}
          >
            {active && <motion.span layoutId="day-pill" className="absolute inset-0 rounded-2xl bg-ink" transition={{ type: "spring", bounce: 0.25, duration: 0.45 }} />}
            <span className={`relative text-[11px] font-semibold capitalize ${active ? "text-white/70" : "text-ink-soft"}`}>{label}</span>
            <span className="relative text-xl font-extrabold leading-tight">{format(d, "d")}</span>
            <span className={`relative text-[10px] font-semibold capitalize ${active ? "text-white/70" : "text-ink-soft"}`}>
              {format(d, "MMM", { locale: ptBR }).replace(".", "")}
            </span>
            <span
              className={`relative mt-1 size-1.5 rounded-full ${free === 0 ? "bg-red-400" : free <= 4 ? "bg-amber-400" : "bg-emerald-400"}`}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
