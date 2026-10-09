import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCourts } from "../api/queries";
import type { Booking, CourtType } from "../api/types";
import { BottomSheet } from "../components/BottomSheet";
import { CourtBadge } from "../components/CourtBadge";
import { TabBar } from "../components/TabBar";
import { useToast } from "../components/toastContext";
import { env } from "../config/env";
import { bookingHours, byStart, isUpcoming, shortId } from "../domain/booking";
import { getSport } from "../domain/sports";
import { useBookings } from "../hooks/useBookings";
import { bookingSummary, cancelRequestUrl, downloadIcs, longDate, money, rangesLabel } from "../lib/format";

type Tab = "proximas" | "historico";

export default function MyBookings() {
  const bookings = useBookings();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("proximas");
  const [toCancel, setToCancel] = useState<Booking | null>(null);
  const courts = useCourts();
  const courtType = (courtId: string) => courts.data?.find((c) => c.id === courtId)?.type;

  const upcoming = bookings.filter((b) => isUpcoming(b)).sort(byStart);
  const history = bookings.filter((b) => !isUpcoming(b)).sort((a, b) => byStart(b, a));
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
              courtType={courtType(b.courtId)}
              active={tab === "proximas"}
              onCancel={env.arenaWhatsapp ? () => setToCancel(b) : undefined}
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
              {tab === "proximas" ? "Reserve uma quadra em menos de 1 minuto." : "Reservas já jogadas aparecem aqui."}
            </p>
            {tab === "proximas" && (
              <Link to="/" className="mt-5 inline-flex h-12 items-center rounded-full bg-brand-gradient px-6 font-extrabold text-white">
                Reservar agora
              </Link>
            )}
          </div>
        )}
      </div>

      <BottomSheet open={!!toCancel} onClose={() => setToCancel(null)} title="Pedir cancelamento?">
        {toCancel && env.arenaWhatsapp && (
          <div className="pb-2">
            <p className="text-ink-soft">
              {toCancel.courtName} · {longDate(toCancel.date)} · {rangesLabel(bookingHours(toCancel))}
            </p>
            <p className="mt-2 text-sm text-ink-soft">O cancelamento é feito pela arena. Vamos abrir o WhatsApp com a mensagem pronta.</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button onClick={() => setToCancel(null)} className="h-12 rounded-full bg-white font-bold ring-1 ring-sand-200">
                Voltar
              </button>
              <a
                href={cancelRequestUrl(toCancel, env.arenaWhatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setToCancel(null)}
                className="flex h-12 items-center justify-center rounded-full bg-[#25D366] font-bold text-white"
              >
                Abrir WhatsApp
              </a>
            </div>
          </div>
        )}
      </BottomSheet>

      <TabBar badge={upcoming.length} />
    </div>
  );
}

interface CardProps {
  booking: Booking;
  courtType?: CourtType;
  active: boolean;
  /** Ausente quando o WhatsApp da arena não está configurado. */
  onCancel?: () => void;
  onShare: () => void;
}

function BookingCard({ booking, courtType, active, onCancel, onShare }: CardProps) {
  const sport = getSport(booking.sport);
  const d = parseISO(booking.date);
  const details = [sport && `${sport.emoji} ${sport.name}`, booking.players && `${booking.players} jogadores`, money(booking.totalPriceCents)].filter(Boolean);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="overflow-hidden rounded-[28px] bg-white ring-1 ring-sand-200"
    >
      <div className="flex gap-4 p-4">
        <div className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-2xl py-2 ${active ? "bg-brand-gradient text-white" : "bg-sand-100"}`}>
          <span className="text-[11px] font-bold uppercase opacity-80">{format(d, "EEE", { locale: ptBR }).replace(".", "")}</span>
          <span className="text-2xl font-extrabold leading-none">{format(d, "dd")}</span>
          <span className="text-[11px] font-bold uppercase opacity-80">{format(d, "MMM", { locale: ptBR }).replace(".", "")}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-lg font-extrabold">{booking.courtName}</p>
            {courtType && <CourtBadge type={courtType} className="!px-2 !py-0.5 !text-[10px]" />}
          </div>
          <p className="text-sm font-semibold">{rangesLabel(bookingHours(booking))}</p>
          <p className="mt-0.5 text-xs text-ink-soft">{details.join(" · ")}</p>
          <p className="mt-1 font-mono text-[11px] text-ink-soft">{shortId(booking.id)}</p>
        </div>
      </div>
      {active && (
        <div className={`grid border-t border-sand-200 text-xs font-bold ${onCancel ? "grid-cols-3" : "grid-cols-2"}`}>
          <button onClick={() => downloadIcs(booking)} className="flex h-11 items-center justify-center gap-1.5 active:bg-sand-100">
            <CalendarPlus className="size-4" /> Agenda
          </button>
          <button onClick={onShare} className="flex h-11 items-center justify-center gap-1.5 border-l border-sand-200 active:bg-sand-100">
            <Share2 className="size-4" /> Enviar
          </button>
          {onCancel && (
            <button onClick={onCancel} className="flex h-11 items-center justify-center gap-1.5 border-l border-sand-200 text-danger active:bg-red-50">
              <MessageCircle className="size-4" /> Cancelar
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
