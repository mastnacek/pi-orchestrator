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
  compAutoConfirm: string;
  compAutoConfirmOn: string;
  compAutoConfirmOff: string;
  compDirection: string;
  compDirectionRight: string;
  compDirectionDown: string;
  autoConfirmSet: (val: boolean) => string;
  directionSet: (dir: string) => string;
  compHelp: string;
  compPipeline: string;
  pipelineTitle: string;
  pipelineUsage: string;
  pipelineRunning: (index: number, total: number, role: string) => string;
  pipelineUnknown: (name: string, available: string) => string;
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
  compAutoConfirm: "Toggle automatic Enter confirmation after pasting prompt (on | off)",
  compAutoConfirmOn: "Auto-send Enter key immediately after prompt insertion",
  compAutoConfirmOff: "Paste prompt into editor and wait for manual Enter keypress",
  compDirection: "Pane split direction in Herdr (right | down)",
  compDirectionRight: "Split pane side-by-side to the right",
  compDirectionDown: "Split pane stacked below",
  autoConfirmSet: (val) => `Auto-confirm set to ${val ? "ON" : "OFF"}`,
  directionSet: (dir) => `Split direction set to ${dir}`,
  compHelp: "Detailed orchestrator and Herdr guide",
  compPipeline:
    "Run a role chain in Herdr panes, e.g. scout → implementer → reviewer (build | design | research | repair)",
  pipelineTitle: "Pipeline",
  pipelineUsage: "Usage: /orch pipeline <build|design|research|repair|role1,role2,...> <task>",
  pipelineRunning: (index, total, role) => `Pipeline stage ${index + 1}/${total}: ${role}...`,
  pipelineUnknown: (name, available) => `Unknown pipeline "${name}". Available: ${available}`,
  detailedHelp: `── Herdr Multiplexer Orchestrator — Guide & Setup ──

1. PRINCIPLES & ARCHITECTURE
  • The orchestrator acts as a task dispatcher and memory coordinator.
  • Instead of opaque subagents, it opens visible side-by-side terminal panes in the Herdr multiplexer.
  • You can watch each delegate work in real time and switch into their pane at any moment.

2. SYSTEM-1 TASK ROUTING WITH EXAMPLES
  • /orch route "fix WAL in pi-uma"
    → Previews routing: shows winner (pi-uma 100%), confidence score, and context slice facts without delegating.
  • /orch auto "check AST contracts in pi-uma"
    → Full automated routing: selects specialist, displays confirmation modal with pane details, and submits.
  • /orch delegate w1Y:p2Q "what is the memory status?"
    → Direct delegation to a specific Herdr pane ID or live agent.

3. PANE MANAGEMENT & LABELS (HERDR)
  • /orch split pi-uma
    → Splits workspace into a side-by-side pane to the right and starts Pi in D:\\01_programovani\\pi\\plugins\\pi-uma.
  • /orch rename "Main Dispatcher"
    → Renames the current pane in Herdr for clear visual orientation.

4. REAL STATUS OUTPUT EXAMPLE (/orch status)
  • /orch status outputs real multiplexer topology:
    ── Herdr Orchestrator Status ──
    Herdr active: yes (HERDR_ENV=1)
    Orchestrator pane: w1Z:p4 ("Main Dispatcher")
    Panes & Agents:
      • Pane w1Z:p4 "Main Dispatcher" [agent: pi, status: working]
      • Pane w1Z:p9 "Specialist: pi-uma" [agent: pi, status: idle]
      • Pane w1Y:p2Q "Researcher" [agent: agy, status: idle]

5. AGENT PROFILES (MODELS & THINKING)
  • /orch profile (or /orch profile menu)
    → Interactive selector to browse and activate specialist profiles.
  • /orch profile list
    → Lists all configured profiles with models, thinking levels, and system prompts.
  • /orch profile select pi-uma [--global]
    → Sets the default agent profile.
  • /orch profile set custom-agent anthropic/claude-3-7-sonnet [--global]
    → Creates or updates an agent profile.

6. BEHAVIOR SWITCHES
  • /orch auto-confirm on|off  — Toggle automatic Enter submission after prompt paste.
  • /orch direction right|down — Set pane split direction (side-by-side vs stacked).
  • /orch lang cs|en           — Switch interface language.

7. SOUL-BOUND AGENT ROLES (12 profiles)
  Each role is bound to a soul file (souls/<role>.md) AND to structural flags —
  the boundary is enforced by --tools, not merely requested in prose.
  • scout       read-only reconnaissance on a free 1M-context model
  • librarian   external docs & web research
  • implementer approved implementation, full tools, high thinking
  • fixer       surgical bug fixes from compiler/test failures
  • frontend    UI/UX, TUI width safety, HTMX/Tailwind
  • oracle      architectural devil's advocate (read-only)
  • reviewer    independent code review (read-only)
  • curator     UMA memory hygiene & staging proposals
  • lotus       IBM Notes / LotusScript domain expert
  • pi-uma      UMA memory specialist
  • mozek_rust  Rust pipeline specialist
  • fast        cheap general-purpose default

  Inspect a role:  /orch profile list
  Activate one:    /orch profile select scout --global
  Open its pane:   /orch split scout

Tip: Add --global to persist settings across all sessions to ~/.pi/agent/orchestrator.json.`,
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
  compAutoConfirm: "Přepnout automatické odeslání klávesou Enter po vložení promptu (on | off)",
  compAutoConfirmOn: "Automaticky stisknout Enter ihned po vložení promptu",
  compAutoConfirmOff: "Vložit prompt do editoru a počkat na ruční stisk Enteru",
  compDirection: "Směr rozdělení nového panelu v Herdr (right | down)",
  compDirectionRight: "Rozdělit panel vedle sebe doprava (side-by-side)",
  compDirectionDown: "Rozdělit panel pod sebe (stacked)",
  autoConfirmSet: (val) => `Automatický Enter nastaven na ${val ? "ZAPNUTO" : "VYPNUTO"}`,
  directionSet: (dir) => `Směr rozdělení nastaven na ${dir}`,
  compHelp: "Podrobná nápověda pro orchestrátor a Herdr multiplexer",
  compPipeline:
    "Spustit řetěz rolí v Herdr panelech, např. scout → implementer → reviewer (build | design | research | repair)",
  pipelineTitle: "Řetěz rolí",
  pipelineUsage: "Použití: /orch pipeline <build|design|research|repair|role1,role2,...> <úkol>",
  pipelineRunning: (index, total, role) => `Etapa ${index + 1}/${total}: ${role}...`,
  pipelineUnknown: (name, available) => `Neznámý řetěz "${name}". Dostupné: ${available}`,
  detailedHelp: `── Orchestrátor v Herdr multiplexeru — Nápověda a konfigurace ──

1. PRINCIP A ARCHITEKTURA
  • Orchestrátor funguje jako dispečer úkolů a správce paměti.
  • Místo slepých jednorázových subagentů otevírá vedlejší panely (panes) v Herdr multiplexeru přímo vedle vás.
  • Každého delegáta můžete sledovat v reálném čase a kdykoliv mu vstoupit do okna.

2. SYSTEM-1 SMĚROVÁNÍ ÚKOLŮ S PŘÍKLADY
  • /orch route "oprav WAL v pi-uma"
    → Pouze otestuje směrování: ukáže specialistu (pi-uma 100%), skóre a relevantní fakta z paměti bez odeslání.
  • /orch auto "zkontroluj AST kontrakty v pi-uma"
    → Plné automatické směrování: vybere specialistu, zobrazí modální okno s detaily panelu a po schválení odešle prompt.
  • /orch delegate w1Y:p2Q "jaký je stav paměti?"
    → Ruční přímé odeslání úkolu na konkrétní panel ID nebo jméno agenta v Herdr.

3. ROZDĚLENÍ A POJMENOVÁNÍ PANELŮ (HERDR)
  • /orch split pi-uma
    → Rozdělí okno na vedlejší panel (side-by-side doprava) a spustí Pi v adresáři D:\\01_programovani\\pi\\plugins\\pi-uma.
  • /orch rename "Hlavní dispečer"
    → Přejmenuje aktuální panel v Herdr pro snadnou vizuální orientaci.

4. PŘÍKLAD VÝSTUPU ZE STAVU MULTIPLEXERU (/orch status)
  • /orch status vypíše reálnou topologii:
    ── Herdr Orchestrator Status ──
    Herdr active: yes (HERDR_ENV=1)
    Orchestrator pane: w1Z:p4 ("Hlavní dispečer")
    Panely a agenti:
      • Panel w1Z:p4 "Hlavní dispečer" [agent: pi, stav: working]
      • Panel w1Z:p9 "Specialist: pi-uma" [agent: pi, stav: idle]
      • Panel w1Y:p2Q "Researcher" [agent: agy, stav: idle]

5. PROFILY AGENTŮ (MODELY A THINKING)
  • /orch profile (nebo /orch profile menu)
    → Otevře interaktivní TUI menu se seznamem profilů pro rychlý výběr.
  • /orch profile list
    → Vypíše všechny definované profily (pi-uma, mozek_rust, fast, frontier).
  • /orch profile select pi-uma [--global]
    → Nastaví výchozí profil agenta.
  • /orch profile set custom-agent anthropic/claude-3-7-sonnet [--global]
    → Vytvoří nebo upraví profil specialisty.

6. PŘEPÍNAČE CHOVÁNÍ
  • /orch auto-confirm on|off  — Automatické odeslání klávesou Enter ihned po vložení promptu.
  • /orch direction right|down — Směr rozdělení nového panelu (vedle sebe vs. pod sebe).
  • /orch lang cs|en           — Přepnutí jazyka rozhraní.

7. ROLE AGENTŮ VÁZANÉ NA SOUL (12 profilů)
  Každá role má vlastní soul soubor (souls/<role>.md) A strukturální vynucení -
  hranice je vynucena přepínačem --tools, nikoli jen prosebně v textu.
  • scout       čtecí průzkum kódu na bezplatném modelu s 1M kontextem
  • librarian   rešerše externí dokumentace a webu
  • implementer schválená implementace, plné nástroje, vysoké myšlení
  • fixer       chirurgické opravy z chyb kompilátoru a testů
  • frontend    UI/UX, šířková bezpečnost TUI, HTMX/Tailwind
  • oracle      architektonický ďáblův advokát (pouze čtení)
  • reviewer    nezávislé review kódu (pouze čtení)
  • curator     hygiena paměti UMA a návrhy do stagingu
  • lotus       doménový expert na IBM Notes / LotusScript
  • pi-uma      specialista na paměťový systém UMA
  • mozek_rust  specialista na Rust pipeline
  • fast        levný univerzální výchozí profil

  Výpis rolí:      /orch profile list
  Aktivace role:   /orch profile select scout --global
  Otevření panelu: /orch split scout

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
