import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { stringsFor } from "../../shared/i18n.ts";
import type { PluginState } from "../../shared/state.ts";
import { checkRoute } from "../../shared/uma_client.ts";
import {
  currentPaneId,
  isHerdrActive,
  listAgents,
  listPanes,
  promptAgent,
  renamePane,
  resolveProjectDirectory,
  resolveTarget,
  runInPane,
  splitPane,
  waitForAgentReady,
} from "../../shared/herdr_client.ts";
import { buildPiLaunchCommand, getProfileFor } from "../../shared/config.ts";

export async function handleStatusCommand(
  ctx: ExtensionCommandContext,
  _state: PluginState
): Promise<void> {
  const active = isHerdrActive();
  const myPane = currentPaneId();
  const [agents, panes] = await Promise.all([
    listAgents(ctx.cwd).catch(() => []),
    listPanes(ctx.cwd).catch(() => []),
  ]);
  const myPaneLabel = panes.find(
    (p) => p.pane_id.toLowerCase() === (myPane || "").toLowerCase()
  )?.label;

  const lines = [
    `── Herdr Orchestrator Status ──`,
    `Herdr multiplexer: ${active ? "active (HERDR_ENV=1)" : "offline"}`,
    `Orchestrator pane: ${myPane || "unknown"}${myPaneLabel ? ` ("${myPaneLabel}")` : ""}`,
    `Panely a agenti (${panes.length}):`,
  ];
  for (const p of panes) {
    const isSelf = myPane && p.pane_id.toLowerCase() === myPane.toLowerCase();
    const labelStr = p.label ? ` "${p.label}"` : "";
    const agentStr = p.agent
      ? ` [agent: ${p.agent}, stav: ${p.agent_status || "idle"}]`
      : " [terminál]";
    lines.push(
      `  • Panel ${p.pane_id}${labelStr}${agentStr}${isSelf ? " [DISPEČER]" : ""}`
    );
  }
  lines.push(`\nPříklady rychlých akcí:`);
  lines.push(`  /orch auto "oprav WAL v pi-uma"`);
  lines.push(`  /orch split pi-uma`);
  lines.push(`  /orch rename "Hlavní dispečer"`);
  lines.push(`  /orch profile select pi-uma`);

  if (ctx.hasUI) {
    ctx.ui.notify(lines.join("\n"), "info");
  }
}

export async function handleRouteCommand(
  restText: string,
  ctx: ExtensionCommandContext,
  state: PluginState
): Promise<void> {
  const currentStrings = stringsFor(state.lang);
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
}

export async function handleAutoCommand(
  restText: string,
  ctx: ExtensionCommandContext,
  state: PluginState
): Promise<void> {
  const currentStrings = stringsFor(state.lang);
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
        resolved.paneLabel,
        resolved.agentKind || "none",
        resolved.agentStatus || "none",
        verdict.context_slice.length
      );

      let options: string[] = [];
      if (resolved.hasAgent) {
        options = [
          currentStrings.optSendToPane(
            resolved.paneId,
            resolved.paneLabel,
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
        const profile = getProfileFor(verdict.specialist, state.config);
        const launchCmd = buildPiLaunchCommand(profile);
        await runInPane(targetPaneId, launchCmd);
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
        const profile = getProfileFor(verdict.specialist, state.config);
        const launchCmd = buildPiLaunchCommand(profile);
        await runInPane(targetPaneId, launchCmd);
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
}

export async function handleDelegateCommand(
  target: string,
  taskText: string,
  ctx: ExtensionCommandContext,
  state: PluginState
): Promise<void> {
  const currentStrings = stringsFor(state.lang);
  try {
    const resolved = await resolveTarget(target, ctx.cwd);
    let targetPaneId = resolved.paneId;

    if (!resolved.hasAgent && target.toLowerCase() !== resolved.paneId.toLowerCase()) {
      const projectDir = resolveProjectDirectory(target, ctx.cwd) || ctx.cwd;
      targetPaneId = await splitPane({
        cwd: projectDir,
        direction: "right",
      });
      const profile = getProfileFor(target, state.config);
      const launchCmd = buildPiLaunchCommand(profile);
      await runInPane(targetPaneId, launchCmd);
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
}
