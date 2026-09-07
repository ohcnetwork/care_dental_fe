import federation from "@originjs/vite-plugin-federation";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import type { Plugin as PostcssPlugin } from "postcss";
import { defineConfig } from "vite";

/** The class on the plugin's root element — every selector in the
 *  production stylesheet is nested under it (see `scopeToPluginRoot`). */
const PLUGIN_ROOT = ".care-dental-fe";

/**
 * Scope the built stylesheet to the plugin's own subtree.
 *
 * The remote's CSS is injected into the HOST page, which is itself a
 * Tailwind app with the same utility class names. Two utility sheets in
 * one document cannot coexist unscoped: whichever loads later wins for
 * every shared class, so a plain `.hidden` from this sheet beat the host's
 * `md:flex` variants and collapsed the host's responsive layout. Nesting
 * every selector under the root class makes these rules unable to match
 * anything outside the chart, and gives them the specificity to beat the
 * host's same-named utilities inside it, whatever the load order.
 *
 * Runs after Tailwind's Vite plugin has compiled the utilities (that plugin
 * transforms first); keyframe steps are not selectors and are left alone.
 */
function scopeToPluginRoot(): PostcssPlugin {
  return {
    postcssPlugin: "care-dental-fe-scope",
    OnceExit(root) {
      root.walkRules((rule) => {
        const parent = rule.parent;
        if (
          parent?.type === "atrule" &&
          /keyframes$/i.test((parent as { name: string }).name)
        ) {
          return;
        }
        rule.selectors = rule.selectors.map((selector) => {
          const trimmed = selector.trim();
          return trimmed.startsWith(PLUGIN_ROOT)
            ? trimmed
            : `${PLUGIN_ROOT} ${trimmed}`;
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  css: {
    postcss: {
      // Build only: the dev harness (`npm run dev`) renders the chart on a
      // plain page and wants its own stylesheet unscoped.
      plugins: command === "build" ? [scopeToPluginRoot()] : [],
    },
  },
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
}));
