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

        const lines: string[] = [
          `Herdr multiplexer: ${active ? "active (HERDR_ENV=1)" : "offline/detached"}`,
          `Orchestrator pane: ${myPane || "unknown"}`,
          `\nLive agents (${agents.length}):`,
        ];

        if (agents.length === 0) {
          lines.push("  (no active agents reported by Herdr)");
        } else {
          for (const a of agents) {
            const isSelf = myPane && a.pane_id.toLowerCase() === myPane.toLowerCase();
            lines.push(
              `  - ${a.agent} [${a.agent_status}] in pane ${a.pane_id} (tab ${a.tab_id})${isSelf ? " [ORCHESTRATOR SELF]" : ""}`
            );
            if (a.cwd) lines.push(`    cwd: ${a.cwd}`);
          }
        }

        lines.push(`\nTabs (${tabs.length}):`);
        for (const t of tabs) {
          lines.push(`  - Tab #${t.number} (${t.tab_id}): label="${t.label || ""}", panes=${t.pane_count}`);
        }

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
