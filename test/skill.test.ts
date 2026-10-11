import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { getDefaultConfig } from "../src/shared/config.ts";

/**
 * The shipped skill drifted once: the plugin gained soul-bound roles and
 * pipelines while SKILL.md still advertised the previous roster and models.
 * An operator caught it, not a test. These assertions make the drift loud.
 */
function readSkill(): string {
  const baseDir = import.meta.dirname || "";
  const candidates = [
    path.join(baseDir, "..", "skills", "orchestrator", "SKILL.md"),
    path.join(process.cwd(), "skills", "orchestrator", "SKILL.md"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return fs.readFileSync(c, "utf-8");
  }
  throw new Error("SKILL.md not found");
}

test("SKILL.md documents every shipped role", () => {
  const skill = readSkill();
  const cfg = getDefaultConfig();
  for (const role of Object.keys(cfg.profiles)) {
    assert.ok(skill.includes(`\`${role}\``), `SKILL.md is missing role \`${role}\``);
  }
});

test("SKILL.md documents every shipped pipeline", () => {
  const skill = readSkill();
  const cfg = getDefaultConfig();
  for (const name of Object.keys(cfg.pipelines || {})) {
    assert.ok(skill.includes(`\`${name}\``), `SKILL.md is missing pipeline \`${name}\``);
  }
});

test("SKILL.md documents every shipped tool and command", () => {
  const skill = readSkill();
  for (const tool of ["orch_route", "orch_pipeline", "orch_delegate", "orch_status", "orch_collect"]) {
    assert.ok(skill.includes(tool), `SKILL.md is missing tool ${tool}`);
  }
  for (const cmd of ["/orch auto", "/orch pipeline", "/orch route", "/orch split", "/orch profile"]) {
    assert.ok(skill.includes(cmd), `SKILL.md is missing command ${cmd}`);
  }
});

test("SKILL.md never advertises a model the plugin no longer ships", () => {
  const skill = readSkill();
  // Regression: these were replaced after the free model was rejected by the
  // account's privacy guardrails and the provider flag proved invalid.
  assert.ok(!skill.includes("claude-3-7-sonnet"), "stale model in SKILL.md");
  assert.ok(!skill.includes("nemotron-3-ultra-550b-a:off"), "stale model in SKILL.md");
});

test("SKILL.md documents the account-alias pitfall instead of recommending it", () => {
  const skill = readSkill();
  // The alias may appear only as a documented failure mode; it must never be
  // presented as a runnable flag in a shell block.
  if (skill.includes("openrouter-soukr")) {
    assert.ok(
      skill.includes("Unknown provider"),
      "the alias must be documented together with its failure"
    );
    assert.ok(
      !/--provider openrouter-soukr\s*\\/.test(skill),
      "the alias must not appear as a runnable command"
    );
  }
});
