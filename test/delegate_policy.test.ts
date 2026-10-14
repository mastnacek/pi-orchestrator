import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAgentPromptArgs,
  isStallFalseNegative,
  looksLikePaneId,
  shouldSplitPane,
} from "../src/shared/delegate_policy.ts";

test("only explicit pane ids are recognised as pane ids", () => {
  assert.equal(looksLikePaneId("w1Z:pK"), true);
  assert.equal(looksLikePaneId("w10:p1"), true);
  assert.equal(looksLikePaneId("  w1Z:pK "), true);
  assert.equal(looksLikePaneId("implementer"), false);
  assert.equal(looksLikePaneId("pi-uma"), false);
  assert.equal(looksLikePaneId("w1Z"), false, "a workspace is not a pane");
});

test("an unknown specialist splits a pane; a live agent or explicit pane does not", () => {
  assert.equal(shouldSplitPane(false, "implementer"), true, "SPAI-039 regression");
  assert.equal(shouldSplitPane(false, "pi-uma"), true);
  assert.equal(shouldSplitPane(true, "implementer"), false, "never split onto a live agent");
  assert.equal(
    shouldSplitPane(false, "w1Z:pK"),
    false,
    "an explicit, agent-less pane is prompted directly, not split",
  );
});

test("--timeout is never sent without --wait", () => {
  const noWait = buildAgentPromptArgs("w1Z:pK", "hi", { timeoutMs: 60000 });
  assert.deepEqual(noWait, ["agent", "prompt", "w1Z:pK", "hi"]);
  assert.equal(noWait.includes("--wait"), false);
  assert.equal(noWait.includes("--timeout"), false, "SPAI-038 regression");

  const waiting = buildAgentPromptArgs("w1Z:pK", "hi", { wait: true, timeoutMs: 60000 });
  assert.deepEqual(waiting, [
    "agent",
    "prompt",
    "w1Z:pK",
    "hi",
    "--wait",
    "--timeout",
    "60000",
  ]);

  assert.deepEqual(buildAgentPromptArgs("w1Z:pK", "hi", { wait: true }), [
    "agent",
    "prompt",
    "w1Z:pK",
    "hi",
    "--wait",
  ]);

  assert.deepEqual(
    buildAgentPromptArgs("w1Z:pK", "hi"),
    ["agent", "prompt", "w1Z:pK", "hi"],
    "no options at all",
  );
});

test("a stall report is only forgiven when the agent is demonstrably busy", () => {
  // The exact shape herdr emits (observed live on w1Z:pK): the error *code* is
  // the marker; the human message text alone must not qualify.
  const stall =
    '{"error":{"code":"agent_prompt_stalled","message":"agent prompt produced no observed working or blocked state within 5000 ms; current status is idle"}}';
  assert.equal(isStallFalseNegative(stall, "working"), true, "SPAI-040 regression");
  assert.equal(isStallFalseNegative(stall, "blocked"), true);
  assert.equal(isStallFalseNegative(stall, "idle"), false, "a real stall stays an error");
  assert.equal(isStallFalseNegative(stall, undefined), false);
  assert.equal(isStallFalseNegative("agent_not_found", "working"), false, "unrelated errors pass");
  assert.equal(
    isStallFalseNegative(
      "agent prompt produced no observed working or blocked state within 5000 ms",
      "working",
    ),
    false,
    "only the CLI's own stall code counts, not any text mentioning a stall",
  );
});
