import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPiLaunchCommand,
  getDefaultConfig,
  getProfileFor,
  type AgentProfile,
} from "../src/shared/config.ts";

test("buildPiLaunchCommand formats model and thinking levels", () => {
  const profile: AgentProfile = {
    name: "test",
    model: "anthropic/claude-3-7-sonnet",
    thinking: "high",
  };
  const cmd = buildPiLaunchCommand(profile);
  assert.equal(cmd, "pi --model anthropic/claude-3-7-sonnet:high");
});

test("buildPiLaunchCommand includes explicit provider flag if set", () => {
  const profile: AgentProfile = {
    name: "test-prov",
    provider: "openrouter-soukr",
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    thinking: "off",
  };
  const cmd = buildPiLaunchCommand(profile);
  assert.equal(cmd, "pi --provider openrouter-soukr --model nvidia/nemotron-3-ultra-550b-a55b:free:off");
});

test("buildPiLaunchCommand formats system prompt", () => {
  const profile: AgentProfile = {
    name: "test",
    appendSystemPrompt: "Specialist instructions",
  };
  const cmd = buildPiLaunchCommand(profile);
  assert.equal(cmd, 'pi --append-system-prompt "Specialist instructions"');
});

test("buildPiLaunchCommand returns bare pi for empty profile", () => {
  assert.equal(buildPiLaunchCommand(undefined), "pi");
});

test("getProfileFor resolves specialist profile or falls back to default", () => {
  const cfg = getDefaultConfig();
  const uma = getProfileFor("pi-uma", cfg);
  assert.ok(uma);
  assert.equal(uma.name, "pi-uma");
  assert.equal(uma.model, "nvidia/nemotron-3-ultra-550b-a55b:free");

  const scout = getProfileFor("scout", cfg);
  assert.ok(scout);
  assert.equal(scout.name, "scout");

  // Unknown specialist falls back to default profile (fast)
  const unknown = getProfileFor("completely_new_project", cfg);
  assert.ok(unknown);
  assert.equal(unknown.name, "fast");
});
