import { DEFAULT_LOCALE, type Locale } from "./i18n.ts";
import type { RouteVerdict } from "./types.ts";
import { loadConfig, type OrchestratorConfig } from "./config.ts";

/** One entry of Pi's live model catalog, as shown by the `/model` picker. */
export interface CatalogModel {
  id: string;
  provider: string;
  name: string;
}

export interface PluginState {
  enabled: boolean;
  lang: Locale;
  autoWait: boolean;
  lastRunTimestamp: number;
  lastVerdict?: RouteVerdict;
  config: OrchestratorConfig;
  /**
   * Pi's live model catalog, captured at `session_start`.
   *
   * `getArgumentCompletions` receives no context, so the catalog has to be
   * snapshotted while a context is available and read back during completion.
   */
  availableModels: CatalogModel[];
}

export function createInitialState(cwd?: string): PluginState {
  return {
    enabled: true,
    lang: DEFAULT_LOCALE,
    autoWait: false,
    lastRunTimestamp: Date.now(),
    config: loadConfig(cwd),
    availableModels: [],
  };
}

/** Minimal shape of the engine's model registry, kept structural. */
interface ModelRegistryLike {
  getAvailable?: () => ReadonlyArray<{ id?: string; name?: string; provider?: string }>;
  getAll?: () => ReadonlyArray<{ id?: string; name?: string; provider?: string }>;
}

/**
 * Snapshots the live model catalog into plugin state.
 *
 * Prefers `getAvailable()` (models with resolvable credentials) and falls back
 * to `getAll()`. A failure leaves the previous snapshot intact rather than
 * emptying the picker — an empty menu reads as "no models exist".
 */
export function refreshModelCatalog(
  state: PluginState,
  registry: ModelRegistryLike | undefined
): number {
  try {
    const source = registry?.getAvailable?.() ?? registry?.getAll?.() ?? [];
    const models: CatalogModel[] = [];
    for (const m of source) {
      if (!m?.id) continue;
      models.push({
        id: m.id,
        provider: m.provider || "unknown",
        name: m.name || m.id,
      });
    }
    models.sort((a, b) => a.id.localeCompare(b.id));
    if (models.length > 0) {
      state.availableModels = models;
    }
    return models.length;
  } catch {
    return state.availableModels.length;
  }
}
