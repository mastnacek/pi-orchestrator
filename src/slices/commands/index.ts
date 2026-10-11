import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { stringsFor } from "../../shared/i18n.ts";
import type { PluginState } from "../../shared/state.ts";
import {
  currentPaneId,
  renamePane,
  resolveProjectDirectory,
  runInPane,
  splitPane,
} from "../../shared/herdr_client.ts";
import { buildPiLaunchCommand, getProfileFor } from "../../shared/config.ts";
import { getProfileCompletions, handleProfileCommand } from "./profile.ts";
import { getSettingsCompletions, handleSettingsCommand } from "./settings.ts";
import {
  handleAutoCommand,
  handleDelegateCommand,
  handleRouteCommand,
  handleStatusCommand,
} from "./handlers.ts";

export function registerCommands(pi: ExtensionAPI, state: PluginState): void {
  const s = stringsFor(state.lang);

  pi.registerCommand("orch", {
    description: s.commandDesc,
    getArgumentCompletions: async (token: string) => {
      const cs = stringsFor(state.lang);
      const trimmed = token.trimStart();
      const parts = trimmed.split(/\s+/);

      if (parts.length <= 1 && !trimmed.includes(" ")) {
        const curProf = state.config.defaultProfile || "fast";
        const curDir = state.config.splitDirection || "right";
        const curConfirm = state.config.autoConfirm;

        const subcommands = [
          {
            label: "auto",
            value: "auto ",
            description: cs.compAuto,
          },
          {
            label: "route",
            value: "route ",
            description: cs.compRoute,
          },
          {
            label: "delegate",
            value: "delegate ",
            description: cs.compDelegate,
          },
          {
            label: "split",
            value: "split ",
            description: cs.compSplit,
          },
          {
            label: "rename",
            value: "rename ",
            description: cs.compRename,
          },
          {
            label: `profile (${curProf})`,
            value: "profile ",
            description: `${cs.compProfile} · ● AKTIVNÍ: ${curProf.toUpperCase()}`,
          },
          {
            label: `auto-confirm (${curConfirm ? "on" : "off"})`,
            value: "auto-confirm ",
            description: `${cs.compAutoConfirm}${curConfirm ? " · ● ZAPNUTO" : " · ○ VYPNUTO"}`,
          },
          {
            label: `direction (${curDir})`,
            value: "direction ",
            description: `${cs.compDirection} · ● AKTIVNÍ: ${curDir.toUpperCase()}`,
          },
          {
            label: `lang (${state.lang})`,
            value: "lang ",
            description: `${cs.compLang} · ● AKTIVNÍ: ${state.lang.toUpperCase()}`,
          },
          {
            label: "help",
            value: "help",
            description: cs.compHelp,
          },
          {
            label: "status",
            value: "status",
            description: cs.compStatus,
          },
        ];
        return subcommands.filter((sub) => sub.label.startsWith(parts[0]));
      }

      if (parts[0] === "profile") {
        return getProfileCompletions(parts, state);
      }

      if (parts[0] === "lang" || parts[0] === "auto-confirm" || parts[0] === "direction") {
        return getSettingsCompletions(parts, state);
      }

      return [];
    },
    handler: async (rawArgs: string, ctx: ExtensionCommandContext) => {
      const currentStrings = stringsFor(state.lang);
      const args = rawArgs.trim();

      if (!args || args === "status") {
        await handleStatusCommand(ctx, state);
        return;
      }

      const [subcmd, ...rest] = args.split(/\s+/);
      const restText = rest.join(" ").trim();

      if (subcmd === "profile") {
        await handleProfileCommand(restText, ctx, state);
        return;
      }

      if (subcmd === "help" || subcmd === "setup") {
        if (ctx.hasUI) {
          ctx.ui.notify(currentStrings.detailedHelp, "info");
        }
        return;
      }

      if (subcmd === "lang" || subcmd === "auto-confirm" || subcmd === "direction") {
        await handleSettingsCommand(subcmd, restText, ctx, state);
        return;
      }

      if (subcmd === "rename") {
        const label = restText;
        if (!label) {
          if (ctx.hasUI) ctx.ui.notify("Usage: /orch rename <label>", "warning");
          return;
        }
        const myPane = currentPaneId();
        if (!myPane) {
          if (ctx.hasUI) ctx.ui.notify("Cannot detect current pane ID", "warning");
          return;
        }
        try {
          await renamePane(myPane, label);
          if (ctx.hasUI) ctx.ui.notify(currentStrings.paneRenamed(myPane, label), "info");
        } catch (err) {
          if (ctx.hasUI) ctx.ui.notify(`Failed to rename: ${String(err)}`, "error");
        }
        return;
      }

      if (subcmd === "split") {
        const target = restText;
        const projectDir = target ? (resolveProjectDirectory(target, ctx.cwd) || target) : ctx.cwd;
        try {
          const newPaneId = await splitPane({
            cwd: projectDir,
            direction: "right",
          });
          const paneLabel = target ? `Specialist: ${target}` : "Terminal";
          await renamePane(newPaneId, paneLabel).catch(() => {});
          const profile = target ? getProfileFor(target, state.config) : undefined;
          const launchCmd = buildPiLaunchCommand(profile);
          await runInPane(newPaneId, launchCmd);
          if (ctx.hasUI) {
            ctx.ui.notify(currentStrings.paneOpened(newPaneId, projectDir), "info");
          }
        } catch (err) {
          if (ctx.hasUI) {
            ctx.ui.notify(`Failed to split pane: ${String(err)}`, "error");
          }
        }
        return;
      }

      if (subcmd === "route") {
        await handleRouteCommand(restText, ctx, state);
        return;
      }

      if (subcmd === "auto") {
        await handleAutoCommand(restText, ctx, state);
        return;
      }

      if (subcmd === "delegate") {
        const target = rest[0];
        const taskText = rest.slice(1).join(" ");
        if (!target || !taskText) {
          if (ctx.hasUI) {
            ctx.ui.notify(currentStrings.usageDelegate, "warning");
          }
          return;
        }
        await handleDelegateCommand(target, taskText, ctx, state);
        return;
      }

      if (ctx.hasUI) {
        ctx.ui.notify(currentStrings.unknownCommand, "warning");
      }
    },
  });
}
