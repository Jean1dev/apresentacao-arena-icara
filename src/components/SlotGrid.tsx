import { motion } from "framer-motion";
import { Check, Moon, Sun, Sunrise } from "lucide-react";
import type { UiSlot } from "../domain/slots";
import { hh, money } from "../lib/format";

const PERIODS = [
  { label: "Manhã", icon: Sunrise, from: 0, to: 12 },
  { label: "Tarde", icon: Sun, from: 12, to: 17 },
  { label: "Noite", icon: Moon, from: 17, to: 24 },
];

interface Props {
  slots: UiSlot[];
  selected: number[];
  onToggle: (hour: number) => void;
}

export function SlotGrid({ slots, selected, onToggle }: Props) {
  return (
    <div className="space-y-6">
      {PERIODS.map(({ label, icon: Icon, from, to }) => {
        const list = slots.filter((s) => s.hour >= from && s.hour < to);
        if (!list.length) return null;
        const free = list.filter((s) => s.status === "livre").length;
        return (
          <section key={label}>
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <Icon className="size-4 text-ink-soft" />
                {label}
              </h3>
              <span className="text-xs font-medium text-ink-soft">{free} livres</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {list.map((s) => (
                <SlotButton key={s.hour} slot={s} active={selected.includes(s.hour)} onToggle={() => onToggle(s.hour)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SlotButton({ slot, active, onToggle }: { slot: UiSlot; active: boolean; onToggle: () => void }) {
  if (slot.status === "ocupado") {
    return (
      <div className="flex h-[62px] flex-col items-center justify-center rounded-2xl bg-sand-200/60 text-ink-soft/60">
        <span className="text-[15px] font-bold line-through decoration-2">{hh(slot.hour)}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide">Ocupado</span>
      </div>
    );
  }
  if (slot.status === "seu") {
    return (
      <div className="flex h-[62px] flex-col items-center justify-center rounded-2xl bg-ocean-soft text-ocean ring-1 ring-ocean/30">
        <span className="text-[15px] font-bold">{hh(slot.hour)}</span>
        <span className="text-[10px] font-bold uppercase tracking-wide">Sua reserva</span>
      </div>
    );
  }
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onToggle}
      aria-pressed={active}
      className={`relative flex h-[62px] flex-col items-center justify-center rounded-2xl transition-colors ${
        active ? "bg-brand-gradient text-white shadow-[0_8px_20px_-8px_rgba(20,150,205,0.7)]" : "bg-white ring-1 ring-sand-200"
      }`}
    >
      {active && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-white text-brand"
        >
          <Check className="size-3" strokeWidth={3.5} />
        </motion.span>
      )}
      <span className="text-[15px] font-extrabold">{hh(slot.hour)}</span>
      <span className={`text-[11px] font-semibold ${active ? "text-white/85" : "text-ink-soft"}`}>{money(slot.priceCents)}</span>
    </motion.button>
  );
}
