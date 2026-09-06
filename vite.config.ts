import federation from "@originjs/vite-plugin-federation";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    federation({
      name: "care_dental_fe", // must equal the plugin slug
      filename: "remoteEntry.js",
      exposes: {
        "./manifest": "./src/manifest.tsx",
      },
      // Every host singleton this plugin imports — a missing entry bundles a
      // second copy and breaks React hooks at runtime ("Should have a queue").
      shared: ["react", "react-dom", "react-i18next"],
    }),
    tailwindcss(),
    react(),
  ],
  build: {
    target: "es2022",
    minify: true,
    cssCodeSplit: false,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: { main: "./index.html" },
      output: { format: "esm" },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    port: 4177,
    allowedHosts: true,
    host: "0.0.0.0",
    cors: true,
  },
});
