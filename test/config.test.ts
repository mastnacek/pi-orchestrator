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

test("buildPiLaunchCommand uses the dedicated --thinking flag, not a model suffix", () => {
  const profile: AgentProfile = {
    name: "test",
    model: "anthropic/claude-3-7-sonnet",
    thinking: "high",
  };
  assert.equal(
    buildPiLaunchCommand(profile),
    "pi --model anthropic/claude-3-7-sonnet --thinking high"
  );
});

test("a variant model id never collides with a thinking suffix", () => {
  // Regression: the old builder produced `...:free:off`, which pi cannot parse.
  const profile: AgentProfile = {
    name: "variant",
    provider: "openrouter",
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    thinking: "off",
  };
  const cmd = buildPiLaunchCommand(profile);
  assert.ok(cmd.includes("--model nvidia/nemotron-3-ultra-550b-a55b:free"));
  assert.ok(cmd.includes("--thinking off"));
  assert.ok(!cmd.includes(":free:off"));
});

test("read-only roles are structurally restricted via --tools", () => {
  const profile: AgentProfile = {
    name: "scout",
    tools: ["read", "ls", "find", "grep"],
    noSkills: true,
    noExtensions: true,
  };
  const cmd = buildPiLaunchCommand(profile);
  assert.ok(cmd.includes("--tools read,ls,find,grep"));
  assert.ok(cmd.includes("--no-skills"));
  assert.ok(cmd.includes("--no-extensions"));
  // The permissions are enforced by flags, not merely requested in prose.
  assert.ok(!cmd.includes("--model"));
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
  // Regression: `--provider openrouter-soukr` aborts pi with "Unknown provider"
  // because pi-openrouter-accounts registers the id at session_start, after the
  // CLI has already validated the flag. Omitting it lets the child resolve its
  // own configured account instead of failing to launch.
  const profile: AgentProfile = {
    name: "scout",
    provider: "openrouter-soukr",
    model: "google/gemini-2.5-flash-lite",
  };
  const cmd = buildPiLaunchCommand(profile);
  assert.ok(!cmd.includes("openrouter-soukr"), cmd);
  assert.ok(!cmd.includes("--provider"), cmd);
  assert.ok(cmd.includes("--model google/gemini-2.5-flash-lite"));
});

test("a catalog provider is passed through as --provider", () => {
  const profile: AgentProfile = { name: "x", provider: "openrouter", model: "foo/bar" };
  assert.ok(buildPiLaunchCommand(profile).includes("--provider openrouter"));
});

test("no shipped profile uses an extension-registered provider", () => {
  const cfg = getDefaultConfig();
  const safe = ["antigravity", "kimi-coding", "ollama", "opencode", "openrouter", "zenfree"];
  for (const [name, p] of Object.entries(cfg.profiles)) {
    if (!p.provider) continue;
    assert.ok(safe.includes(p.provider), `${name} uses non-CLI-safe provider ${p.provider}`);
  }
});

test("resolvePipeline resolves named chains and inline role lists", () => {
  const cfg = getDefaultConfig();
  assert.deepEqual(resolvePipeline("build", cfg), ["scout", "implementer", "reviewer"]);
  assert.deepEqual(resolvePipeline("BUILD", cfg), ["scout", "implementer", "reviewer"]);
  assert.deepEqual(resolvePipeline("scout,oracle", cfg), ["scout", "oracle"]);
  assert.equal(resolvePipeline("scout", cfg), undefined);
  assert.equal(resolvePipeline("nope", cfg), undefined);
});
