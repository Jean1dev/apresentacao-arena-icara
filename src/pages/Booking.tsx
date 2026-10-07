import { startOfDay } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCourt, type Court, type SportId } from "../data/arena";
import { useBookings } from "../hooks/useBookings";
import { slotsFor, toKey } from "../lib/availability";
import { getProfile, saveBooking, saveProfile, type Booking as BookingT } from "../lib/storage";
import { CourtStep } from "../components/steps/CourtStep";
import { DetailsStep, type DetailsForm } from "../components/steps/DetailsStep";
import { SuccessStep } from "../components/steps/SuccessStep";
import { TimeStep } from "../components/steps/TimeStep";
import { TabBar } from "../components/TabBar";
import { useToast } from "../components/Toast";

type Step = "quadra" | "horarios" | "dados" | "sucesso";

function newCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "ABR-" + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const bookings = useBookings();

  const [court, setCourt] = useState<Court | null>(null);
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [hours, setHours] = useState<number[]>([]);
  const [confirmed, setConfirmed] = useState<BookingT | null>(null);
  const [form, setForm] = useState<DetailsForm>(() => ({ ...getProfile(), sport: "beach-tennis", players: 4, notes: "" }));

  // A etapa vive na URL para o botão "voltar" do celular funcionar naturalmente.
  const requested = (params.get("etapa") as Step) || "quadra";
  const step: Step =
    requested === "sucesso" && confirmed ? "sucesso" : !court || requested === "sucesso" ? "quadra" : requested === "dados" && !hours.length ? "horarios" : requested;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const go = (next: Step, replace = false) => navigate(next === "quadra" ? "/" : `/?etapa=${next}`, { replace });

  const selectCourt = (c: Court) => {
    setCourt(c);
    setHours([]);
    go("horarios");
  };

  const switchCourt = (c: Court) => {
    const free = new Set(slotsFor(c, date, bookings).filter((s) => s.status === "livre").map((s) => s.hour));
    const kept = hours.filter((h) => free.has(h));
    if (kept.length < hours.length) toast(`${hours.length - kept.length} horário(s) não estão livres na ${c.name}`, "info");
    setCourt(c);
    setHours(kept);
  };

  const quickPick = (c: Court, d: Date, hour: number) => {
    setCourt(c);
    setDate(startOfDay(d));
    setHours([hour]);
    go("horarios");
  };

  const total = court ? slotsFor(court, date, bookings).filter((s) => hours.includes(s.hour)).reduce((sum, s) => sum + s.price, 0) : 0;

  const confirm = async () => {
    if (!court) return;
    await new Promise((r) => setTimeout(r, 900)); // simula a chamada ao servidor
    const booking: BookingT = {
      id: newCode(),
      courtId: court.id,
      date: toKey(date),
      hours,
      sport: form.sport,
      name: form.name.trim(),
      phone: form.phone,
      players: form.players,
      notes: form.notes.trim(),
      total,
      createdAt: new Date().toISOString(),
      status: "confirmada",
    };
    saveBooking(booking);
    saveProfile({ name: booking.name, phone: booking.phone });
    setConfirmed(booking);
    setHours([]);
    go("sucesso", true);
  };

  const upcoming = bookings.filter((b) => b.status === "confirmada" && b.date >= toKey(new Date())).length;

  return (
    <div className="px-4">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {step === "quadra" && (
            <CourtStep
              bookings={bookings}
              sport={form.sport}
              onSport={(sport: SportId) => setForm((f) => ({ ...f, sport }))}
              onSelectCourt={selectCourt}
              onQuickPick={quickPick}
              firstName={form.name.trim().split(" ")[0]}
            />
          )}
          {step === "horarios" && court && (
            <TimeStep
              court={court}
              date={date}
              hours={hours}
              bookings={bookings}
              onBack={() => navigate(-1)}
              onDate={(d) => {
                setDate(d);
                setHours([]);
              }}
              onHours={setHours}
              onCourt={switchCourt}
              onContinue={() => go("dados")}
            />
          )}
          {step === "dados" && court && (
            <DetailsStep
              court={getCourt(court.id)}
              dateKey={toKey(date)}
              hours={hours}
              total={total}
              form={form}
              onForm={setForm}
              onBack={() => navigate(-1)}
              onConfirm={confirm}
            />
          )}
          {step === "sucesso" && confirmed && (
            <SuccessStep
              booking={confirmed}
              onNew={() => {
                setConfirmed(null);
                setCourt(null);
                go("quadra", true);
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
      {step === "quadra" && <TabBar badge={upcoming} />}
    </div>
  );
}
