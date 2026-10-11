import test from "node:test";
import assert from "node:assert/strict";
import { buildRuntimeSetupCommands } from "../src/shared/role_setup.ts";
import { buildSplitArgs } from "../src/shared/herdr_client.ts";
import { getDefaultConfig } from "../src/shared/config.ts";
import type { AgentProfile } from "../src/shared/config.ts";

test("runtime setup pins model and thinking via slash commands", () => {
  const profile: AgentProfile = {
    name: "reviewer",
    model: "anthropic/claude-sonnet-4.6",
    thinking: "high",
  };
  assert.deepEqual(buildRuntimeSetupCommands(profile), [
    "/model anthropic/claude-sonnet-4.6",
    "/thinking high",
  ]);
});

test("runtime setup qualifies the model with its provider", () => {
  const profile: AgentProfile = {
    name: "scout",
    provider: "openrouter-soukr",
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    thinking: "off",
  };
  const cmds = buildRuntimeSetupCommands(profile);
  assert.equal(
    cmds[0],
    "/model openrouter-soukr/nvidia/nemotron-3-ultra-550b-a55b:free",
    "an alias-provider model must reach /model fully qualified"
  );
  assert.equal(cmds[1], "/thinking off");
});

test("runtime setup omits absent fields and tolerates no profile", () => {
  assert.deepEqual(buildRuntimeSetupCommands(undefined), []);
  assert.deepEqual(buildRuntimeSetupCommands({ name: "x" }), []);
  assert.deepEqual(buildRuntimeSetupCommands({ name: "x", model: "a/b" }), ["/model a/b"]);
  assert.deepEqual(buildRuntimeSetupCommands({ name: "x", thinking: "low" }), ["/thinking low"]);
});

test("a pane split anchors to the caller's own pane, never --current", () => {
  // Regression: `--current` resolves to the server's focused pane, so a split
  // issued while another tab was focused created the role pane in that
  // unrelated tab. Roles must land in the tab the split is issued from.
  const args = buildSplitArgs({ cwd: "D:\\proj", direction: "right" }, "w1Z:p4");
  assert.ok(args.includes("w1Z:p4"), `own pane missing from ${args.join(" ")}`);
  assert.ok(!args.includes("--current"), "must not fall back to --current");
  assert.deepEqual(args, ["pane", "split", "w1Z:p4", "--direction", "right", "--cwd", "D:\\proj"]);
});

test("an explicit pane id wins over the caller's own pane", () => {
  const args = buildSplitArgs({ paneId: "w1Y:p2Q" }, "w1Z:p4");
  assert.ok(args.includes("w1Y:p2Q"));
  assert.ok(!args.includes("w1Z:p4"));
});

test("--current is used only outside a Herdr pane", () => {
  const args = buildSplitArgs({}, undefined);
  assert.ok(args.includes("--current"));
});

test("every shipped role can be fully configured at runtime", () => {
  // The whole point of the runtime path: any registered model is selectable,
  // including those served by extension-registered account providers.
  const cfg = getDefaultConfig();
  for (const [name, profile] of Object.entries(cfg.profiles)) {
    const cmds = buildRuntimeSetupCommands(profile);
    assert.ok(cmds.length > 0, `${name} produced no runtime setup`);
    assert.ok(cmds[0].startsWith("/model "), `${name} must pin a model`);
  }
});