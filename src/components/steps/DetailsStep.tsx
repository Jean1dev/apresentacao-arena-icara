import { motion } from "framer-motion";
import { CalendarDays, Clock, Loader2, MapPin, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import type { Court } from "../../api/types";
import { LIMITS, validateForm, type DetailsForm, type FormErrors } from "../../domain/bookingForm";
import { courtCopy } from "../../domain/court";
import { SPORTS } from "../../domain/sports";
import { haptic, hh, longDate, maskPhone, money, ranges } from "../../lib/format";
import { CourtBadge } from "../CourtBadge";
import { CourtIllustration } from "../CourtIllustration";
import { Stepper } from "../Stepper";
import { TopBar } from "../TopBar";

interface Props {
  court: Court;
  dateKey: string;
  hours: number[];
  total: number;
  form: DetailsForm;
  /** Erros de campo devolvidos pela API na última tentativa. */
  serverErrors: FormErrors;
  submitting: boolean;
  onForm: (f: DetailsForm) => void;
  onBack: () => void;
  onConfirm: () => void;
}

export function DetailsStep({ court, dateKey, hours, total, form, serverErrors, submitting, onForm, onBack, onConfirm }: Props) {
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof DetailsForm>(key: K, value: DetailsForm[K]) => onForm({ ...form, [key]: value });

  const clientErrors = validateForm(form);
  const errors: FormErrors = { ...(touched ? clientErrors : {}), ...serverErrors };

  const submit = () => {
    setTouched(true);
    if (Object.keys(clientErrors).length) {
      haptic(40);
      return;
    }
    onConfirm();
  };

  return (
    <div className="pb-36">
      <TopBar title="Confirme sua reserva" subtitle="Falta pouco!" onBack={onBack} step={3} total={3} />

      {/* Resumo estilo ingresso */}
      <div className="relative mt-1 overflow-hidden rounded-[28px] bg-white ring-1 ring-sand-200">
        <div className="relative h-24">
          <CourtIllustration type={court.type} className="absolute inset-0 size-full" />
          <CourtBadge type={court.type} className="absolute left-3 top-3" />
        </div>
        <div className="space-y-3 p-4">
          <h2 className="text-xl font-extrabold tracking-tight">{court.name}</h2>
          <Row icon={CalendarDays}>{longDate(dateKey)}</Row>
          <Row icon={Clock}>
            <span className="flex flex-wrap gap-1.5">
              {ranges(hours).map(([a, b]) => (
                <span key={a} className="rounded-full bg-sand-100 px-2.5 py-0.5 text-sm font-bold">
                  {hh(a)} – {hh(b)}
                </span>
              ))}
            </span>
          </Row>
          <Row icon={MapPin}>Arena Brasil · {courtCopy(court.type).area}</Row>
        </div>
        <div className="relative flex items-center">
          <span className="absolute -left-3 size-6 rounded-full bg-sand-100" />
          <span className="mx-5 flex-1 border-t-2 border-dashed border-sand-200" />
          <span className="absolute -right-3 size-6 rounded-full bg-sand-100" />
        </div>
        <div className="flex items-center justify-between p-4">
          <span className="text-sm font-semibold text-ink-soft">
            Total · {hours.length} {hours.length === 1 ? "hora" : "horas"}
          </span>
          <span className="text-2xl font-extrabold">{money(total)}</span>
        </div>
      </div>

      <section className="mt-6">
        <p className="mb-2.5 text-sm font-bold">Modalidade</p>
        <div className="grid grid-cols-3 gap-2">
          {SPORTS.map((s) => {
            const active = s.id === form.sport;
            return (
              <motion.button
                key={s.id}
                type="button"
                aria-pressed={active}
                whileTap={{ scale: 0.95 }}
                onClick={() => (haptic(), set("sport", s.id))}
                className={`flex flex-col items-center gap-1 rounded-2xl py-3 text-xs font-bold transition ${
                  active ? "bg-ink text-white" : "bg-white ring-1 ring-sand-200"
                }`}
              >
                <span className="text-2xl leading-none">{s.emoji}</span>
                {s.name}
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="mt-6 space-y-4">
        <Field label="Seu nome" error={errors.name}>
          <input
            value={form.name}
            maxLength={LIMITS.nameMax}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="name"
            placeholder="Como te chamamos?"
            className="input"
          />
        </Field>
        <Field label="WhatsApp" hint="Para a arena falar com você" error={errors.whatsapp}>
          <input
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", maskPhone(e.target.value))}
            inputMode="tel"
            autoComplete="tel"
            placeholder="(48) 99999-9999"
            className="input"
          />
        </Field>
        <div className={`flex items-center justify-between rounded-2xl bg-white p-3 pl-4 ring-1 ${errors.players ? "ring-2 ring-danger" : "ring-sand-200"}`}>
          <span className="flex items-center gap-2.5">
            <Users className="size-5 text-ink-soft" />
            <span>
              <span className="block text-sm font-bold">Jogadores</span>
              <span className="block text-xs text-ink-soft">{money(Math.round(total / form.players))} por pessoa</span>
            </span>
          </span>
          <Stepper value={form.players} min={LIMITS.playersMin} max={LIMITS.playersMax} onChange={(v) => set("players", v)} />
        </div>
        <Field label="Observação (opcional)" hint={`${form.notes.length}/${LIMITS.notesMax}`} error={errors.notes}>
          <textarea
            value={form.notes}
            maxLength={LIMITS.notesMax}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            placeholder="Ex.: precisa de bola, raquete para alugar..."
            className="input resize-none py-3"
          />
        </Field>
        <p className="flex items-start gap-2 rounded-2xl bg-ocean-soft p-3 text-xs font-medium text-ocean">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          Pagamento único antes de entrar em quadra. Cancelamentos pelo WhatsApp da arena.
        </p>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-sand-100 via-sand-100 to-transparent px-4 pt-6 pb-safe">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={submit}
          disabled={submitting}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-base font-extrabold text-white shadow-[0_12px_30px_-10px_rgba(20,150,205,0.8)] disabled:opacity-80"
        >
          {submitting ? (
            <>
              <Loader2 className="size-5 animate-spin" /> Reservando...
            </>
          ) : (
            <>Confirmar reserva · {money(total)}</>
          )}
        </motion.button>
      </div>
    </div>
  );
}

function Row({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-[15px] font-semibold">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-sand-100">
        <Icon className="size-4 text-ink-soft" />
      </span>
      {children}
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-bold">{label}</span>
        {hint && <span className="text-[11px] text-ink-soft">{hint}</span>}
      </span>
      <span className={`block rounded-2xl ${error ? "ring-2 ring-danger" : ""}`}>{children}</span>
      {error && <span className="mt-1 block text-xs font-semibold text-danger">{error}</span>}
    </label>
  );
}
