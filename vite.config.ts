import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command, mode }) => {
  // Sem a URL da API o app abriria em branco: falha no build, não no celular do aluno.
  if (command === "build" && !loadEnv(mode, process.cwd(), "VITE_").VITE_API_BASE_URL) {
    throw new Error("Defina VITE_API_BASE_URL para gerar o build (veja .env.example).");
  }

  return {
    plugins: [react(), tailwindcss()],
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      env: {
        // Aparelho num fuso diferente do da arena: os testes garantem que "hoje" vem do fuso da arena.
        TZ: "Asia/Tokyo",
        VITE_API_BASE_URL: "http://api.test",
        VITE_ARENA_WHATSAPP: "5548999990000",
        VITE_ARENA_TIMEZONE: "America/Sao_Paulo",
      },
      restoreMocks: true,
    },
  };
});
