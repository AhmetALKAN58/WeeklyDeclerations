import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = path.dirname(fileURLToPath(import.meta.url));
const sharedEnv = path.join(root, "..", "paint-line");
const envDir = fs.existsSync(path.join(root, ".env.local")) ? root : sharedEnv;

export default defineConfig(({ command }) => ({
  plugins: [react()],
  envDir,
  base: command === "build" ? "/std/" : "./",
  server: {
    host: true,
    port: 5174,
  },
  preview: {
    host: true,
    port: 4174,
  },
}));
