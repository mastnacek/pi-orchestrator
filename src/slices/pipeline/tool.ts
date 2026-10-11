import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { PluginState } from "../../shared/state.ts";
import { resolvePipeline } from "../../shared/config.ts";
import { runPipeline, formatPipelineResult } from "../../shared/pipeline.ts";

export function registerPipelineTool(pi: ExtensionAPI, state: PluginState): void {
  pi.registerTool({
    name: "orch_pipeline",
    label: "Orchestrator Pipeline",
    description:
      "Run a chained role pipeline in Herdr panes (e.g. scout → implementer → reviewer). Each stage runs in its own pane with its soul and tool boundary, receiving the previous stage's report as an explicit handoff. Built-in pipelines: build, design, research, repair. A custom chain can be given as comma-separated role names.",
    parameters: Type.Object({
      pipeline: Type.String({
        description:
          "Pipeline name (build, design, research, repair) or a comma-separated role chain such as 'scout,implementer,reviewer'.",
      }),
      task: Type.String({
        description: "The task the chain must accomplish, passed to every stage.",
      }),
    }),
    execute: async (_toolCallId, params, _signal, _onUpdate, ctx) => {
      try {
        const stages = resolvePipeline(params.pipeline, state.config);
        if (!stages) {
          return {
            content: [
              {
                type: "text",
                text: `Unknown pipeline "${params.pipeline}". Available: ${Object.keys(state.config.pipelines || {}).join(", ")} — or pass a comma-separated role chain.`,
              },
            ],
            isError: true,
            details: { error: "unknown_pipeline" },
          };
        }

        const result = await runPipeline(stages, params.task, ctx, state);
        return {
          content: [{ type: "text", text: formatPipelineResult(result, state.lang) }],
          details: result,
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Pipeline failed: ${message}` }],
          isError: true,
          details: { error: message },
        };
      }
    },
  });
}