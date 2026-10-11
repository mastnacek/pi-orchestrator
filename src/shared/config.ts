import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";

/**
 * A Soul-bound agent role profile.
 *
 * The soul (a markdown file under `souls/`) carries the role's identity and
 * prohibitions; the profile carries the STRUCTURAL enforcement — which tools
 * the process may call at all (`tools` allowlist), how hard it may think
 * (`thinking`), and which model it runs on. Prose declares intent; flags make
 * it impossible to violate.
 */
export interface AgentProfile {
  name: string;
  model?: string;
  provider?: string;
  thinking?: ThinkingLevel;
  /** Allowlist of Pi tool names. Empty/undefined = Pi defaults. */
  tools?: string[];
  /** Extra tools to deny even if granted elsewhere (e.g. write, edit). */
  excludeTools?: string[];
  /** Soul file stem under souls/ (defaults to the profile name). */
  soul?: string;
  /** Append arbitrary text instead of/in addition to a soul file. */
  appendSystemPrompt?: string;
  /** Context isolation: skip skills / extensions / AGENTS.md discovery. */
  noSkills?: boolean;
  noExtensions?: boolean;
  noContextFiles?: boolean;
  cwd?: string;
}

export interface OrchestratorConfig {
  defaultProfile?: string;
  profiles: Record<string, AgentProfile>;
  /** Named role chains used by `/orch pipeline`. */
  pipelines?: Record<string, string[]>;
  splitDirection: "right" | "down";
  autoConfirm: boolean;
}

/** Read-only tool allowlist shared by every reconnaissance role. */
const READ_ONLY_TOOLS = ["read", "ls", "find", "grep"];

/**
 * Provider ids that Pi accepts on the command line.
 *
 * Only providers present in the model catalog at ARGUMENT-PARSE time are
 * valid here. Accounts created by extensions (pi-openrouter-accounts registers
 * `openrouter-<id>`) are injected at `session_start`, long after the CLI has
 * already validated `--provider` — passing one aborts startup with
 * `Unknown provider`. Such an account is reached instead by omitting
 * `--provider` and letting the child session resolve its own configured
 * account, which is the default behaviour below.
 *
 * Verified against `pi --list-models`: antigravity, kimi-coding, ollama,
 * opencode, openrouter, zenfree.
 */
export const CLI_SAFE_PROVIDERS = new Set([
  "antigravity",
  "kimi-coding",
  "ollama",
  "opencode",
  "openrouter",
  "zenfree",
]);

/** True when `--provider <id>` will survive Pi's startup validation. */
export function isCliSafeProvider(provider: string | undefined): boolean {
  return provider !== undefined && CLI_SAFE_PROVIDERS.has(provider.trim().toLowerCase());
}

/**
 * The default role roster.
 *
 * Modelled on the strongest multi-agent systems surveyed (pi-herdsman,
 * oh-my-opencode-slim, herdr-projects, VoltAgent): cheap read-only scouts feed
 * precise facts to expensive writers, and independent read-only reviewers
 * guard the result.
 */
const STRONG_MODEL = "anthropic/claude-sonnet-4.6";
const CHEAP_MODEL = "google/gemini-2.5-flash-lite";
const MID_MODEL = "google/gemini-2.5-flash";

export const DEFAULT_PROFILES: Record<string, AgentProfile> = {
  /**
   * The dispatcher itself.
   *
   * This is the role of the main Pi instance the operator talks to. It is the
   * only role granted the orchestrator tools AND denied the coding tools — the
   * structural expression of "coordinate, never implement".
   */
  orchestrator: {
    name: "orchestrator",
    model: MID_MODEL,
    thinking: "medium",
    excludeTools: ["edit", "write"],
  },
  scout: {
    name: "scout",
    model: CHEAP_MODEL,
    thinking: "off",
    tools: READ_ONLY_TOOLS,
    noSkills: true,
    noExtensions: true,
  },
  librarian: {
    name: "librarian",
    model: MID_MODEL,
    thinking: "low",
    tools: ["read", "ls", "find", "grep", "bash"],
  },
  implementer: {
    name: "implementer",
    model: STRONG_MODEL,
    thinking: "high",
  },
  fixer: {
    name: "fixer",
    model: MID_MODEL,
    thinking: "low",
  },
  frontend: {
    name: "frontend",
    model: STRONG_MODEL,
    thinking: "high",
  },
  oracle: {
    name: "oracle",
    model: STRONG_MODEL,
    thinking: "high",
    tools: READ_ONLY_TOOLS,
    noExtensions: true,
  },
  reviewer: {
    name: "reviewer",
    model: STRONG_MODEL,
    thinking: "high",
    tools: READ_ONLY_TOOLS,
    noExtensions: true,
  },
  curator: {
    name: "curator",
    model: CHEAP_MODEL,
    thinking: "off",
  },
  lotus: {
    name: "lotus",
    model: STRONG_MODEL,
    thinking: "high",
  },
  "pi-uma": {
    name: "pi-uma",
    model: CHEAP_MODEL,
    thinking: "off",
  },
  mozek_rust: {
    name: "mozek_rust",
    model: STRONG_MODEL,
    thinking: "high",
  },
  fast: {
    name: "fast",
    model: MID_MODEL,
    thinking: "off",
  },
  frontier: {
    name: "frontier",
    model: STRONG_MODEL,
    thinking: "high",
  },
};

