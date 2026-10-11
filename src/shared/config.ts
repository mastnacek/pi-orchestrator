import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";

export interface AgentProfile {
  name: string;
  model?: string;
  provider?: string;
  thinking?: ThinkingLevel;
  appendSystemPrompt?: string;
  cwd?: string;
}

export interface OrchestratorConfig {
  defaultProfile?: string;
  profiles: Record<string, AgentProfile>;
  splitDirection: "right" | "down";
  autoConfirm: boolean;
}

export const DEFAULT_PROFILES: Record<string, AgentProfile> = {
  "pi-uma": {
    name: "pi-uma",
    model: "nvidia/nemotron-3-ultra-550b-a:off",
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
  // Try loading global config first
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

  // Then overlay project config if it exists
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

export function buildPiLaunchCommand(profile?: AgentProfile): string {
  if (!profile) return "pi";
  const parts = ["pi"];
  if (profile.provider) {
    parts.push("--provider", profile.provider);
  }
  if (profile.model) {
    const thinkingSuffixes = [":off", ":minimal", ":low", ":medium", ":high", ":xhigh", ":max"];
    const hasThinking = thinkingSuffixes.some((s) => profile.model!.toLowerCase().endsWith(s));
    const modelArg =
      profile.thinking && !hasThinking
        ? `${profile.model}:${profile.thinking}`
        : profile.model;
    parts.push("--model", modelArg);
  }
  if (profile.appendSystemPrompt) {
    parts.push("--append-system-prompt", `"${profile.appendSystemPrompt.replace(/"/g, '\\"')}"`);
  }
  return parts.join(" ");
}
