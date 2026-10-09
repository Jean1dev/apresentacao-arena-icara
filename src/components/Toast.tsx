import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { ToastContext, type Tone } from "./toastContext";

interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const show = useCallback((message: string, tone: Tone = "success") => {
    const id = ++nextId.current;
    setToasts((t) => [...t.slice(-1), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "success" ? 2600 : 4000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] mx-auto flex max-w-[480px] flex-col items-center gap-2 px-4 pt-safe">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              role="status"
              initial={{ opacity: 0, y: -24, scale: 0.96 }}
              animate={{ opacity: 1, y: 8, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              className="flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-xl"
            >
              {t.tone === "success" ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-300" />
              ) : t.tone === "error" ? (
                <AlertCircle className="size-4 shrink-0 text-red-300" />
              ) : (
                <Info className="size-4 shrink-0 text-sky-300" />
              )}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
