import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Type } from "typebox";
import type { PluginState } from "../../shared/state.ts";
import { checkRoute } from "../../shared/uma_client.ts";

export function registerRouteTool(pi: ExtensionAPI, state: PluginState): void {
  pi.registerTool({
    name: "orch_route",
    label: "Orchestrator Route",
    description:
      "Consult UMA's System-1 fastbrain router to determine which project specialist should handle a prompt. Returns the target specialist, confidence, runner-up, and a pre-warmed context slice for the handoff.",
    parameters: Type.Object({
      prompt: Type.String({ description: "The task prompt or user request to route." }),
      judge: Type.Optional(
        StringEnum(["off", "jev"] as const)
      ),
      maxContext: Type.Optional(
        Type.Number({ description: "Maximum facts to recall into the handoff context slice (default: 3)." })
      ),
    }),
    execute: async (_toolCallId, params, _signal, _onUpdate, ctx) => {
      try {
        const judge = params.judge || "off";
        const maxContext = params.maxContext ?? 3;
        const verdict = await checkRoute(params.prompt, ctx.cwd, judge, maxContext);
        state.lastVerdict = verdict;

        const summary = verdict.specialist
          ? `Route: ${verdict.specialist} (confidence ${(verdict.confidence * 100).toFixed(0)}%, judge ${verdict.judged_by}) with ${verdict.context_slice.length} context fact(s).`
          : `No confident route (confidence ${(verdict.confidence * 100).toFixed(0)}%, runner-up: ${verdict.runner_up || "none"}). Escalating to orchestrator model.`;

        return {
          content: [
            {
              type: "text",
              text: `${summary}\n\n${JSON.stringify(verdict, null, 2)}`,
            },
          ],
          details: verdict,
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error routing task: ${message}` }],
          isError: true,
          details: { error: message },
        };
      }
    },
  });
}
