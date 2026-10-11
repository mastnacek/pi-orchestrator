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
  compProfile: string;
  compProfileList: string;
  compProfileSelect: string;
  compProfileSet: string;
  compProfileRemove: string;
  compProfileMenu: string;
  compHelp: string;
  detailedHelp: string;
  paneOpened: (paneId: string, dir: string) => string;
  paneRenamed: (paneId: string, label: string) => string;
  profileSet: (name: string, model: string) => string;
  profileSelected: (name: string) => string;
  profileRemoved: (name: string) => string;
  profileNotFound: (name: string) => string;
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
  compAuto:
    "Automatic System-1 routing: picks specialist, shows confirmation modal with pane status, and submits task",
  compRoute:
    "Preview task routing: shows winner specialist, confidence score, and pre-warmed memory context facts",
  compDelegate:
    "Directly delegate a task prompt to a specific Herdr pane or live agent",
  compStatus: "Inspect live Herdr multiplexer workspaces, panes, and agent lifecycle states",
  compLang: "Switch language / Přepnout jazyk (en / cs)",
  compLangEn: "English",
  compLangCs: "Czech",
  compSplit: "Split workspace into a side-by-side pane and launch Pi in project directory",
  compRename: "Rename the current pane in Herdr for easier multiplexer orientation",
  compProfile: "Manage specialist agent profiles (model, thinking level, system prompts)",
  compProfileList: "List all configured agent profiles with models and parameters",
  compProfileSelect: "Set the default agent profile used when launching new panes",
  compProfileSet: "Create or update an agent profile: /orch profile set <name> <model> [--global]",
  compProfileRemove: "Remove an agent profile from configuration",
  compProfileMenu: "Open interactive TUI selector menu to choose active profile",
  compHelp: "Detailed orchestrator and Herdr guide",
  detailedHelp: `── Herdr Multiplexer Orchestrator — Guide & Setup ──

1. PRINCIPLES & ARCHITECTURE
  • The orchestrator acts as a task dispatcher and memory coordinator.
  • Instead of opaque subagents, it opens visible side-by-side terminal panes in the Herdr multiplexer.
  • You can watch each delegate work in real time and switch into their pane at any moment.

2. SYSTEM-1 TASK ROUTING (FASTBRAIN ROUTE)
  • /orch route <prompt>
    - Previews task routing: shows winner specialist, confidence score, and pre-warmed context slice facts.
    - Runs locally (0 ms, 0 cost) matching known project domains.
  • /orch auto <prompt>
    - Full tiered routing with confirmation.
    - Displays an interactive modal dialog showing target pane, name, and live lifecycle status (idle, working).
    - Upon confirmation, auto-submits the prompt with Enter keypress.

3. AGENT PROFILES (MODELS & THINKING)
  • /orch profile (or /orch profile menu)
    - Interactive selector to browse and activate specialist profiles.
  • /orch profile list
    - Lists all configured profiles with models, thinking levels, and system prompt additions.
  • /orch profile select <name> [--global]
    - Sets the default agent profile (fast, frontier, pi-uma, mozek_rust).
  • /orch profile set <name> <model> [--global]
    - Creates or updates an agent profile.

4. PANE MANAGEMENT & LABELS
  • /orch split [specialist]
    - Splits the workspace side-by-side and launches Pi in the specialist's directory.
  • /orch rename <label>
    - Renames the current pane in Herdr for easier orientation.
  • /orch status
    - Shows live overview of Herdr workspaces, tabs, panes, and agent lifecycle states.
  • /orch delegate <target> <prompt>
    - Manually delegates a prompt to a named agent or pane ID.

Tip: Add --global to persist settings to ~/.pi/agent/orchestrator.json across all sessions.`,
  paneOpened: (paneId, dir) => `Opened new pane ${paneId} (right split) in ${dir}`,
  paneRenamed: (paneId, label) => `Pane ${paneId} renamed to "${label}"`,
  profileSet: (name, model) => `Profile "${name}" set with model ${model}`,
  profileSelected: (name) => `Default profile set to "${name}"`,
  profileRemoved: (name) => `Profile "${name}" removed`,
  profileNotFound: (name) => `Profile "${name}" not found`,
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
  compAuto:
    "Automatické System-1 směrování: vybere specialistu, zobrazí schvalovací okno s panelem a odešle úkol",
  compRoute:
    "Test směrování: ukáže specialistu, jistotu a fakta z paměti (context slice) bez odeslání",
  compDelegate:
    "Přímé odeslání úkolu konkrétnímu panelu nebo agentovi v Herdr (např. w1Y:p2Q, agy)",
  compStatus: "Zobrazí přehled všech aktivních agentů v Herdr a jejich stavy (idle, working, blocked)",
  compLang: "Přepnout jazyk rozhraní (en / cs)",
  compLangEn: "Angličtina",
  compLangCs: "Čeština",
  compSplit: "Rozdělit okno v Herdr na vedlejší panel (side-by-side) a spustit v něm Pi pro specialistu",
  compRename: "Pojmenovat aktuální panel v Herdr pro snadnou orientaci v multiplexeru",
  compProfile: "Správa profilů specialistů: nastavení modelu, thinkingu a systémových promptů pro nové panely",
  compProfileList: "Vypíše všechny definované profily agentů (model, thinking, prompt)",
  compProfileSelect: "Nastaví výchozí profil agenta, který se použije při otevírání nových panelů",
  compProfileSet: "Vytvoří nebo upraví profil specialisty: /orch profile set <název> <model> [--global]",
  compProfileRemove: "Odebere profil specialisty z konfigurace orchestrátoru",
  compProfileMenu: "Otevře interaktivní TUI menu se seznamem profilů pro rychlý výběr výchozího agenta",
  compHelp: "Podrobná nápověda pro orchestrátor a Herdr multiplexer",
  detailedHelp: `── Orchestrátor v Herdr multiplexeru — Nápověda a konfigurace ──

1. PRINCIP A ARCHITEKTURA
  • Orchestrátor funguje jako dispečer úkolů a správce paměti.
  • Místo slepých jednorázových subagentů otevírá vedlejší panely (panes) v Herdr multiplexeru přímo vedle vás.
  • Každého delegáta můžete sledovat v reálném čase a kdykoliv mu vstoupit do okna.

2. SYSTEM-1 SMĚROVÁNÍ ÚKOLŮ (FASTBRAIN ROUTE)
  • /orch route <prompt>
    - Pouze otestuje směrování: ukáže vítězného specialistu, skóre jistoty a fakta z paměti (context slice).
    - Běží lokálně (0 ms, 0 Kč) podle známých domén.
  • /orch auto <prompt>
    - Plné automatické směrování.
    - Zobrazí interaktivní potvrzovací okno s názvem cílového panelu a jeho stavem (idle, working).
    - Po schválení odešle úkol delegátovi a automaticky stiskne Enter.

3. PROFILY AGENTŮ (MODELY A THINKING)
  • /orch profile (nebo /orch profile menu)
    - Otevře interaktivní menu pro výběr a správu profilů.
  • /orch profile list
    - Vypíše všechny definované profily (model, thinking, system prompt).
  • /orch profile select <profil> [--global]
    - Nastaví výchozí profil agenta (např. fast, frontier, pi-uma, mozek_rust).
  • /orch profile set <název> <model> [--global]
    - Vytvoří nebo upraví profil pro konkrétního specialistu.

4. SPRÁVA A POJMENOVÁNÍ PANELŮ
  • /orch split [specialista]
    - Ručně rozdělí okno na nový vedlejší panel (side-by-side) a spustí Pi v daném projektu.
  • /orch rename <název>
    - Přejmenuje aktuální panel v Herdr pro snazší orientaci.
  • /orch status
    - Zobrazí přehled všech aktivních agentů, panelů a jejich životních cyklů.
  • /orch delegate <cíl> <úkol>
    - Ručně deleguje úkol na konkrétního agenta nebo panel.

Tip: Přidejte přepínač --global pro trvalé uložení do ~/.pi/agent/orchestrator.json.`,
  paneOpened: (paneId, dir) => `Otevřen nový panel ${paneId} (vedle) v ${dir}`,
  paneRenamed: (paneId, label) => `Panel ${paneId} přejmenován na "${label}"`,
  profileSet: (name, model) => `Profil "${name}" nastaven s modelem ${model}`,
  profileSelected: (name) => `Výchozí profil nastaven na "${name}"`,
  profileRemoved: (name) => `Profil "${name}" odebrán`,
  profileNotFound: (name) => `Profil "${name}" nenalezen`,
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
