import { useEffect, useState } from "react";
import { getBookings, type Booking } from "../lib/storage";

/** Reservas salvas no aparelho, reativas a mudanças (inclusive de outras abas). */
export function useBookings(): Booking[] {
  const [bookings, setBookings] = useState(getBookings);
  useEffect(() => {
    const sync = () => setBookings(getBookings());
    window.addEventListener("arena-storage", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("arena-storage", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return bookings;
}
