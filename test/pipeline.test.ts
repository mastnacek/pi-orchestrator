import test from "node:test";
import assert from "node:assert/strict";
import { buildStagePrompt, formatPipelineResult, type PipelineResult } from "../src/shared/pipeline.ts";

test("buildStagePrompt embeds the role, the task and the handoff", () => {
  const prompt = buildStagePrompt("implementer", "Fix the WAL lock", "scout found x at line 42", "en");
  assert.ok(prompt.includes("role: implementer"));
  assert.ok(prompt.includes("Fix the WAL lock"));
  assert.ok(prompt.includes("scout found x at line 42"));
  assert.ok(prompt.includes("Handoff from the previous stage:"));
});

test("buildStagePrompt omits an empty handoff section", () => {
  const prompt = buildStagePrompt("scout", "Map the store", "", "en");
  assert.ok(!prompt.includes("Handoff from the previous stage:"));
  assert.ok(prompt.includes("role: scout"));
});

test("buildStagePrompt honours the Czech locale", () => {
  const prompt = buildStagePrompt("scout", "Zmapuj store", "predchozi", "cs");
  assert.ok(prompt.includes("Úkol: Zmapuj store"));
  assert.ok(prompt.includes("Předávací zpráva z předchozí etapy:"));
});

test("formatPipelineResult reports every stage and flags a stopped chain", () => {
  const ok: PipelineResult = {
    pipeline: "scout → implementer",
    ok: true,
    stages: [
      { role: "scout", paneId: "w1:p1", report: "facts" },
      { role: "implementer", paneId: "w1:p2", report: "patched" },
    ],
  };
  const text = formatPipelineResult(ok, "en");
  assert.ok(text.includes("scout → implementer"));
  assert.ok(text.includes("scout (w1:p1)"));
  assert.ok(text.includes("implementer (w1:p2)"));
  assert.ok(!text.includes("⚠️"));

  const stopped: PipelineResult = {
    pipeline: "scout → implementer",
    ok: false,
    failedStage: "implementer",
    stages: [{ role: "scout", paneId: "w1:p1", report: "facts" }],
  };
  assert.ok(formatPipelineResult(stopped, "en").includes('Chain stopped at role "implementer"'));
});