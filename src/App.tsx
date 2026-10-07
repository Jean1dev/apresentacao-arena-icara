import { Route, Routes } from "react-router-dom";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import { ToastProvider } from "./components/Toast";

export default function App() {
  return (
    <ToastProvider>
      <div className="relative mx-auto min-h-dvh max-w-[480px] bg-sand-100 sm:shadow-[0_0_80px_rgba(0,0,0,0.08)]">
        <Routes>
          <Route path="/" element={<Booking />} />
          <Route path="/minhas-reservas" element={<MyBookings />} />
          <Route path="*" element={<Booking />} />
        </Routes>
      </div>
    </ToastProvider>
  );
}
