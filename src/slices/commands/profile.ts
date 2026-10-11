import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { stringsFor } from "../../shared/i18n.ts";
import type { PluginState } from "../../shared/state.ts";
import { saveConfig } from "../../shared/config.ts";

export interface AutocompleteChoice {
  label: string;
  value: string;
  description: string;
}

export function getProfileCompletions(
  parts: string[],
  state: PluginState
): AutocompleteChoice[] {
  const cs = stringsFor(state.lang);

  // Level 2: /orch profile <subcommand>
  if (parts.length <= 1 || (parts.length === 2 && !parts[1])) {
    const defaultName = state.config.defaultProfile || "fast";
    return [
      {
        label: "menu",
        value: "profile menu",
        description: cs.compProfileMenu,
      },
      {
        label: "list",
        value: "profile list",
        description: cs.compProfileList,
      },
      {
        label: "select",
        value: "profile select ",
        description: `${cs.compProfileSelect} (nyní: ${defaultName})`,
      },
      {
        label: "set",
        value: "profile set ",
        description: cs.compProfileSet,
      },
      {
        label: "remove",
        value: "profile remove ",
        description: cs.compProfileRemove,
      },
    ].filter((item) => parts.length <= 1 || item.label.startsWith(parts[1] || ""));
  }

  // Level 3: /orch profile select <name>
  if (parts[1] === "select") {
    const prefix = parts[2] || "";
    return Object.keys(state.config.profiles)
      .filter((name) => name.toLowerCase().startsWith(prefix.toLowerCase()))
      .map((name) => {
        const p = state.config.profiles[name];
        const isActive = name === state.config.defaultProfile;
        return {
          label: isActive ? `${name} ✓` : name,
          value: `profile select ${name}`,
          description: `Model: ${p.model || "default"}${isActive ? " · ● AKTIVNÍ" : ""}`,
        };
      });
  }

  // Level 3: /orch profile remove <name>
  if (parts[1] === "remove") {
    const prefix = parts[2] || "";
    return Object.keys(state.config.profiles)
      .filter((name) => name.toLowerCase().startsWith(prefix.toLowerCase()))
      .map((name) => ({
        label: name,
        value: `profile remove ${name}`,
        description: `Remove ${name}`,
      }));
  }

  return [];
}

export async function handleProfileCommand(
  restText: string,
  ctx: ExtensionCommandContext,
  state: PluginState
): Promise<void> {
  const s = stringsFor(state.lang);
  const rawParts = restText.split(/\s+/).filter(Boolean);
  const isGlobal = rawParts.includes("--global");
  const parts = rawParts.filter((p) => p !== "--global");
  const sub = parts[0]?.toLowerCase() || "menu";

  if (sub === "menu" || (!restText && ctx.hasUI)) {
    if (ctx.hasUI) {
      const profileNames = Object.keys(state.config.profiles);
      const options = profileNames.map((name) => {
        const p = state.config.profiles[name];
        const activeMarker = name === state.config.defaultProfile ? " [AKTIVNÍ]" : "";
        return `${name} • ${p.model || "default"}${activeMarker}`;
      });
      options.push("Cancel");

      const choice = await ctx.ui.select("Agent Profiles (Orchestrator)", options);
      if (!choice || choice === "Cancel") return;

      const chosenName = choice.split(" • ")[0].trim();
      state.config.defaultProfile = chosenName;
      saveConfig(state.config, isGlobal, ctx.cwd);
      ctx.ui.notify(s.profileSelected(chosenName), "info");
      return;
    }
  }

  if (sub === "list" || !restText) {
    const lines = ["── Agent Profiles ──"];
    for (const [name, p] of Object.entries(state.config.profiles)) {
      const active = name === state.config.defaultProfile ? " (AKTIVNÍ)" : "";
      lines.push(`• ${name}${active}:`);
      lines.push(`    model: ${p.model || "(default)"}`);
      if (p.thinking) lines.push(`    thinking: ${p.thinking}`);
      if (p.appendSystemPrompt) lines.push(`    prompt: "${p.appendSystemPrompt}"`);
    }
    if (ctx.hasUI) {
      ctx.ui.notify(lines.join("\n"), "info");
    }
    return;
  }

  if (sub === "select") {
    const name = parts[1];
    if (!name || !state.config.profiles[name]) {
      if (ctx.hasUI) ctx.ui.notify(s.profileNotFound(name || "unknown"), "warning");
      return;
    }
    state.config.defaultProfile = name;
    saveConfig(state.config, isGlobal, ctx.cwd);
    if (ctx.hasUI) ctx.ui.notify(s.profileSelected(name), "info");
    return;
  }

  if (sub === "set") {
    const name = parts[1];
    const model = parts.slice(2).join(" ").trim();
    if (!name || !model) {
      if (ctx.hasUI) ctx.ui.notify("Usage: /orch profile set <name> <model>", "warning");
      return;
    }
    state.config.profiles[name] = {
      ...(state.config.profiles[name] || { name }),
      name,
      model,
    };
    saveConfig(state.config, isGlobal, ctx.cwd);
    if (ctx.hasUI) ctx.ui.notify(s.profileSet(name, model), "info");
    return;
  }

  if (sub === "remove") {
    const name = parts[1];
    if (!name || !state.config.profiles[name]) {
      if (ctx.hasUI) ctx.ui.notify(s.profileNotFound(name || "unknown"), "warning");
      return;
    }
    delete state.config.profiles[name];
    if (state.config.defaultProfile === name) {
      state.config.defaultProfile = Object.keys(state.config.profiles)[0] || "fast";
    }
    saveConfig(state.config, isGlobal, ctx.cwd);
    if (ctx.hasUI) ctx.ui.notify(s.profileRemoved(name), "info");
    return;
  }
}
