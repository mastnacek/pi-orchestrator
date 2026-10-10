export type Locale = "en" | "cs";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALES: readonly Locale[] = ["en", "cs"] as const;

export interface Strings {
  title: string;
  commandDesc: string;
  ready: string;
  confirm: string;
  done: string;
  status: (enabled: boolean) => string;
  routeTitle: string;
  noRoute: string;
  escalate: string;
  delegating: (target: string) => string;
  delegated: (target: string) => string;
  collecting: (target: string) => string;
  herdrWarning: string;
  usageRoute: string;
  usageAuto: string;
  usageDelegate: string;
  unknownCommand: string;
  compAuto: string;
  compRoute: string;
  compDelegate: string;
  compStatus: string;
  compLang: string;
  compLangEn: string;
  compLangCs: string;
}

const en: Strings = {
  title: "Memory Orchestrator",
  commandDesc: "Memory-native orchestrator for task routing and Herdr delegation.",
  ready: "Orchestrator ready. Use /orch route, /orch auto, or orch_* tools.",
  confirm: "Confirm delegation",
  done: "Delegation complete.",
  status: (enabled) => (enabled ? "Orchestrator active" : "Orchestrator paused"),
  routeTitle: "System-1 Route Check",
  noRoute: "No confident specialist found — escalating to orchestrator model.",
  escalate: "Ambiguous task — recommend review or select candidate.",
  delegating: (target) => `Delegating to ${target}...`,
  delegated: (target) => `Task delegated to ${target}.`,
  collecting: (target) => `Reading output from ${target}...`,
  herdrWarning: "Herdr environment not active (HERDR_ENV != 1).",
  usageRoute: "Please provide a prompt: /orch route <prompt>",
  usageAuto: "Please provide a prompt: /orch auto <prompt>",
  usageDelegate: "Usage: /orch delegate <target> <prompt>",
  unknownCommand: "Unknown command. Use /orch route, /orch auto, /orch delegate, or /orch status",
  compAuto: "Tiered route check and delegation",
  compRoute: "Check System-1 route without delegating",
  compDelegate: "Delegate a task to a specific specialist or agent",
  compStatus: "Inspect Herdr agents and panes",
  compLang: "Switch language (en / cs)",
  compLangEn: "English",
  compLangCs: "Czech",
};

const cs: Strings = {
  title: "Paměťový Orchestrátor",
  commandDesc: "Paměťový orchestrátor pro směrování úkolů a delegaci v Herdr.",
  ready: "Orchestrátor připraven. Použijte /orch route, /orch auto nebo orch_* nástroje.",
  confirm: "Potvrdit delegaci",
  done: "Delegace dokončena.",
  status: (enabled) => (enabled ? "Orchestrátor aktivní" : "Orchestrátor pozastaven"),
  routeTitle: "System-1 Směrování",
  noRoute: "Nenalezen žádný jistý specialista — eskalace na model orchestrátoru.",
  escalate: "Nejednoznačný úkol — doporučeno posouzení nebo výběr kandidáta.",
  delegating: (target) => `Deleguji na ${target}...`,
  delegated: (target) => `Úkol delegován na ${target}.`,
  collecting: (target) => `Načítám výstup z ${target}...`,
  herdrWarning: "Prostředí Herdr není aktivní (HERDR_ENV != 1).",
  usageRoute: "Zadejte prompt: /orch route <prompt>",
  usageAuto: "Zadejte prompt: /orch auto <prompt>",
  usageDelegate: "Použití: /orch delegate <target> <prompt>",
  unknownCommand: "Neznámý příkaz. Použijte /orch route, /orch auto, /orch delegate nebo /orch status",
  compAuto: "Vrstvená kontrola směrování a delegace",
  compRoute: "Kontrola System-1 směrování bez delegace",
  compDelegate: "Delegovat úkol konkrétnímu specialistovi nebo agentovi",
  compStatus: "Přehled Herdr agentů a panelů",
  compLang: "Přepnout jazyk (en / cs)",
  compLangEn: "Angličtina",
  compLangCs: "Čeština",
};

export function normalizeLocale(raw: string | undefined): Locale {
  if (!raw) return DEFAULT_LOCALE;
  const lower = raw.toLowerCase().trim();
  if (lower.startsWith("cs") || lower === "cz") return "cs";
  return "en";
}

export function stringsFor(locale: string | undefined): Strings {
  const norm = normalizeLocale(locale);
  return norm === "cs" ? cs : en;
}
