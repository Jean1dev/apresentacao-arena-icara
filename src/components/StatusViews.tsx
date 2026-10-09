import { RotateCw, WifiOff } from "lucide-react";

/** Bloco cinza pulsando no lugar do conteúdo que está carregando. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-3xl bg-sand-200/70 ${className}`} />;
}

export function LoadingLabel({ children = "Carregando..." }: { children?: string }) {
  return (
    <p role="status" className="sr-only">
      {children}
    </p>
  );
}

export function ErrorState({ message = "Não foi possível carregar a agenda.", onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-3xl bg-white p-6 text-center ring-1 ring-sand-200">
      <WifiOff className="mx-auto size-8 text-ink-soft" />
      <p className="mt-3 font-bold">{message}</p>
      <p className="mt-1 text-sm text-ink-soft">Confira sua conexão e tente de novo.</p>
      <button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">
        <RotateCw className="size-4" /> Tentar novamente
      </button>
    </div>
  );
}
