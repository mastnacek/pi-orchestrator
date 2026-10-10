import { DEFAULT_LOCALE, type Locale } from "./i18n.ts";
import type { RouteVerdict } from "./types.ts";

export interface PluginState {
  enabled: boolean;
  lang: Locale;
  autoWait: boolean;
  lastRunTimestamp: number;
  lastVerdict?: RouteVerdict;
}

export function createInitialState(): PluginState {
  return {
    enabled: true,
    lang: DEFAULT_LOCALE,
    autoWait: false,
    lastRunTimestamp: Date.now(),
  };
}
