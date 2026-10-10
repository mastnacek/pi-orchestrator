import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { PluginState } from "../../shared/state.ts";
import { readAgent } from "../../shared/herdr_client.ts";

export function registerCollectTool(pi: ExtensionAPI, _state: PluginState): void {
  pi.registerTool({
    name: "orch_collect",
    label: "Orchestrator Collect",
    description:
      "Read the latest terminal output from a delegated coding agent in Herdr to inspect its progress, findings, or completed work.",
    parameters: Type.Object({
      target: Type.String({
        description: "Agent name (e.g. 'pi', 'agy') or pane ID (e.g. 'w1Y:p2Q').",
      }),
      lines: Type.Optional(
        Type.Number({ description: "Maximum lines to read (default: 50)." })
      ),
    }),
    execute: async (_toolCallId, params, _signal, _onUpdate, _ctx) => {
      try {
        const lines = params.lines ?? 50;
        const output = await readAgent(params.target, lines);

        return {
          content: [
            {
              type: "text",
              text: `Terminal output from ${params.target} (last ${lines} lines):\n\n${output || "(no output)"}`,
            },
          ],
          details: {
            target: params.target,
            lines,
            output,
          },
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Failed to collect output from ${params.target}: ${message}` }],
          isError: true,
          details: { error: message },
        };
      }
    },
  });
}
