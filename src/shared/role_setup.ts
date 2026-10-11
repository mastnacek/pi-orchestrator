/**
 * Runtime role setup.
 *
 * A role's model and thinking level are applied *after* the pane's Pi session
 * has started, via the `/model` and `/thinking` commands, rather than through
 * `--model` on the command line. Two verified reasons:
 *
 * 1. `--model` is resolved against the built-in catalog at argument-parse time.
 *    It cannot name a model served by an extension-registered account provider
 *    (e.g. `openrouter-soukr`), and — worse — passing it re-routes the request
 *    to the built-in `openrouter` credentials, silently billing a different
 *    account than the one the operator configured.
 * 2. `/model` runs inside a live session, where those providers ARE registered,
 *    so every model the `/model` picker shows is selectable.
 *
 * The CLI therefore carries only the structural flags (tool allowlist, soul,
 * context isolation) and never a model.
 */

import type { AgentProfile } from "./config.ts";
import { promptAgent } from "./herdr_client.ts";

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * The slash commands that pin a role's model and thinking level.
 *
 * `provider/model` is the documented `/model` argument form. A model id already
 * carries its author (`anthropic/claude-sonnet-4.6`), so the provider prefix
 * makes the full path explicit and lets the session pick the right account.
 */
export function buildRuntimeSetupCommands(
  profile: AgentProfile | undefined
): string[] {
  if (!profile) return [];
  const commands: string[] = [];
  if (profile.model) {
    const qualified = profile.provider
      ? `${profile.provider}/${profile.model}`
      : profile.model;
    commands.push(`/model ${qualified}`);
  }
  if (profile.thinking) {
    commands.push(`/thinking ${profile.thinking}`);
  }
  return commands;
}

/**
 * Applies the role's model and thinking level to a live pane.
 *
 * Each command is submitted separately and given time to settle: `/model`
 * mutates session state, and a task prompt racing it would run on the wrong
 * model. Failures are swallowed — an unsupported model must not prevent the
 * pane from receiving its task on the session default.
 */
export async function applyRuntimeSetup(
  paneId: string,
  profile: AgentProfile | undefined,
  settleMs = 800
): Promise<string[]> {
  const applied: string[] = [];
  for (const command of buildRuntimeSetupCommands(profile)) {
    try {
      await promptAgent(paneId, command);
      applied.push(command);
      await sleep(settleMs);
    } catch {
      // Leave the pane on the session default rather than failing the launch.
    }
  }
  return applied;
}