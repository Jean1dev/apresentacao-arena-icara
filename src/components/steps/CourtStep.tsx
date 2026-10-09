import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { useAvailableSlots, useBusinessHours, useCourts } from "../../api/queries";
import type { BusinessHours, Court, CourtType, FreeSlot, Sport } from "../../api/types";
import { ARENA } from "../../data/arena";
import { SPORTS } from "../../domain/sports";
import { addDaysKey, currentHour, hourOf, todayKey, weekdayOf } from "../../lib/businessDate";
import { hh, money } from "../../lib/format";
import { CourtCard } from "../CourtCard";
import { ErrorState, LoadingLabel, Skeleton } from "../StatusViews";

type Filter = "todas" | CourtType;

const FILTERS: [Filter, string][] = [
  ["todas", "Todas"],
  ["INDOOR", "Cobertas"],
  ["OUTDOOR", "Ao ar livre"],
];

const QUICK_PICKS = 10;

interface Props {
  sport: Sport;
  onSport: (s: Sport) => void;
  onSelectCourt: (court: Court) => void;
  onQuickPick: (courtId: string, dateKey: string, hour: number) => void;
  firstName: string;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function isOpenNow(hours: BusinessHours, today: string) {
  const window = hours.days.find((d) => d.weekday === weekdayOf(today));
  const hour = currentHour();
  return !!window && window.openHour <= hour && hour < window.closeHour;
}

export function CourtStep({ sport, onSport, onSelectCourt, onQuickPick, firstName }: Props) {
  const [filter, setFilter] = useState<Filter>("todas");
  const today = todayKey();
  const tomorrow = addDaysKey(today, 1);

  const courts = useCourts();
  const businessHours = useBusinessHours();
  const freeToday = useAvailableSlots(today);
  // Se hoje já não tem nada livre, as sugestões rápidas vêm de amanhã.
  const todayEmpty = freeToday.isSuccess && freeToday.data.slots.length === 0;
  const freeTomorrow = useAvailableSlots(tomorrow, todayEmpty);
  const quick = todayEmpty ? { day: tomorrow, slots: freeTomorrow.data?.slots ?? [] } : { day: today, slots: freeToday.data?.slots ?? [] };

  const freeByCourt = useMemo(() => countByCourt(freeToday.data?.slots), [freeToday.data]);
  const list = (courts.data ?? []).filter((c) => filter === "todas" || c.type === filter);
  const openNow = businessHours.data && isOpenNow(businessHours.data, today);

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
          {businessHours.data &&
            (openNow ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                Aberto
              </span>
            ) : (
              <span className="rounded-full bg-sand-200 px-3 py-1.5 text-xs font-bold text-ink-soft">Fechado agora</span>
            ))}
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
                aria-pressed={active}
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

      {quick.slots.length > 0 && (
        <section className="mt-7">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <Zap className="size-4 fill-lime text-lime" />
              Livres {quick.day === today ? "hoje" : "amanhã"}
            </p>
            <span className="text-xs font-medium text-ink-soft">toque para reservar</span>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {quick.slots.slice(0, QUICK_PICKS).map((s) => (
              <motion.button
                key={`${s.courtId}-${s.start}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => onQuickPick(s.courtId, quick.day, hourOf(s.start))}
                className="flex shrink-0 flex-col items-start rounded-2xl bg-white px-3.5 py-2.5 text-left ring-1 ring-sand-200"
              >
                <span className="text-lg font-extrabold leading-tight">{hh(hourOf(s.start))}</span>
                <span className="text-[11px] font-semibold text-ink-soft">
                  {s.courtName} · {money(s.priceCents)}
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
          {FILTERS.map(([value, label]) => (
            <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className="relative h-10 text-sm font-bold">
              {filter === value && (
                <motion.span
                  layoutId="filter-pill"
                  className="absolute inset-0 rounded-xl bg-white shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className={`relative ${filter === value ? "text-ink" : "text-ink-soft"}`}>{label}</span>
            </button>
          ))}
        </div>

        {courts.isPending ? (
          <div className="space-y-4">
            <LoadingLabel>Carregando quadras...</LoadingLabel>
            <Skeleton className="h-60" />
            <Skeleton className="h-60" />
          </div>
        ) : courts.isError ? (
          <ErrorState message="Não foi possível carregar as quadras." onRetry={() => courts.refetch()} />
        ) : list.length === 0 ? (
          <p className="rounded-3xl bg-white p-6 text-center text-sm text-ink-soft ring-1 ring-sand-200">Nenhuma quadra disponível no momento.</p>
        ) : (
          <motion.div layout className="space-y-4">
            {list.map((c) => (
              <CourtCard key={c.id} court={c} free={freeToday.isSuccess ? (freeByCourt.get(c.id) ?? 0) : undefined} onSelect={() => onSelectCourt(c)} />
            ))}
          </motion.div>
        )}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-ink-soft">
          <Sparkles className="size-3.5" /> Cobertas jogam até com chuva
        </p>
      </section>
    </div>
  );
}

function countByCourt(slots: FreeSlot[] = []) {
  const map = new Map<string, number>();
  for (const s of slots) map.set(s.courtId, (map.get(s.courtId) ?? 0) + 1);
  return map;
}
