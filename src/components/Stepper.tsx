import { Minus, Plus } from "lucide-react";
import { haptic } from "../lib/format";

export function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  const set = (v: number) => {
    haptic();
    onChange(Math.min(max, Math.max(min, v)));
  };
  return (
    <div className="flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-sand-200">
      <button
        type="button"
        aria-label="Menos"
        disabled={value <= min}
        onClick={() => set(value - 1)}
        className="grid size-10 place-items-center rounded-full bg-sand-100 disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-8 text-center text-lg font-extrabold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Mais"
        disabled={value >= max}
        onClick={() => set(value + 1)}
        className="grid size-10 place-items-center rounded-full bg-ink text-white disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
