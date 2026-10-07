import { addDays, isToday } from "date-fns";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { ARENA, COURTS, SPORTS, type Court, type CourtType, type SportId } from "../../data/arena";
import { freeCount, slotsFor } from "../../lib/availability";
import { hh, money } from "../../lib/format";
import type { Booking } from "../../lib/storage";
import { CourtCard } from "../CourtCard";

type Filter = "todas" | CourtType;

interface Props {
  bookings: Booking[];
  sport: SportId;
  onSport: (s: SportId) => void;
  onSelectCourt: (court: Court) => void;
  onQuickPick: (court: Court, date: Date, hour: number) => void;
  firstName: string;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export function CourtStep({ bookings, sport, onSport, onSelectCourt, onQuickPick, firstName }: Props) {
  const [filter, setFilter] = useState<Filter>("todas");
  const today = new Date();

  const quick = useMemo(() => {
    // Hoje, ou amanhã se o dia já acabou.
    let day = new Date();
    let picks = collectFree(day, bookings);
    if (!picks.length) {
      day = addDays(day, 1);
      picks = collectFree(day, bookings);
    }
    return { day, picks: picks.slice(0, 10) };
  }, [bookings]);

  const courts = COURTS.filter((c) => filter === "todas" || c.type === filter);

  return (
    <div className="pb-32">
      <header className="pt-safe">
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpeg" alt="Arena Brasil" className="size-12 rounded-full shadow-md ring-2 ring-white" />
            <div className="leading-tight">
              <p className="text-[15px] font-extrabold tracking-tight">{ARENA.name}</p>
              <p className="text-xs font-medium text-ink-soft">{ARENA.tagline}</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Aberto
          </span>
        </div>

        <h1 className="mt-7 text-[32px] font-extrabold leading-[1.05] tracking-tight">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}!<br />
          <span className="text-brand-gradient">Bora pra areia?</span>
        </h1>
      </header>

      <section className="mt-6">
        <p className="mb-2.5 text-sm font-bold">O que você vai jogar?</p>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {SPORTS.map((s) => {
            const active = s.id === sport;
            return (
              <motion.button
                key={s.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSport(s.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full py-2.5 pr-4 pl-3 text-sm font-bold transition-colors ${
                  active ? "bg-ink text-white" : "bg-white ring-1 ring-sand-200"
                }`}
              >
                <span className="text-lg leading-none">{s.emoji}</span>
                {s.name}
              </motion.button>
            );
          })}
        </div>
      </section>

      {quick.picks.length > 0 && (
        <section className="mt-7">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <Zap className="size-4 fill-lime text-lime" />
              Livres {isToday(quick.day) ? "hoje" : "amanhã"}
            </p>
            <span className="text-xs font-medium text-ink-soft">toque para reservar</span>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {quick.picks.map(({ court, hour, price }) => (
              <motion.button
                key={`${court.id}-${hour}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => onQuickPick(court, quick.day, hour)}
                className="flex shrink-0 flex-col items-start rounded-2xl bg-white px-3.5 py-2.5 text-left ring-1 ring-sand-200"
              >
                <span className="text-lg font-extrabold leading-tight">{hh(hour)}</span>
                <span className="text-[11px] font-semibold text-ink-soft">
                  {court.name} · {money(price)}
                </span>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tight">Escolha a quadra</h2>
        </div>
        <div className="mb-4 grid grid-cols-3 rounded-2xl bg-sand-200/70 p-1">
          {(
            [
              ["todas", "Todas"],
              ["coberta", "Cobertas"],
              ["descoberta", "Ao ar livre"],
            ] as [Filter, string][]
          ).map(([value, label]) => (
            <button key={value} onClick={() => setFilter(value)} className="relative h-10 text-sm font-bold">
              {filter === value && (
                <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
              )}
              <span className={`relative ${filter === value ? "text-ink" : "text-ink-soft"}`}>{label}</span>
            </button>
          ))}
        </div>
        <motion.div layout className="space-y-4">
          {courts.map((c) => (
            <CourtCard key={c.id} court={c} free={freeCount(c, today, bookings)} onSelect={() => onSelectCourt(c)} />
          ))}
        </motion.div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-ink-soft">
          <Sparkles className="size-3.5" /> Cobertas jogam até com chuva
        </p>
      </section>
    </div>
  );
}

function collectFree(day: Date, bookings: Booking[]) {
  return COURTS.flatMap((court) =>
    slotsFor(court, day, bookings)
      .filter((s) => s.status === "livre")
      .map((s) => ({ court, hour: s.hour, price: s.price })),
  ).sort((a, b) => a.hour - b.hour || a.court.number - b.court.number);
}
