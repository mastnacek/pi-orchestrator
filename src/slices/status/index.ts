import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { PluginState } from "../../shared/state.ts";
import {
  currentPaneId,
  isHerdrActive,
  listAgents,
  listPanes,
  listTabs,
} from "../../shared/herdr_client.ts";

export function registerStatusTool(pi: ExtensionAPI, _state: PluginState): void {
  pi.registerTool({
    name: "orch_status",
    label: "Orchestrator Status",
    description:
      "Inspect the live Herdr workspace: active tabs, panes, and coding agents with their lifecycle states (idle, working, blocked, done).",
    parameters: Type.Object({}),
    execute: async (_toolCallId, _params, _signal, _onUpdate, ctx) => {
      try {
        const active = isHerdrActive();
        const myPane = currentPaneId();
        const [agents, panes, tabs] = await Promise.all([
          listAgents(ctx.cwd).catch(() => []),
          listPanes(ctx.cwd).catch(() => []),
          listTabs(ctx.cwd).catch(() => []),
        ]);

        const myPaneLabel = panes.find((p) => p.pane_id.toLowerCase() === (myPane || "").toLowerCase())?.label;
        const activeWs = panes[0]?.workspace_id || "default";

        const lines: string[] = [
          `── Herdr Orchestrator Status ──`,
          `Herdr multiplexer: ${active ? "active (HERDR_ENV=1)" : "offline/detached"}`,
          `Active workspace: ${activeWs}`,
          `Orchestrator pane: ${myPane || "unknown"}${myPaneLabel ? ` ("${myPaneLabel}")` : ""}`,
          `\nActive Panes & Agents (${panes.length} pane(s), ${agents.length} agent(s)):`,
        ];

        if (panes.length === 0) {
          lines.push("  (no active panes reported by Herdr)");
        } else {
          for (const p of panes) {
            const isSelf = myPane && p.pane_id.toLowerCase() === myPane.toLowerCase();
            const labelStr = p.label ? ` "${p.label}"` : "";
            const agentStr = p.agent ? ` [agent: ${p.agent}, status: ${p.agent_status || "unknown"}]` : " [terminal shell]";
            lines.push(`  • Pane ${p.pane_id}${labelStr}${agentStr}${isSelf ? " [ORCHESTRATOR SELF]" : ""}`);
            if (p.cwd) lines.push(`    cwd: ${p.cwd}`);
          }
        }

        lines.push(`\nTabs (${tabs.length}):`);
        for (const t of tabs) {
          lines.push(`  - Tab #${t.number} (${t.tab_id}): label="${t.label || ""}", panes=${t.pane_count}`);
        }

        lines.push(`\nWorkflow Quick Examples:`);
        lines.push(`  • /orch auto "zkontroluj AST kontrakty v pi-uma"`);
        lines.push(`  • /orch split pi-uma`);
        lines.push(`  • /orch rename "Hlavní dispečer"`);
        lines.push(`  • /orch profile select pi-uma`);

        return {
          content: [{ type: "text", text: lines.join("\n") }],
          details: {
            herdrActive: active,
            orchestratorPane: myPane,
            agents,
            panes,
            tabs,
          },
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Failed to fetch Herdr status: ${message}` }],
          isError: true,
          details: { error: message },
        };
      }
    },
  });
}
