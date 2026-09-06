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
    // No <link rel=modulepreload> hints: they resolve against the HOST
    // page's origin, where this remote's chunks do not exist (404 noise on
    // every load). The chunks themselves import relative to remoteEntry.js.
    modulePreload: false,
    rollupOptions: {
      // The remote's graph only. `index.html` is the dev harness and stays
      // out of the production build — see src/index.tsx.
      input: { main: "./src/index.tsx" },
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
