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
  splitDirection: "right" | "down";
  autoConfirm: boolean;
}

/** Read-only tool allowlist shared by every reconnaissance role. */
const READ_ONLY_TOOLS = ["read", "ls", "find", "grep"];

/**
 * The default role roster.
 *
 * Modelled on the strongest multi-agent systems surveyed (pi-herdsman,
 * oh-my-opencode-slim, herdr-projects, VoltAgent): cheap read-only scouts feed
 * precise facts to expensive writers, and independent read-only reviewers
 * guard the result.
 */
export const DEFAULT_PROFILES: Record<string, AgentProfile> = {
  scout: {
    name: "scout",
    provider: "openrouter-soukr",
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    thinking: "off",
    tools: READ_ONLY_TOOLS,
    noSkills: true,
    noExtensions: true,
  },
  librarian: {
    name: "librarian",
    provider: "openrouter-soukr",
    model: "google/gemini-2.5-flash",
    thinking: "low",
    tools: ["read", "ls", "find", "grep", "bash"],
  },
  implementer: {
    name: "implementer",
    model: "anthropic/claude-3-7-sonnet",
    thinking: "high",
  },
  fixer: {
    name: "fixer",
    model: "google/gemini-2.5-flash",
    thinking: "low",
  },
  frontend: {
    name: "frontend",
    model: "anthropic/claude-3-7-sonnet",
    thinking: "high",
  },
  oracle: {
    name: "oracle",
    model: "anthropic/claude-3-7-sonnet",
    thinking: "high",
    tools: READ_ONLY_TOOLS,
    noExtensions: true,
  },
  reviewer: {
    name: "reviewer",
    model: "anthropic/claude-3-7-sonnet",
    thinking: "high",
    tools: READ_ONLY_TOOLS,
    noExtensions: true,
  },
  curator: {
    name: "curator",
    provider: "openrouter-soukr",
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    thinking: "off",
  },
  lotus: {
    name: "lotus",
    model: "anthropic/claude-3-7-sonnet",
    thinking: "high",
  },
  "pi-uma": {
    name: "pi-uma",
    provider: "openrouter-soukr",
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    thinking: "off",
  },
  mozek_rust: {
    name: "mozek_rust",
    model: "anthropic/claude-3-7-sonnet",
    thinking: "high",
  },
  fast: {
    name: "fast",
    model: "google/gemini-2.5-flash",
    thinking: "off",
  },
  frontier: {
    name: "frontier",
    model: "anthropic/claude-3-7-sonnet",
    thinking: "high",
  },
};

export function getDefaultConfig(): OrchestratorConfig {
  return {
    defaultProfile: "fast",
    profiles: { ...DEFAULT_PROFILES },
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
        };
      }
    } catch {
      // Ignore error
    }
  }

  return resolved;
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
export function buildPiLaunchCommand(profile?: AgentProfile): string {
  if (!profile) return "pi";
  const parts = ["pi"];

  if (profile.provider) {
    parts.push("--provider", profile.provider);
  }
  if (profile.model) {
    parts.push("--model", profile.model);
  }
  if (profile.thinking) {
    parts.push("--thinking", profile.thinking);
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
