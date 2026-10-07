import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, Share2, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BottomSheet } from "../components/BottomSheet";
import { CourtBadge } from "../components/CourtBadge";
import { TabBar } from "../components/TabBar";
import { useToast } from "../components/Toast";
import { getCourt, getSport } from "../data/arena";
import { useBookings } from "../hooks/useBookings";
import { toKey } from "../lib/availability";
import { bookingSummary, downloadIcs, longDate, money, rangesLabel } from "../lib/format";
import { cancelBooking, type Booking } from "../lib/storage";

type Tab = "proximas" | "historico";

export default function MyBookings() {
  const bookings = useBookings();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("proximas");
  const [toCancel, setToCancel] = useState<Booking | null>(null);
  const today = toKey(new Date());

  const upcoming = bookings
    .filter((b) => b.status === "confirmada" && b.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.hours[0] - b.hours[0]);
  const history = bookings.filter((b) => !upcoming.includes(b));
  const list = tab === "proximas" ? upcoming : history;

  return (
    <div className="px-4 pb-32">
      <header className="pt-safe">
        <h1 className="pt-6 text-[32px] font-extrabold tracking-tight">Minhas reservas</h1>
        <p className="text-ink-soft">Seus jogos marcados na Arena Brasil</p>
      </header>

      <div className="mt-5 grid grid-cols-2 rounded-2xl bg-sand-200/70 p-1">
        {(
          [
            ["proximas", `Próximas (${upcoming.length})`],
            ["historico", "Histórico"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button key={value} onClick={() => setTab(value)} className="relative h-10 text-sm font-bold">
            {tab === value && <motion.span layoutId="mb-pill" className="absolute inset-0 rounded-xl bg-white shadow-sm" />}
            <span className={`relative ${tab === value ? "text-ink" : "text-ink-soft"}`}>{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <AnimatePresence initial={false}>
          {list.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              active={tab === "proximas"}
              onCancel={() => setToCancel(b)}
              onShare={async () => {
                const text = bookingSummary(b);
                try {
                  if (navigator.share) await navigator.share({ text });
                  else {
                    await navigator.clipboard.writeText(text);
                    toast("Copiado!");
                  }
                } catch {
                  /* cancelado */
                }
              }}
            />
          ))}
        </AnimatePresence>
        {!list.length && (
          <div className="rounded-[28px] bg-white px-6 py-10 text-center ring-1 ring-sand-200">
            <p className="text-5xl">{tab === "proximas" ? "🏐" : "🗂️"}</p>
            <p className="mt-3 text-lg font-extrabold">{tab === "proximas" ? "Nenhum jogo marcado" : "Nada por aqui ainda"}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {tab === "proximas" ? "Reserve uma quadra em menos de 1 minuto." : "Reservas passadas e canceladas aparecem aqui."}
            </p>
            {tab === "proximas" && (
              <Link to="/" className="mt-5 inline-flex h-12 items-center rounded-full bg-brand-gradient px-6 font-extrabold text-white">
                Reservar agora
              </Link>
            )}
          </div>
        )}
      </div>

      <BottomSheet open={!!toCancel} onClose={() => setToCancel(null)} title="Cancelar reserva?">
        {toCancel && (
          <div className="pb-2">
            <p className="text-ink-soft">
              {getCourt(toCancel.courtId).name} · {longDate(toCancel.date)} · {rangesLabel(toCancel.hours)}
            </p>
            <p className="mt-2 text-sm text-ink-soft">Os horários voltam a ficar livres para outros alunos.</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button onClick={() => setToCancel(null)} className="h-12 rounded-full bg-white font-bold ring-1 ring-sand-200">
                Manter
              </button>
              <button
                onClick={() => {
                  cancelBooking(toCancel.id);
                  setToCancel(null);
                  toast("Reserva cancelada");
                }}
                className="h-12 rounded-full bg-danger font-bold text-white"
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      <TabBar badge={upcoming.length} />
    </div>
  );
}

function BookingCard({ booking, active, onCancel, onShare }: { booking: Booking; active: boolean; onCancel: () => void; onShare: () => void }) {
  const court = getCourt(booking.courtId);
  const sport = getSport(booking.sport);
  const d = parseISO(booking.date);
  const cancelled = booking.status === "cancelada";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className={`overflow-hidden rounded-[28px] bg-white ring-1 ring-sand-200 ${cancelled ? "opacity-60" : ""}`}
    >
      <div className="flex gap-4 p-4">
        <div className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-2xl py-2 ${active ? "bg-brand-gradient text-white" : "bg-sand-100"}`}>
          <span className="text-[11px] font-bold uppercase opacity-80">{format(d, "EEE", { locale: ptBR }).replace(".", "")}</span>
          <span className="text-2xl font-extrabold leading-none">{format(d, "dd")}</span>
          <span className="text-[11px] font-bold uppercase opacity-80">{format(d, "MMM", { locale: ptBR }).replace(".", "")}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-lg font-extrabold">{court.name}</p>
            {cancelled ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">Cancelada</span>
            ) : (
              <CourtBadge type={court.type} className="!px-2 !py-0.5 !text-[10px]" />
            )}
          </div>
          <p className="text-sm font-semibold">{rangesLabel(booking.hours)}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {sport.emoji} {sport.name} · {booking.players} jogadores · {money(booking.total)}
          </p>
          <p className="mt-1 font-mono text-[11px] text-ink-soft">{booking.id}</p>
        </div>
      </div>
      {active && (
        <div className="grid grid-cols-3 border-t border-sand-200 text-xs font-bold">
          <button onClick={() => downloadIcs(booking)} className="flex h-11 items-center justify-center gap-1.5 active:bg-sand-100">
            <CalendarPlus className="size-4" /> Agenda
          </button>
          <button onClick={onShare} className="flex h-11 items-center justify-center gap-1.5 border-x border-sand-200 active:bg-sand-100">
            <Share2 className="size-4" /> Enviar
          </button>
          <button onClick={onCancel} className="flex h-11 items-center justify-center gap-1.5 text-danger active:bg-red-50">
            <X className="size-4" /> Cancelar
          </button>
        </div>
      )}
    </motion.div>
  );
}
