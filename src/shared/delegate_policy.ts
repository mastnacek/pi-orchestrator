/**
 * Pure delegation policies (SPAI-038 / SPAI-039 / SPAI-040).
 *
 * No pi or herdr imports: testable with `node --test`. The three bugs these fix
 * were all reported from real runs and all share one shape — a *structural* rule
 * encoded as an accident of string equality or of argument order.
 */

/**
 * An explicit pane id looks like `w1Z:pK`. A bare specialist or project name
 * never matches — that distinction is what lets an unknown name split a pane
 * while an existing empty pane is prompted directly (SPAI-039).
 */
export function looksLikePaneId(target: string): boolean {
  return /^w[a-z0-9]+:[a-z0-9]+$/i.test(target.trim());
}

/**
 * Create a pane unless the target is a live agent or an explicit pane id.
 *
 * The old guard compared the raw target with the resolved pane id, which are the
 * same string whenever resolution failed — so an unknown specialist was never
 * split and `herdr agent prompt implementer` died with "agent_not_found".
 */
export function shouldSplitPane(hasAgent: boolean, target: string): boolean {
  return !hasAgent && !looksLikePaneId(target);
}

/**
 * The herdr CLI rejects `--timeout` unless `--wait` is present, so the two are
 * emitted together or not at all (SPAI-038). A timeout without waiting is
 * meaningless anyway: there would be nothing to time out.
 */
export function buildAgentPromptArgs(
  target: string,
  promptText: string,
  options?: { wait?: boolean; timeoutMs?: number },
): string[] {
  const args = ["agent", "prompt", target, promptText];
  if (options?.wait) {
    args.push("--wait");
    if (options?.timeoutMs !== undefined && options.timeoutMs > 0) {
      args.push("--timeout", String(options.timeoutMs));
    }
  }
  return args;
}

/**
 * herdr's stall detector fires a false negative when the prompt was pasted but
 * the CLI never observed the agent leave `idle` within ~5s (SPAI-040). It is
 * only safe to treat as a false negative when the agent is demonstrably busy —
 * a genuinely stalled prompt against an idle agent must still surface as an error.
 */
export function isStallFalseNegative(output: string, status: string | undefined): boolean {
  if (!output.includes("agent_prompt_stalled")) return false;
  return status === "working" || status === "blocked";
}
