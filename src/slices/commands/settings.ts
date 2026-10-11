import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { stringsFor, type Locale } from "../../shared/i18n.ts";
import type { PluginState } from "../../shared/state.ts";
import { saveConfig } from "../../shared/config.ts";
import type { AutocompleteChoice } from "./profile.ts";

export function getSettingsCompletions(
  parts: string[],
  state: PluginState
): AutocompleteChoice[] {
  const cs = stringsFor(state.lang);

  if (parts[0] === "lang") {
    const isEn = state.lang === "en";
    const isCs = state.lang === "cs";
    return [
      {
        label: isEn ? "en ✓" : "en",
        value: "lang en",
        description: `${cs.compLangEn}${isEn ? " · ● AKTIVNÍ" : ""}`,
      },
      {
        label: isCs ? "cs ✓" : "cs",
        value: "lang cs",
        description: `${cs.compLangCs}${isCs ? " · ● AKTIVNÍ" : ""}`,
      },
    ].filter((sub) => parts.length <= 1 || sub.label.startsWith(parts[1] || ""));
  }

  if (parts[0] === "auto-confirm") {
    const isOn = state.config.autoConfirm;
    return [
      {
        label: isOn ? "on ✓" : "on",
        value: "auto-confirm on",
        description: `${cs.compAutoConfirmOn}${isOn ? " · ● AKTIVNÍ" : ""}`,
      },
      {
        label: !isOn ? "off ✓" : "off",
        value: "auto-confirm off",
        description: `${cs.compAutoConfirmOff}${!isOn ? " · ● AKTIVNÍ" : ""}`,
      },
    ].filter((sub) => parts.length <= 1 || sub.label.startsWith(parts[1] || ""));
  }

  if (parts[0] === "direction") {
    const isRight = (state.config.splitDirection || "right") === "right";
    return [
      {
        label: isRight ? "right ✓" : "right",
        value: "direction right",
        description: `${cs.compDirectionRight}${isRight ? " · ● AKTIVNÍ" : ""}`,
      },
      {
        label: !isRight ? "down ✓" : "down",
        value: "direction down",
        description: `${cs.compDirectionDown}${!isRight ? " · ● AKTIVNÍ" : ""}`,
      },
    ].filter((sub) => parts.length <= 1 || sub.label.startsWith(parts[1] || ""));
  }

  return [];
}

export async function handleSettingsCommand(
  subcmd: string,
  restText: string,
  ctx: ExtensionCommandContext,
  state: PluginState
): Promise<boolean> {
  const s = stringsFor(state.lang);
  const rawParts = restText.split(/\s+/).filter(Boolean);
  const isGlobal = rawParts.includes("--global");
  const parts = rawParts.filter((p) => p !== "--global");

  if (subcmd === "lang") {
    const target = parts[0]?.toLowerCase();
    if (target === "en" || target === "cs") {
      state.lang = target as Locale;
      if (ctx.hasUI) {
        ctx.ui.notify(`Language set to ${state.lang}`, "info");
      }
    }
    return true;
  }

  if (subcmd === "auto-confirm") {
    const target = parts[0]?.toLowerCase();
    if (target === "on" || target === "true") {
      state.config.autoConfirm = true;
      saveConfig(state.config, isGlobal, ctx.cwd);
      if (ctx.hasUI) ctx.ui.notify(s.autoConfirmSet(true), "info");
    } else if (target === "off" || target === "false") {
      state.config.autoConfirm = false;
      saveConfig(state.config, isGlobal, ctx.cwd);
      if (ctx.hasUI) ctx.ui.notify(s.autoConfirmSet(false), "info");
    } else {
      if (ctx.hasUI) {
        ctx.ui.notify(
          `Auto-confirm: ${state.config.autoConfirm ? "ON" : "OFF"}\nUsage: /orch auto-confirm on|off [--global]`,
          "info"
        );
      }
    }
    return true;
  }

  if (subcmd === "direction") {
    const target = parts[0]?.toLowerCase();
    if (target === "right" || target === "down") {
      state.config.splitDirection = target;
      saveConfig(state.config, isGlobal, ctx.cwd);
      if (ctx.hasUI) ctx.ui.notify(s.directionSet(target), "info");
    } else {
      if (ctx.hasUI) {
        ctx.ui.notify(
          `Split direction: ${state.config.splitDirection}\nUsage: /orch direction right|down [--global]`,
          "info"
        );
      }
    }
    return true;
  }

  return false;
}
