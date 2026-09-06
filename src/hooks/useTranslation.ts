import { useCallback } from "react";
import { useTranslation as useTranslationBase } from "react-i18next";

import en from "../../public/locale/en.json";

/** The plugin's i18n namespace — its slug, which the host registers and
 *  serves from `<plugin origin>/locale/<lng>.json`. */
export const NAMESPACE = "care_dental_fe";

type Key = keyof typeof en;

/**
 * `t` over the plugin namespace with the English strings as defaults, so
 * the chart reads correctly before the namespace has loaded (and in the
 * standalone harness, which has no i18n at all) while other languages
 * still come from the host's loader.
 */
export function useTranslation() {
  const { t: base, i18n } = useTranslationBase(NAMESPACE);
  const t = useCallback(
    (key: Key, options?: Record<string, unknown>) =>
      base(key, { defaultValue: en[key], ...options }),
    [base],
  );
  return { t, i18n };
}
