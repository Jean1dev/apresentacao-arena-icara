import { motion } from "framer-motion";
import { CalendarPlus, Check, Share2 } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getCourt, getSport } from "../../data/arena";
import { bookingSummary, downloadIcs, hh, longDate, money, ranges } from "../../lib/format";
import type { Booking } from "../../lib/storage";
import { CourtBadge } from "../CourtBadge";
import { useToast } from "../Toast";

const COLORS = ["#1AA9DE", "#8CC63F", "#13284A", "#4FC3E8", "#B5DA6A"];

export function SuccessStep({ booking, onNew }: { booking: Booking; onNew: () => void }) {
  const toast = useToast();
  const court = getCourt(booking.courtId);
  const sport = getSport(booking.sport);

  const confetti = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.4,
        rotate: Math.random() * 720 - 360,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
        duration: 1.6 + Math.random() * 1.2,
      })),
    [],
  );

  const share = async () => {
    const text = bookingSummary(booking);
    try {
      if (navigator.share) await navigator.share({ title: "Reserva Arena Brasil", text });
      else {
        await navigator.clipboard.writeText(text);
        toast("Copiado! É só colar no grupo");
      }
    } catch {
      /* usuário cancelou o compartilhamento */
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden pt-safe pb-safe">
      <div className="pointer-events-none fixed inset-0 z-0 mx-auto max-w-[480px] overflow-hidden">
        {confetti.map((c) => (
          <motion.span
            key={c.id}
            className="absolute top-0 rounded-[2px]"
            style={{ left: `${c.x}%`, width: c.size, height: c.size * 0.45, background: c.color }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{ y: "105vh", opacity: [1, 1, 0], rotate: c.rotate }}
            transition={{ duration: c.duration, delay: c.delay, ease: "easeIn" }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center pt-10 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="grid size-24 place-items-center rounded-full bg-brand-gradient shadow-[0_20px_40px_-12px_rgba(20,150,205,0.7)]"
        >
          <Check className="size-12 text-white" strokeWidth={3} />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 text-3xl font-extrabold tracking-tight">
          Reserva confirmada!
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-2 max-w-xs text-ink-soft">
          Te vemos na areia, {booking.name.split(" ")[0]} {sport.emoji}
          <br />A confirmação vai pro seu WhatsApp.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: "spring", damping: 20 }}
          className="mt-8 w-full overflow-hidden rounded-[28px] bg-white text-left ring-1 ring-sand-200"
        >
          <div className="bg-ink p-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-white/60">Código</span>
              <CourtBadge type={court.type} className="!bg-white/15 !text-white" />
            </div>
            <p className="mt-1 font-mono text-2xl font-bold tracking-wider">{booking.id}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4">
            <Info label="Quadra" value={court.name} />
            <Info label="Modalidade" value={sport.name} />
            <Info label="Data" value={longDate(booking.date)} wide />
            <Info label="Horário" value={ranges(booking.hours).map(([a, b]) => `${hh(a)}–${hh(b)}`).join(" · ")} />
            <Info label="Total" value={money(booking.total)} />
          </div>
        </motion.div>

        <div className="mt-4 grid w-full grid-cols-2 gap-2">
          <button onClick={() => downloadIcs(booking)} className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-sm font-bold ring-1 ring-sand-200 active:scale-[0.98]">
            <CalendarPlus className="size-4" /> Agenda
          </button>
          <button onClick={share} className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-sm font-bold ring-1 ring-sand-200 active:scale-[0.98]">
            <Share2 className="size-4" /> Chamar a galera
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-8 space-y-2">
        <button onClick={onNew} className="h-14 w-full rounded-full bg-ink text-base font-extrabold text-white active:scale-[0.98]">
          Fazer outra reserva
        </button>
        <Link to="/minhas-reservas" className="flex h-12 w-full items-center justify-center text-sm font-bold text-ink-soft">
          Ver minhas reservas
        </Link>
      </div>
    </div>
  );
}

function Info({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">{label}</p>
      <p className="mt-0.5 font-bold">{value}</p>
    </div>
  );
}
