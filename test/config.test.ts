import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPiLaunchCommand,
  getDefaultConfig,
  getProfileFor,
  getSoulPath,
  isCliSafeProvider,
  resolvePipeline,
  type AgentProfile,
} from "../src/shared/config.ts";
import { buildRuntimeSetupCommands } from "../src/shared/role_setup.ts";

test("buildPiLaunchCommand carries no model and no thinking level", () => {
  // Both are applied at runtime via /model and /thinking. A CLI --model is
  // resolved before extension-registered account providers exist, which both
  // blocks alias-served models and silently bills the wrong account.
  const profile: AgentProfile = {
    name: "test",
    model: "anthropic/claude-sonnet-4.6",
    thinking: "high",
  };
  const cmd = buildPiLaunchCommand(profile);
  assert.ok(!cmd.includes("--model"), cmd);
  assert.ok(!cmd.includes("--thinking"), cmd);
});

test("buildPiLaunchCommand keeps the structural flags", () => {
  const profile: AgentProfile = {
    name: "scout",
    model: "google/gemini-2.5-flash-lite",
    thinking: "off",
    tools: ["read", "ls", "find", "grep"],
    noSkills: true,
    noExtensions: true,
  };
  const cmd = buildPiLaunchCommand(profile);
  assert.ok(cmd.includes("--tools read,ls,find,grep"));
  assert.ok(cmd.includes("--no-skills"));
  assert.ok(cmd.includes("--no-extensions"));
});

test("buildPiLaunchCommand formats a plain system prompt append", () => {
  const profile: AgentProfile = {
    name: "test",
    appendSystemPrompt: "Specialist instructions",
  };
  assert.equal(buildPiLaunchCommand(profile), 'pi --append-system-prompt "Specialist instructions"');
});

test("buildPiLaunchCommand returns bare pi for an empty profile", () => {
  assert.equal(buildPiLaunchCommand(undefined), "pi");
});

test("every default read-only role carries the read-only tool allowlist", () => {
  const cfg = getDefaultConfig();
  for (const role of ["scout", "reviewer", "oracle"]) {
    const p = cfg.profiles[role];
    assert.ok(p, `${role} must be defined`);
    assert.deepEqual(p.tools, ["read", "ls", "find", "grep"], `${role} must be read-only`);
  }
});

test("every default role resolves to an installed soul file", () => {
  const cfg = getDefaultConfig();
  for (const name of Object.keys(cfg.profiles)) {
    const soul = getSoulPath(name);
    // pi-uma / mozek_rust / fast / frontier are project/model profiles with no
    // dedicated soul; the role profiles below are the ones that must have one.
    const needsSoul = ["scout", "implementer", "reviewer", "oracle", "fixer", "frontend", "curator", "lotus"];
    if (needsSoul.includes(name)) {
      assert.ok(soul, `${name} must have a soul file`);
    }
  }
});

test("getProfileFor resolves a role profile or falls back to the default", () => {
  const cfg = getDefaultConfig();
  const scout = getProfileFor("scout", cfg);
  assert.ok(scout);
  assert.equal(scout.name, "scout");
  assert.equal(scout.model, "google/gemini-2.5-flash-lite");

  const unknown = getProfileFor("completely_new_project", cfg);
  assert.ok(unknown);
  assert.equal(unknown.name, "fast");
});

test("an extension-registered account alias is never passed as --provider", () => {
  const profile: AgentProfile = {
    name: "scout",
    provider: "openrouter-soukr",
    model: "google/gemini-2.5-flash-lite",
  };
  const cmd = buildPiLaunchCommand(profile);
  assert.ok(!cmd.includes("openrouter-soukr"), cmd);
  assert.ok(!cmd.includes("--provider"), cmd);
});

test("a catalog provider is passed through as --provider", () => {
  const profile: AgentProfile = { name: "x", provider: "openrouter", model: "foo/bar" };
  assert.ok(buildPiLaunchCommand(profile).includes("--provider openrouter"));
});

test("an extension-registered account alias never reaches the command line", () => {
  // The invariant flipped in v0.5.0: a profile MAY declare an alias provider,
  // because it is used only to qualify the runtime `/model` command. What must
  // never happen is the alias being handed to `pi` as a flag, which aborts
  // startup with "Unknown provider".
  const cfg = getDefaultConfig();
  for (const [name, p] of Object.entries(cfg.profiles)) {
    assert.ok(
      !buildPiLaunchCommand(p).includes(p.provider ?? "\u0000"),
      `${name} leaked provider ${p.provider} onto the command line`
    );
  }

  // The orchestrator is the case that matters: an alias it is allowed to keep.
  const orchestrator = cfg.profiles.orchestrator;
  assert.equal(orchestrator.provider, "openrouter-soukr");
  assert.ok(!buildPiLaunchCommand(orchestrator).includes("openrouter-soukr"));
});

test("the orchestrator runs the free nemotron through its own account", () => {
  const cfg = getDefaultConfig();
  const o = cfg.profiles.orchestrator;
  assert.equal(o.model, "nvidia/nemotron-3-ultra-550b-a55b:free");
  // The account qualifier is what routes the request away from the built-in
  // credential, which rejects free models with a 404.
  assert.deepEqual(buildRuntimeSetupCommands(o)[0],
    "/model openrouter-soukr/nvidia/nemotron-3-ultra-550b-a55b:free");
});

test("resolvePipeline resolves named chains and inline role lists", () => {
  const cfg = getDefaultConfig();
  assert.deepEqual(resolvePipeline("build", cfg), ["scout", "implementer", "reviewer"]);
  assert.deepEqual(resolvePipeline("BUILD", cfg), ["scout", "implementer", "reviewer"]);
  assert.deepEqual(resolvePipeline("scout,oracle", cfg), ["scout", "oracle"]);
  assert.equal(resolvePipeline("scout", cfg), undefined);
  assert.equal(resolvePipeline("nope", cfg), undefined);
});
