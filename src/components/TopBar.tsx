import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  step?: number;
  total?: number;
  right?: ReactNode;
}

export function TopBar({ title, subtitle, onBack, step, total, right }: Props) {
  return (
    <header className="sticky top-0 z-20 -mx-4 bg-sand-100/85 px-4 pt-safe pb-3 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} aria-label="Voltar" className="grid size-11 shrink-0 place-items-center rounded-full bg-white ring-1 ring-sand-200 active:scale-95">
            <ArrowLeft className="size-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {step && total && (
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
              Passo {step} de {total}
            </p>
          )}
          <h1 className="truncate text-xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="truncate text-sm text-ink-soft">{subtitle}</p>}
        </div>
        {right}
      </div>
      {step && total && (
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-sand-200">
              <span
                className="block h-full rounded-full bg-brand-gradient transition-all duration-500"
                style={{ width: i < step ? "100%" : "0%" }}
              />
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
