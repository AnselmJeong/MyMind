import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { electrobunViteAliases } from "./.hutch/devkit/api/config/electrobun-vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: "src/mainview",
  base: "./",
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      ...electrobunViteAliases(path.resolve(__dirname, ".hutch/devkit")),
    ],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
