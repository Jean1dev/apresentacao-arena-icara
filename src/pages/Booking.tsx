import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, NETWORK_ERROR, TIMEOUT } from "../api/client";
import { availableSlotsQuery, useCourtSlots, useCourts, useCreateBooking } from "../api/queries";
import type { Booking as BookingT, Court, Sport } from "../api/types";
import { CourtStep } from "../components/steps/CourtStep";
import { DetailsStep } from "../components/steps/DetailsStep";
import { SuccessStep } from "../components/steps/SuccessStep";
import { TimeStep } from "../components/steps/TimeStep";
import { TabBar } from "../components/TabBar";
import { useToast } from "../components/toastContext";
import { isUpcoming } from "../domain/booking";
import { LIMITS, splitApiFieldErrors, toBookingRequest, type DetailsForm, type FormErrors } from "../domain/bookingForm";
import { freeHours, freeHoursOf, myHoursByDate, toUiDay, totalCents } from "../domain/slots";
import { DEFAULT_SPORT } from "../domain/sports";
import { useBookings } from "../hooks/useBookings";
import { addDaysKey, dateRange, todayKey } from "../lib/businessDate";
import { getProfile, saveBooking, saveProfile } from "../lib/storage";

type Step = "quadra" | "horarios" | "dados" | "sucesso";

export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const bookings = useBookings();
  const courts = useCourts();
  const createBooking = useCreateBooking();

  const today = todayKey();
  const lastDay = addDaysKey(today, LIMITS.daysAhead);
  const dates = useMemo(() => dateRange(today, LIMITS.daysAhead + 1), [today]);

  const [courtId, setCourtId] = useState<string | null>(null);
  const [date, setDate] = useState(today);
  const [picked, setPicked] = useState<number[]>([]);
  const [confirmed, setConfirmed] = useState<BookingT | null>(null);
  const [form, setForm] = useState<DetailsForm>(() => ({ ...getProfile(), sport: DEFAULT_SPORT, players: 4, notes: "" }));
  const [serverErrors, setServerErrors] = useState<FormErrors>({});

  const court = courts.data?.find((c) => c.id === courtId) ?? null;

  // Uma chamada cobre a janela inteira de reserva: a faixa de dias e a grade usam o mesmo dado.
  const slots = useCourtSlots(court?.id, today, lastDay);
  const days = useMemo(() => {
    const mine = court ? myHoursByDate(bookings, court.id) : new Map<string, Set<number>>();
    return new Map((slots.data?.days ?? []).map((d) => [d.date, toUiDay(d, mine)]));
  }, [slots.data, bookings, court]);
  const day = days.get(date);

  // A seleção é sempre filtrada pela agenda atual: se alguém reservar um horário
  // escolhido (ou depois de um 409), ele sai sozinho quando a agenda recarrega.
  const free = freeHours(day);
  const hours = day ? picked.filter((h) => free.has(h)) : [];
  const total = totalCents(day, hours);

  // A etapa vive na URL para o botão "voltar" do celular funcionar naturalmente.
  const requested = (params.get("etapa") as Step) || "quadra";
  const step: Step =
    requested === "sucesso" && confirmed
      ? "sucesso"
      : !court || requested === "sucesso"
        ? "quadra"
        : requested === "dados" && !hours.length && !createBooking.isPending
          ? "horarios"
          : requested;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const go = (next: Step, replace = false) => navigate(next === "quadra" ? "/" : `/?etapa=${next}`, { replace });

  const selectCourt = (c: Court) => {
    setCourtId(c.id);
    setPicked([]);
    go("horarios");
  };

  const switchCourt = (c: Court) => {
    // O seletor de quadras já carregou os livres do dia; avisa se algo da seleção não cabe na outra quadra.
    const avail = queryClient.getQueryData(availableSlotsQuery(date).queryKey);
    if (avail && hours.length) {
      const freeThere = freeHoursOf(avail.slots, c.id);
      const lost = hours.filter((h) => !freeThere.has(h)).length;
      if (lost) toast(`${lost} horário(s) não estão livres na ${c.name}`, "info");
    }
    setCourtId(c.id);
  };

  const quickPick = (id: string, dateKey: string, hour: number) => {
    setCourtId(id);
    setDate(dateKey);
    setPicked([hour]);
    go("horarios");
  };

  const updateForm = (f: DetailsForm) => {
    setForm(f);
    setServerErrors({});
  };

  const confirm = async () => {
    if (!court) return;
    setServerErrors({});
    try {
      const booking = await createBooking.mutateAsync(toBookingRequest(court.id, date, hours, form));
      saveBooking(booking);
      saveProfile({ name: booking.name, whatsapp: form.whatsapp });
      setConfirmed(booking);
      setPicked([]);
      go("sucesso", true);
    } catch (err) {
      handleBookingError(err);
    }
  };

  const handleBookingError = (err: unknown) => {
    const code = err instanceof ApiError ? err.code : undefined;
    if (code === "SLOT_UNAVAILABLE") {
      toast("Alguém acabou de reservar um desses horários. Escolha de novo.", "error");
      navigate(-1);
      return;
    }
    if (code === "VALIDATION_ERROR") {
      const { form: fieldErrors, other } = splitApiFieldErrors((err as ApiError).fields);
      setServerErrors(fieldErrors);
      if (other.length) {
        // Data ou hora fora da janela (ex.: o horário começou enquanto a pessoa preenchia).
        toast("Esses horários não estão mais disponíveis. Escolha de novo.", "error");
        navigate(-1);
      }
      return;
    }
    if (code === NETWORK_ERROR || code === TIMEOUT) toast("Sem conexão com a arena. Tente de novo.", "error");
    else toast("Algo deu errado. Tente de novo em instantes.", "error");
  };

  const upcoming = bookings.filter((b) => isUpcoming(b)).length;

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
              sport={form.sport}
              onSport={(sport: Sport) => setForm((f) => ({ ...f, sport }))}
              onSelectCourt={selectCourt}
              onQuickPick={quickPick}
              firstName={form.name.trim().split(" ")[0]}
            />
          )}
          {step === "horarios" && court && (
            <TimeStep
              court={court}
              courts={courts.data ?? []}
              dates={dates}
              date={date}
              days={days}
              slotsState={{ isPending: slots.isPending, isError: slots.isError, refetch: () => void slots.refetch() }}
              hours={hours}
              onBack={() => navigate(-1)}
              onDate={(d) => {
                setDate(d);
                setPicked([]);
              }}
              onHours={setPicked}
              onCourt={switchCourt}
              onContinue={() => go("dados")}
            />
          )}
          {step === "dados" && court && (
            <DetailsStep
              court={court}
              dateKey={date}
              hours={hours}
              total={total}
              form={form}
              serverErrors={serverErrors}
              submitting={createBooking.isPending}
              onForm={updateForm}
              onBack={() => navigate(-1)}
              onConfirm={confirm}
            />
          )}
          {step === "sucesso" && confirmed && (
            <SuccessStep
              booking={confirmed}
              onNew={() => {
                setConfirmed(null);
                setCourtId(null);
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
