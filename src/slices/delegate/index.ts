import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { PluginState } from "../../shared/state.ts";
import {
  currentPaneId,
  listAgents,
  promptAgent,
} from "../../shared/herdr_client.ts";

export function registerDelegateTool(pi: ExtensionAPI, state: PluginState): void {
  pi.registerTool({
    name: "orch_delegate",
    label: "Orchestrator Delegate",
    description:
      "Delegate a task prompt to a specialist coding agent in a Herdr pane. Automatically injects UMA memory context slice if available.",
    parameters: Type.Object({
      target: Type.String({
        description:
          "Target specialist, agent name (e.g. 'pi', 'agy'), pane ID (e.g. 'w1Y:p2Q'), or project name (e.g. 'pi-uma').",
      }),
      prompt: Type.String({
        description: "Task prompt / instructions to submit to the delegate agent.",
      }),
      includeContext: Type.Optional(
        Type.Boolean({
          description:
            "Prepend pre-warmed UMA memory facts from the routing verdict (default: true).",
        })
      ),
      wait: Type.Optional(
        Type.Boolean({
          description:
            "Wait for the agent to finish its turn or reach blocked state before returning (default: false).",
        })
      ),
      timeoutMs: Type.Optional(
        Type.Number({
          description: "Timeout in milliseconds when waiting (default: 60000).",
        })
      ),
    }),
    execute: async (_toolCallId, params, _signal, _onUpdate, ctx) => {
      try {
        const myPane = currentPaneId();
        if (myPane && params.target.toLowerCase() === myPane.toLowerCase()) {
          throw new Error(
            `Recursion prevented: Orchestrator cannot delegate to its own pane (${myPane})!`
          );
        }

        // Find best target identifier
        const agents = await listAgents(ctx.cwd).catch(() => []);
        let resolvedTarget = params.target;

        // Try matching target against agent pane_id, agent name, or project cwd
        const matched = agents.find((a) => {
          if (a.pane_id.toLowerCase() === params.target.toLowerCase()) return true;
          if (a.agent.toLowerCase() === params.target.toLowerCase()) return true;
          if (a.cwd && a.cwd.toLowerCase().endsWith(params.target.toLowerCase())) return true;
          return false;
        });

        if (matched) {
          resolvedTarget = matched.pane_id;
        }

        // Check if resolvedTarget is self
        if (myPane && resolvedTarget.toLowerCase() === myPane.toLowerCase()) {
          throw new Error(
            `Recursion prevented: Matched target resolved to orchestrator's own pane (${myPane})!`
          );
        }

        // Format prompt with context slice if requested
        let finalPrompt = params.prompt;
        const includeCtx = params.includeContext ?? true;
        if (includeCtx && state.lastVerdict?.context_slice && state.lastVerdict.context_slice.length > 0) {
          const contextLines = state.lastVerdict.context_slice.map(
            (f, i) => `  ${i + 1}. [${f.fact_type}] ${f.title} (${f.id})`
          );
          finalPrompt = `[UMA Memory Context Slice]:\n${contextLines.join("\n")}\n\n[Delegated Task]:\n${params.prompt}`;
        }

        const wait = params.wait ?? state.autoWait;
        const timeoutMs = params.timeoutMs ?? 60000;

        const res = await promptAgent(resolvedTarget, finalPrompt, {
          wait,
          timeoutMs,
        });

        return {
          content: [
            {
              type: "text",
              text: `Delegated to ${resolvedTarget} (target: ${params.target}):\n${res || "(prompt submitted)"}`,
            },
          ],
          details: {
            target: resolvedTarget,
            originalTarget: params.target,
            prompt: finalPrompt,
            wait,
            response: res,
          },
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Delegation failed: ${message}` }],
          isError: true,
          details: { error: message },
        };
      }
    },
  });
}
