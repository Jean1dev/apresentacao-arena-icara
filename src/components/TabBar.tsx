import { motion } from "framer-motion";
import { CalendarCheck, CalendarPlus } from "lucide-react";
import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/", label: "Reservar", icon: CalendarPlus },
  { to: "/minhas-reservas", label: "Minhas reservas", icon: CalendarCheck },
];

export function TabBar({ badge = 0 }: { badge?: number }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] px-4 pb-safe">
      <div className="flex rounded-full bg-ink/95 p-1.5 shadow-2xl backdrop-blur">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end className="relative flex-1">
            {({ isActive }) => (
              <span className={`relative flex h-12 items-center justify-center gap-2 text-sm font-bold ${isActive ? "text-ink" : "text-white/70"}`}>
                {isActive && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-sand-100"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                  />
                )}
                <Icon className="relative size-[18px]" />
                <span className="relative">{label}</span>
                {to === "/minhas-reservas" && badge > 0 && (
                  <span className="relative grid size-5 place-items-center rounded-full bg-lime text-[10px] text-ink font-extrabold">{badge}</span>
                )}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
