import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { NOW } from "./fixtures";
import { db, server } from "./server";

// Transições instantâneas: o fluxo troca de etapa sem esperar animação.
MotionGlobalConfig.skipAnimations = true;

window.scrollTo = vi.fn<() => void>();
Element.prototype.scrollIntoView = vi.fn<() => void>();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

beforeEach(() => {
  // Só o relógio é falso; timers continuam reais para o MSW e o React.
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  server.resetHandlers();
  db.reset();
  localStorage.clear();
});

afterAll(() => server.close());
