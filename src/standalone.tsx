import i18next from "i18next";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initReactI18next } from "react-i18next";

import { Harness } from "@/harness/Harness";
import { NAMESPACE } from "@/hooks/useTranslation";
import "@/style/harness.css";

import en from "../public/locale/en.json";

/**
 * A development harness: the chart mounted the way the host mounts it,
 * with local state standing in for the fill store — so the drawing and the
 * interactions can be iterated on without a CARE instance. `npm run dev`.
 */
void i18next.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  resources: { en: { [NAMESPACE]: en } },
  interpolation: { escapeValue: false },
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
createRoot(rootElement).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
