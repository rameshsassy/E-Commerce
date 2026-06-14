import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve("./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      server: { entry: "server" },
    }),
    react(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5174,
    allowedHosts: [
      "aashansh.org",
      "seller.aashansh.org",
      "superadmin.aashansh.org",
      "localhost",
      "127.0.0.1",
    ],
  },
});
