import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { stringsFor, type Locale } from "../../shared/i18n.ts";
import type { PluginState } from "../../shared/state.ts";
import { checkRoute } from "../../shared/uma_client.ts";
import {
  currentPaneId,
  isHerdrActive,
  listAgents,
  promptAgent,
  renamePane,
  resolveProjectDirectory,
  resolveTarget,
  runInPane,
  splitPane,
  waitForAgentReady,
} from "../../shared/herdr_client.ts";

export function registerCommands(pi: ExtensionAPI, state: PluginState): void {
  const s = stringsFor(state.lang);

  pi.registerCommand("orch", {
    description: s.commandDesc,
    getArgumentCompletions: async (token: string) => {
      const cs = stringsFor(state.lang);
      const trimmed = token.trimStart();
      const parts = trimmed.split(/\s+/);

      if (parts.length <= 1 && !trimmed.includes(" ")) {
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
            label: "status",
            value: "status",
            description: cs.compStatus,
          },
          {
            label: "lang",
            value: "lang ",
            description: cs.compLang,
          },
        ];
        return subcommands.filter((sub) => sub.label.startsWith(parts[0]));
      }

      if (parts[0] === "lang") {
        return [
          { label: "en", value: "lang en", description: cs.compLangEn },
          { label: "cs", value: "lang cs", description: cs.compLangCs },
        ].filter((sub) => sub.label.startsWith(parts[1] || ""));
      }

      return [];
    },
    handler: async (rawArgs: string, ctx: ExtensionCommandContext) => {
      const currentStrings = stringsFor(state.lang);
      const args = rawArgs.trim();

      if (!args || args === "status") {
        const active = isHerdrActive();
        const myPane = currentPaneId();
        const agents = await listAgents(ctx.cwd).catch(() => []);

        const lines = [
          `── Herdr Orchestrator Status ──`,
          `Herdr active: ${active ? "yes (HERDR_ENV=1)" : "no"}`,
          `Orchestrator pane: ${myPane || "unknown"}`,
          `Agents (${agents.length}):`,
        ];
        for (const a of agents) {
          lines.push(`  • ${a.agent} [${a.agent_status}] in ${a.pane_id} (${a.cwd || ""})`);
        }
        if (ctx.hasUI) {
          ctx.ui.notify(lines.join("\n"), "info");
        }
        return;
      }

      const [subcmd, ...rest] = args.split(/\s+/);
      const restText = rest.join(" ").trim();

      if (subcmd === "lang") {
        if (restText === "en" || restText === "cs") {
          state.lang = restText as Locale;
          if (ctx.hasUI) {
            ctx.ui.notify(`Language set to ${state.lang}`, "info");
          }
        }
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
        if (!restText) {
          if (ctx.hasUI) ctx.ui.notify(currentStrings.usageRoute, "warning");
          return;
        }

        try {
          const verdict = await checkRoute(restText, ctx.cwd);
          state.lastVerdict = verdict;

          const lines = [
            `── ${currentStrings.routeTitle} ──`,
            verdict.specialist
              ? `Winner: ${verdict.specialist} (${(verdict.confidence * 100).toFixed(0)}%, judge: ${verdict.judged_by})`
              : `${currentStrings.noRoute} (runner-up: ${verdict.runner_up || "none"})`,
          ];
          if (verdict.context_slice.length > 0) {
            lines.push(`Context slice facts (${verdict.context_slice.length}):`);
            for (const f of verdict.context_slice) {
              lines.push(`  • [${f.fact_type}] ${f.title}`);
            }
          }
          if (ctx.hasUI) {
            ctx.ui.notify(lines.join("\n"), verdict.specialist ? "info" : "warning");
          }
        } catch (err) {
          if (ctx.hasUI) {
            ctx.ui.notify(`Route error: ${String(err)}`, "error");
          }
        }
        return;
      }

      if (subcmd === "auto") {
        if (!restText) {
          if (ctx.hasUI) ctx.ui.notify(currentStrings.usageAuto, "warning");
          return;
        }

        try {
          const verdict = await checkRoute(restText, ctx.cwd);
          state.lastVerdict = verdict;

          if (!verdict.specialist) {
            if (ctx.hasUI) {
              ctx.ui.notify(
                `${currentStrings.noRoute}\nRunner-up: ${verdict.runner_up || "none"}\nPlease use manual delegation or rephrase.`,
                "warning"
              );
            }
            return;
          }

          // Confident route -> delegate
          if (ctx.hasUI) {
            ctx.ui.notify(
              `Routing to ${verdict.specialist} (${(verdict.confidence * 100).toFixed(0)}%)...\nDelegating prompt.`,
              "info"
            );
          }

          let finalPrompt = restText;
          if (verdict.context_slice.length > 0) {
            const ctxLines = verdict.context_slice.map(
              (f, i) => `  ${i + 1}. [${f.fact_type}] ${f.title} (${f.id})`
            );
            finalPrompt = `[UMA Context Slice]:\n${ctxLines.join("\n")}\n\n[Task]:\n${restText}`;
          }

          const resolved = await resolveTarget(verdict.specialist, ctx.cwd);
          let targetPaneId = resolved.paneId;

          if (ctx.hasUI) {
            const confPct = Math.round(verdict.confidence * 100);
            const dialogTitle = currentStrings.dialogRouteTitle(
              verdict.specialist,
              confPct,
              resolved.paneId,
              resolved.agentKind || "none",
              resolved.agentStatus || "none",
              verdict.context_slice.length
            );

            let options: string[] = [];
            if (resolved.hasAgent) {
              options = [
                currentStrings.optSendToPane(
                  resolved.paneId,
                  resolved.agentKind || "agent",
                  resolved.agentStatus || "idle"
                ),
                currentStrings.optSplitNew,
                currentStrings.optCancel,
              ];
            } else {
              options = [
                currentStrings.optOpenNewAndLaunch(verdict.specialist),
                currentStrings.optCancel,
              ];
            }

            const choice = await ctx.ui.select(dialogTitle, options);
            if (!choice || choice === currentStrings.optCancel) {
              ctx.ui.notify(currentStrings.delegationCancelled, "info");
              return;
            }

            if (
              choice === currentStrings.optSplitNew ||
              choice === currentStrings.optOpenNewAndLaunch(verdict.specialist)
            ) {
              const projectDir =
                resolveProjectDirectory(verdict.specialist, ctx.cwd) || ctx.cwd;
              ctx.ui.notify(`Opening new pane for ${verdict.specialist}...`, "info");
              targetPaneId = await splitPane({
                cwd: projectDir,
                direction: "right",
              });
              await renamePane(targetPaneId, `Specialist: ${verdict.specialist}`).catch(() => {});
              await runInPane(targetPaneId, "pi");
              await waitForAgentReady(targetPaneId);
            }
          } else {
            if (!resolved.hasAgent) {
              const projectDir =
                resolveProjectDirectory(verdict.specialist, ctx.cwd) || ctx.cwd;
              targetPaneId = await splitPane({
                cwd: projectDir,
                direction: "right",
              });
              await runInPane(targetPaneId, "pi");
              await waitForAgentReady(targetPaneId);
            }
          }

          await promptAgent(targetPaneId, finalPrompt);

          if (ctx.hasUI) {
            ctx.ui.notify(currentStrings.delegated(`${verdict.specialist} (${targetPaneId})`), "info");
          }
        } catch (err) {
          if (ctx.hasUI) {
            ctx.ui.notify(`Auto route failed: ${String(err)}`, "error");
          }
        }
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

        try {
          const resolved = await resolveTarget(target, ctx.cwd);
          let targetPaneId = resolved.paneId;

          if (!resolved.hasAgent && target.toLowerCase() !== resolved.paneId.toLowerCase()) {
            const projectDir = resolveProjectDirectory(target, ctx.cwd) || ctx.cwd;
            targetPaneId = await splitPane({
              cwd: projectDir,
              direction: "right",
            });
            await runInPane(targetPaneId, "pi");
            await waitForAgentReady(targetPaneId);
          }

          await promptAgent(targetPaneId, taskText);

          if (ctx.hasUI) {
            ctx.ui.notify(currentStrings.delegated(`${target} (${targetPaneId})`), "info");
          }
        } catch (err) {
          if (ctx.hasUI) {
            ctx.ui.notify(`Delegation failed: ${String(err)}`, "error");
          }
        }
        return;
      }

      if (ctx.hasUI) {
        ctx.ui.notify(currentStrings.unknownCommand, "warning");
      }
    },
  });
}
