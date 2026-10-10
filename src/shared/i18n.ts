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
  compSplit: string;
  compRename: string;
  paneOpened: (paneId: string, dir: string) => string;
  paneRenamed: (paneId: string, label: string) => string;
  dialogRouteTitle: (specialist: string, conf: number, pane: string, label: string | undefined, agent: string, status: string, facts: number) => string;
  optSendToPane: (pane: string, label: string | undefined, agent: string, status: string) => string;
  optSplitNew: string;
  optOpenNewAndLaunch: (specialist: string) => string;
  optCancel: string;
  delegationCancelled: string;
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
  compSplit: "Split workspace into a new side-by-side pane",
  compRename: "Rename current pane label",
  paneOpened: (paneId, dir) => `Opened new pane ${paneId} (right split) in ${dir}`,
  paneRenamed: (paneId, label) => `Pane ${paneId} renamed to "${label}"`,
  dialogRouteTitle: (spec, conf, pane, label, agent, status, facts) => {
    const labelStr = label ? ` "${label}"` : "";
    return `System-1 Route: ${spec} (${conf}%)\nPane: ${pane}${labelStr} [agent: ${agent}, status: ${status}]\nPre-warmed memory facts: ${facts}`;
  },
  optSendToPane: (pane, label, agent, status) => {
    const labelStr = label ? ` "${label}"` : "";
    return `Send to existing pane${labelStr} (${pane} · ${agent} · ${status})`;
  },
  optSplitNew: "Open in a NEW side-by-side split pane",
  optOpenNewAndLaunch: (spec) => `Open new side-by-side pane for ${spec} and launch Pi`,
  optCancel: "Cancel delegation",
  delegationCancelled: "Delegation cancelled by user.",
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
  compSplit: "Rozdělit okno na nový boční panel",
  compRename: "Přejmenovat popisek aktuálního panelu",
  paneOpened: (paneId, dir) => `Otevřen nový panel ${paneId} (vedle) v ${dir}`,
  paneRenamed: (paneId, label) => `Panel ${paneId} přejmenován na "${label}"`,
  dialogRouteTitle: (spec, conf, pane, label, agent, status, facts) => {
    const labelStr = label ? ` "${label}"` : "";
    return `System-1 Směrování: ${spec} (${conf}%)\nPanel: ${pane}${labelStr} [agent: ${agent}, stav: ${status}]\nPřipravená fakta z paměti: ${facts}`;
  },
  optSendToPane: (pane, label, agent, status) => {
    const labelStr = label ? ` "${label}"` : "";
    return `Odeslat do existujícího panelu${labelStr} (${pane} · ${agent} · ${status})`;
  },
  optSplitNew: "Otevřít v NOVÉM vedlejším panelu",
  optOpenNewAndLaunch: (spec) => `Otevřít nový vedlejší panel pro ${spec} a spustit Pi`,
  optCancel: "Zrušit delegaci",
  delegationCancelled: "Delegace zrušena uživatelem.",
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
