import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAvailableSlots } from "../../api/queries";
import type { Court } from "../../api/types";
import { LIMITS } from "../../domain/bookingForm";
import { courtCopy } from "../../domain/court";
import { freeCount, totalCents, type UiDay } from "../../domain/slots";
import { haptic, longDate, money, rangesLabel } from "../../lib/format";
import { BottomSheet } from "../BottomSheet";
import { CourtBadge } from "../CourtBadge";
import { CourtIllustration } from "../CourtIllustration";
import { DayStrip } from "../DayStrip";
import { SlotGrid } from "../SlotGrid";
import { ErrorState, LoadingLabel, Skeleton } from "../StatusViews";
import { useToast } from "../toastContext";
import { TopBar } from "../TopBar";

interface Props {
  court: Court;
  courts: Court[];
  /** Datas que podem ser reservadas (hoje até +30). */
  dates: string[];
  date: string;
  /** Agenda da quadra por data; vazio enquanto carrega. */
  days: Map<string, UiDay>;
  slotsState: { isPending: boolean; isError: boolean; refetch: () => void };
  hours: number[];
  onBack: () => void;
  onDate: (dateKey: string) => void;
  onHours: (h: number[]) => void;
  onCourt: (c: Court) => void;
  onContinue: () => void;
}

export function TimeStep({ court, courts, dates, date, days, slotsState, hours, onBack, onDate, onHours, onCourt, onContinue }: Props) {
  const toast = useToast();
  const [sheet, setSheet] = useState(false);
  const day = days.get(date);
  const total = totalCents(day, hours);

  const toggle = (hour: number) => {
    haptic();
    if (hours.includes(hour)) return onHours(hours.filter((h) => h !== hour));
    if (hours.length >= LIMITS.hoursMax) {
      haptic(40);
      toast(`Dá pra reservar até ${LIMITS.hoursMax} horas por vez`, "info");
      return;
    }
    onHours([...hours, hour].sort((a, b) => a - b));
  };

  return (
    <div className="pb-40">
      <TopBar title="Escolha os horários" subtitle="Toque em um ou mais horários" onBack={onBack} step={2} total={3} />

      <button
        onClick={() => setSheet(true)}
        className="mt-1 flex w-full items-center gap-3 rounded-3xl bg-white p-2 pr-4 text-left ring-1 ring-sand-200 active:scale-[0.99]"
      >
        <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-2xl">
          <CourtIllustration type={court.type} className="absolute inset-0 size-full" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold">{court.name}</span>
          <CourtBadge type={court.type} className="mt-1 !px-2 !py-0.5 !text-[10px]" />
        </span>
        <span className="flex items-center gap-1 text-xs font-bold text-brand">
          Trocar <ChevronDown className="size-4" />
        </span>
      </button>

      <div className="mt-5">
        <p className="mb-2 text-sm font-bold">{longDate(date)}</p>
        <DayStrip
          days={dates}
          selected={date}
          onSelect={(d) => (haptic(), onDate(d))}
          freeByDay={(d) => {
            const info = days.get(d);
            return info === undefined ? undefined : info.open ? freeCount(info) : null;
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-ink-soft">
        <Legend className="bg-white ring-1 ring-sand-300" label="Livre" />
        <Legend className="bg-brand-gradient" label="Selecionado" />
        <Legend className="bg-sand-300" label="Ocupado" />
        <Legend className="bg-ocean-soft ring-1 ring-ocean/40" label="Seu" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${court.id}-${date}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="mt-5"
        >
          {slotsState.isPending ? (
            <div className="space-y-2">
              <LoadingLabel>Carregando horários...</LoadingLabel>
              <Skeleton className="h-[62px]" />
              <Skeleton className="h-[62px]" />
              <Skeleton className="h-[62px]" />
            </div>
          ) : slotsState.isError ? (
            <ErrorState onRetry={slotsState.refetch} />
          ) : day?.open === false ? (
            <EmptyDay emoji="🌙" title="Fechado neste dia" text="A arena não abre nesta data. Escolha outro dia." />
          ) : day && freeCount(day) > 0 ? (
            <SlotGrid slots={day.slots} selected={hours} onToggle={toggle} />
          ) : (
            <EmptyDay emoji="😕" title="Sem horários livres neste dia" text="Tente outro dia ou outra quadra.">
              <button onClick={() => setSheet(true)} className="mt-4 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">
                Ver outras quadras
              </button>
            </EmptyDay>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {hours.length > 0 && (
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] px-4 pb-safe"
          >
            <div className="rounded-[28px] bg-ink p-3 pl-5 text-white shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white/60">
                    {hours.length} {hours.length === 1 ? "hora" : "horas"} · {rangesLabel(hours)}
                  </p>
                  <motion.p key={total} initial={{ scale: 1.08 }} animate={{ scale: 1 }} className="origin-left text-xl font-extrabold">
                    {money(total)}
                  </motion.p>
                </div>
                <button onClick={() => onHours([])} aria-label="Limpar seleção" className="grid size-11 place-items-center rounded-full bg-white/10">
                  <Trash2 className="size-4" />
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={onContinue}
                  className="flex h-12 items-center gap-2 rounded-full bg-brand-gradient px-5 font-extrabold"
                >
                  Continuar <ArrowRight className="size-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Trocar de quadra">
        <CourtSwitcher
          courts={courts}
          current={court.id}
          date={date}
          enabled={sheet}
          onPick={(c) => {
            onCourt(c);
            setSheet(false);
          }}
        />
      </BottomSheet>
    </div>
  );
}

function CourtSwitcher({
  courts,
  current,
  date,
  enabled,
  onPick,
}: {
  courts: Court[];
  current: string;
  date: string;
  enabled: boolean;
  onPick: (c: Court) => void;
}) {
  const free = useAvailableSlots(date, enabled);
  const count = (courtId: string) => free.data?.slots.filter((s) => s.courtId === courtId).length;
  return (
    <div className="space-y-2.5 pb-2">
      {courts.map((c) => {
        const n = count(c.id);
        return (
          <button
            key={c.id}
            onClick={() => onPick(c)}
            className={`flex w-full items-center gap-3 rounded-3xl bg-white p-2 pr-4 text-left ring-2 transition ${c.id === current ? "ring-brand" : "ring-transparent"}`}
          >
            <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl">
              <CourtIllustration type={c.type} className="absolute inset-0 size-full" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold">{c.name}</span>
              <span className="block text-xs text-ink-soft">
                {courtCopy(c.type).label} · {money(c.minHourlyPriceCents)}/h
              </span>
            </span>
            {n !== undefined && (
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${n === 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                {n} livres
              </span>
            )}
          </button>
        );
      })}
      <p className="pt-1 text-center text-xs text-ink-soft">Disponibilidade para {longDate(date).toLowerCase()}</p>
    </div>
  );
}

function EmptyDay({ emoji, title, text, children }: { emoji: string; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-6 text-center ring-1 ring-sand-200">
      <p className="text-3xl">{emoji}</p>
      <p className="mt-2 font-bold">{title}</p>
      <p className="mt-1 text-sm text-ink-soft">{text}</p>
      {children}
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-3 rounded-[5px] ${className}`} />
      {label}
    </span>
  );
}
