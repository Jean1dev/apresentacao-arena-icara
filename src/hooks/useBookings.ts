import { useEffect, useState } from "react";
import type { Booking } from "../api/types";
import { getBookings, STORAGE_EVENT } from "../lib/storage";

/** Reservas salvas no aparelho, reativas a mudanças (inclusive de outras abas). */
export function useBookings(): Booking[] {
  const [bookings, setBookings] = useState(getBookings);
  useEffect(() => {
    const sync = () => setBookings(getBookings());
    window.addEventListener(STORAGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORAGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return bookings;
}