/**
 * A named multi-stage role chain.
 *
 * Reconnaissance runs on a cheap read-only model and hands verified facts to
 * an expensive writer, whose output an independent read-only reviewer audits.
 * Each stage receives the previous stage's report as its handoff.
 */
export const DEFAULT_PIPELINES: Record<string, string[]> = {
  /** scout → implementer → reviewer */
  build: ["scout", "implementer", "reviewer"],
  /** scout → oracle (architecture critique before any code is written) */
  design: ["scout", "oracle"],
  /** librarian → implementer (docs first, then code) */
  research: ["librarian", "implementer"],
  /** fixer → reviewer */
  repair: ["fixer", "reviewer"],
};

export function getDefaultConfig(): OrchestratorConfig {
  return {
    defaultProfile: "fast",
    profiles: { ...DEFAULT_PROFILES },
    pipelines: { ...DEFAULT_PIPELINES },
    splitDirection: "right",
    autoConfirm: true,
  };
}

export function getConfigPath(isGlobal = true, cwd?: string): string {
  if (!isGlobal && cwd) {
    return path.join(cwd, ".pi", "orchestrator.json");
  }
  const globalDir = path.join(os.homedir(), ".pi", "agent");
  return path.join(globalDir, "orchestrator.json");
}

export function loadConfig(cwd?: string): OrchestratorConfig {
  const defaults = getDefaultConfig();
  const globalPath = getConfigPath(true);
  let resolved = { ...defaults };
  try {
    if (fs.existsSync(globalPath)) {
      const globalData = JSON.parse(fs.readFileSync(globalPath, "utf-8")) as Partial<OrchestratorConfig>;
      resolved = {
        ...resolved,
        ...globalData,
        profiles: { ...resolved.profiles, ...(globalData.profiles || {}) },
      };
    }
  } catch {
    // Ignore error
  }

  if (cwd) {
    const projectPath = getConfigPath(false, cwd);
    try {
      if (fs.existsSync(projectPath)) {
        const projectData = JSON.parse(fs.readFileSync(projectPath, "utf-8")) as Partial<OrchestratorConfig>;
        resolved = {
          ...resolved,
          ...projectData,
          profiles: { ...resolved.profiles, ...(projectData.profiles || {}) },
          pipelines: { ...resolved.pipelines, ...(projectData.pipelines || {}) },
        };
      }
    } catch {
      // Ignore error
    }
  }

  return resolved;
}

/** Resolves a pipeline by name, or parses a comma-separated role chain. */
export function resolvePipeline(
  spec: string,
  config: OrchestratorConfig
): string[] | undefined {
  const named = config.pipelines?.[spec.toLowerCase().trim()];
  if (named && named.length > 0) return named;
  const inline = spec
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  return inline.length > 1 ? inline : undefined;
}

export function saveConfig(
  config: OrchestratorConfig,
  isGlobal = true,
  cwd?: string
): void {
  const filePath = getConfigPath(isGlobal, cwd);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
}

export function getProfileFor(
  specialistOrProfile: string,
  config: OrchestratorConfig
): AgentProfile | undefined {
  const key = specialistOrProfile.toLowerCase().trim();
  if (config.profiles[key]) return config.profiles[key];
  if (config.defaultProfile && config.profiles[config.defaultProfile]) {
    return config.profiles[config.defaultProfile];
  }
  return undefined;
}

/** Resolves a role's soul markdown file, or undefined when none is installed. */
export function getSoulPath(role: string): string | undefined {
  const baseDir = import.meta.dirname || "";
  const cleanName = role.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const candidates = [
    path.join(baseDir, "..", "..", "souls", `${cleanName}.md`),
    path.join(baseDir, "..", "souls", `${cleanName}.md`),
    path.join(process.cwd(), "souls", `${cleanName}.md`),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return path.resolve(c);
    }
  }
  return undefined;
}

/**
 * Builds the `pi` launch command for a role.
 *
 * Thinking is passed through the dedicated `--thinking` flag rather than a
 * model suffix: a variant id such as `...:free` would otherwise collide with
 * the `:thinking` shorthand and produce an unparseable `:free:off`.
 */
/**
 * Builds the `pi` launch command for a role.
 *
 * The command deliberately carries **no model and no thinking level**: both are
 * applied after the session starts, via `/model` and `/thinking` (see
 * `role_setup.ts`). Passing `--model` would resolve against the built-in
 * catalog before extension-registered account providers exist, which both
 * blocks alias-served models and silently bills the wrong account.
 *
 * What remains here is purely structural: the tool allowlist, the soul, and
 * context isolation — none of which affect provider or account resolution.
 */
export function buildPiLaunchCommand(profile?: AgentProfile): string {
  if (!profile) return "pi";
  const parts = ["pi"];

  if (isCliSafeProvider(profile.provider)) {
    parts.push("--provider", profile.provider!.trim());
  }
  if (profile.tools && profile.tools.length > 0) {
    parts.push("--tools", profile.tools.join(","));
  }
  if (profile.excludeTools && profile.excludeTools.length > 0) {
    parts.push("--exclude-tools", profile.excludeTools.join(","));
  }
  if (profile.noSkills) parts.push("--no-skills");
  if (profile.noExtensions) parts.push("--no-extensions");
  if (profile.noContextFiles) parts.push("--no-context-files");

  const soulPath = profile.appendSystemPrompt || getSoulPath(profile.soul || profile.name);
  if (soulPath) {
    parts.push("--append-system-prompt", `"${soulPath.replace(/"/g, '\\"')}"`);
  }
  return parts.join(" ");
}
