import test from "node:test";
import assert from "node:assert/strict";
import { buildRuntimeSetupCommands } from "../src/shared/role_setup.ts";
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