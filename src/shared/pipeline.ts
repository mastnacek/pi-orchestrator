/**
 * Pipeline slice — chained role execution (scout → implementer → reviewer).
 *
 * Each stage runs in its own Herdr pane with its soul and tool boundary, and
 * receives the previous stage's report as an explicit handoff. The chain is
 * sequential by construction: a reviewer cannot audit work that does not exist
 * yet, and an implementer must not start before reconnaissance returns facts.
 *
 * The orchestrator itself never edits code. It opens panes, forwards handoffs,
 * waits for each stage to settle, and harvests the report for the next stage.
 */

import type { PluginState } from "./state.ts";

/**
 * The only slice of an extension context the pipeline needs.
 *
 * Kept structural so both `/orch pipeline` (a command context) and the
 * `orch_pipeline` tool (a tool context) can drive the same runner.
 */
export interface PipelineContext {
  cwd: string;
}
import { resolvePipeline, getProfileFor, buildPiLaunchCommand } from "./config.ts";
import { applyRuntimeSetup } from "./role_setup.ts";
import {
  listPanes,
  promptAgent,
  readAgent,
  renamePane,
  resolveProjectDirectory,
  resolveTarget,
  runInPane,
  splitPane,
  waitForAgentReady,
} from "./herdr_client.ts";
import { stringsFor } from "./i18n.ts";

export interface PipelineStageResult {
  role: string;
  paneId: string;
  report: string;
}

export interface PipelineResult {
  pipeline: string;
  stages: PipelineStageResult[];
  ok: boolean;
  failedStage?: string;
}

/** Upper bound on one stage: a stage that never settles must not hang the chain. */
const STAGE_TIMEOUT_MS = 10 * 60 * 1000;
const STAGE_POLL_MS = 5_000;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Waits for a pane's agent to leave `working` and reach a settled state.
 *
 * Returns the observed state, or `undefined` on timeout. `blocked` is settled
 * too: the agent is waiting on the operator, and spending the rest of the
 * budget would hide that from them.
 */
export async function waitForSettled(
  paneId: string,
  timeoutMs = STAGE_TIMEOUT_MS
): Promise<string | undefined> {
  const start = Date.now();
  let sawWork = false;
  while (Date.now() - start < timeoutMs) {
    try {
      const panes = await listPanes();
      const pane = panes.find((p) => p.pane_id.toLowerCase() === paneId.toLowerCase());
      const status = pane?.agent_status;
      if (status === "working") {
        sawWork = true;
      } else if (status && status !== "unknown") {
        // Settle only after the agent has actually been observed working, or
        // a fast stage would be harvested while its prompt is still in flight.
        if (sawWork || status === "blocked") return status;
      }
    } catch {
      // transient poll failure
    }
    await sleep(STAGE_POLL_MS);
  }
  return undefined;
}

/** Builds the prompt for one stage, embedding the accumulated handoff. */
export function buildStagePrompt(
  role: string,
  task: string,
  handoff: string,
  lang: "cs" | "en"
): string {
  const header =
    lang === "cs"
      ? `[Orchestrátor — role: ${role}]`
      : `[Orchestrator — role: ${role}]`;
  const parts = [header, "", lang === "cs" ? `Úkol: ${task}` : `Task: ${task}`];
  if (handoff.trim()) {
    parts.push(
      "",
      lang === "cs"
        ? "Předávací zpráva z předchozí etapy:"
        : "Handoff from the previous stage:",
      handoff.trim()
    );
  }
  return parts.join("\n");
}

/**
 * Runs a role chain, returning each stage's report.
 *
 * `onStage` lets the caller surface progress without this slice owning any UI.
 */
export async function runPipeline(
  stages: string[],
  task: string,
  ctx: PipelineContext,
  state: PluginState,
  onStage?: (index: number, role: string, total: number) => void
): Promise<PipelineResult> {
  const lang = state.lang;
  const results: PipelineStageResult[] = [];
  let handoff = "";

  for (let i = 0; i < stages.length; i++) {
    const role = stages[i];
    onStage?.(i, role, stages.length);

    // Reuse a live pane for this role when one exists, otherwise open one.
    const resolved = await resolveTarget(role, ctx.cwd);
    let paneId = resolved.paneId;

    if (!resolved.hasAgent) {
      const projectDir = resolveProjectDirectory(role, ctx.cwd) || ctx.cwd;
      paneId = await splitPane({
        cwd: projectDir,
        direction: state.config.splitDirection || "right",
      });
      await renamePane(paneId, `${role}`).catch(() => {});
      const profile = getProfileFor(role, state.config);
      await runInPane(paneId, buildPiLaunchCommand(profile));
      await waitForAgentReady(paneId);
      // Model and thinking are pinned at runtime: `--model` on the command line
      // would resolve before account providers register and bill the wrong one.
      await applyRuntimeSetup(paneId, profile);
    }

    await promptAgent(paneId, buildStagePrompt(role, task, handoff, lang));

    const settled = await waitForSettled(paneId);
    const report = await readAgent(paneId, 120).catch(() => "");
    results.push({ role, paneId, report });
    handoff = report;

    if (settled === undefined) {
      // A timed-out stage breaks the chain: the next role would be briefed on
      // an incomplete report, which is worse than stopping loudly.
      return { pipeline: stages.join(" → "), stages: results, ok: false, failedStage: role };
    }
    if (settled === "blocked") {
      return { pipeline: stages.join(" → "), stages: results, ok: false, failedStage: role };
    }
  }

  return { pipeline: stages.join(" → "), stages: results, ok: true };
}

/** Renders a pipeline result for the operator. */
export function formatPipelineResult(result: PipelineResult, lang: "cs" | "en"): string {
  const s = stringsFor(lang);
  const lines = [`── ${s.pipelineTitle}: ${result.pipeline} ──`];
  for (const stage of result.stages) {
    lines.push(`\n▸ ${stage.role} (${stage.paneId})`);
    const tail = stage.report.split("\n").slice(-12).join("\n").trim();
    lines.push(tail || (lang === "cs" ? "(žádný výstup)" : "(no output)"));
  }
  if (!result.ok) {
    lines.push(
      "",
      lang === "cs"
        ? `⚠️ Řetěz zastaven u role "${result.failedStage}" — zkontrolujte její panel.`
        : `⚠️ Chain stopped at role "${result.failedStage}" — inspect its pane.`
    );
  }
  return lines.join("\n");
}