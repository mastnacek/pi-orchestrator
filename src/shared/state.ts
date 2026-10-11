import { DEFAULT_LOCALE, type Locale } from "./i18n.ts";
import type { RouteVerdict } from "./types.ts";
import { loadConfig, type OrchestratorConfig } from "./config.ts";

export interface PluginState {
  enabled: boolean;
  lang: Locale;
  autoWait: boolean;
  lastRunTimestamp: number;
  lastVerdict?: RouteVerdict;
  config: OrchestratorConfig;
}

export function createInitialState(cwd?: string): PluginState {
  return {
    enabled: true,
    lang: DEFAULT_LOCALE,
    autoWait: false,
    lastRunTimestamp: Date.now(),
    config: loadConfig(cwd),
  };
}
