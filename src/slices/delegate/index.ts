import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { PluginState } from "../../shared/state.ts";
import {
  currentPaneId,
  promptAgent,
  resolveProjectDirectory,
  resolveTarget,
  runInPane,
  splitPane,
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
        const resolved = await resolveTarget(params.target, ctx.cwd);
        let resolvedTarget = resolved.paneId;

        // If no agent exists in the target and target isn't an explicit raw pane_id, split a new pane!
        if (!resolved.hasAgent && params.target.toLowerCase() !== resolved.paneId.toLowerCase()) {
          const projectDir = resolveProjectDirectory(params.target, ctx.cwd) || ctx.cwd;
          resolvedTarget = await splitPane({
            cwd: projectDir,
            direction: "right",
          });
          await runInPane(resolvedTarget, "pi");
        }

        const myPane = currentPaneId();
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
