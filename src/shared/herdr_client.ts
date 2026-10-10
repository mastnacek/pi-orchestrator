import { execFile } from "node:child_process";
import type { HerdrAgent, HerdrPane, HerdrTab } from "./types.ts";

export function findHerdrBinary(): string {
  if (process.env.HERDR_BIN_PATH) {
    return process.env.HERDR_BIN_PATH;
  }
  return process.platform === "win32" ? "herdr.exe" : "herdr";
}

export function isHerdrActive(): boolean {
  return process.env.HERDR_ENV === "1";
}

export function currentPaneId(): string | undefined {
  return process.env.HERDR_PANE_ID;
}

export function runHerdr(
  args: string[],
  cwd: string = process.cwd()
): Promise<{ stdout: string; stderr: string; code: number }> {
  const bin = findHerdrBinary();
  return new Promise((resolve, reject) => {
    execFile(bin, args, { cwd }, (error, stdout, stderr) => {
      if (error && "code" in error && typeof error.code === "number" && error.code !== 0) {
        resolve({ stdout, stderr, code: error.code });
      } else if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr, code: 0 });
      }
    });
  });
}

export async function listAgents(cwd?: string): Promise<HerdrAgent[]> {
  const res = await runHerdr(["agent", "list"], cwd);
  if (res.code !== 0) {
    throw new Error(`herdr agent list failed (code ${res.code}): ${res.stderr || res.stdout}`);
  }
  try {
    const data = JSON.parse(res.stdout);
    return data.result?.agents || [];
  } catch (err) {
    throw new Error(`Failed to parse herdr agent list JSON: ${String(err)}`);
  }
}

export async function listPanes(cwd?: string): Promise<HerdrPane[]> {
  const res = await runHerdr(["pane", "list"], cwd);
  if (res.code !== 0) {
    throw new Error(`herdr pane list failed (code ${res.code}): ${res.stderr || res.stdout}`);
  }
  try {
    const data = JSON.parse(res.stdout);
    return data.result?.panes || [];
  } catch (err) {
    throw new Error(`Failed to parse herdr pane list JSON: ${String(err)}`);
  }
}

export async function listTabs(cwd?: string): Promise<HerdrTab[]> {
  const res = await runHerdr(["tab", "list"], cwd);
  if (res.code !== 0) {
    throw new Error(`herdr tab list failed (code ${res.code}): ${res.stderr || res.stdout}`);
  }
  try {
    const data = JSON.parse(res.stdout);
    return data.result?.tabs || [];
  } catch (err) {
    throw new Error(`Failed to parse herdr tab list JSON: ${String(err)}`);
  }
}

export async function createTab(options: {
  cwd?: string;
  label?: string;
}): Promise<string> {
  const args = ["tab", "create", "--no-focus"];
  if (options.cwd) {
    args.push("--cwd", options.cwd);
  }
  if (options.label) {
    args.push("--label", options.label);
  }

  const res = await runHerdr(args);
  if (res.code !== 0) {
    throw new Error(`herdr tab create failed (code ${res.code}): ${res.stderr || res.stdout}`);
  }
  return res.stdout.trim();
}

export async function resolveTarget(
  target: string,
  cwd?: string
): Promise<{ paneId: string; hasAgent: boolean; agentKind?: string }> {
  const t = target.toLowerCase();
  const [agents, panes] = await Promise.all([
    listAgents(cwd).catch(() => []),
    listPanes(cwd).catch(() => []),
  ]);

  // 1. Direct match on live agents (by pane_id, agent name, or project cwd)
  for (const a of agents) {
    if (a.pane_id.toLowerCase() === t || a.agent.toLowerCase() === t) {
      return { paneId: a.pane_id, hasAgent: true, agentKind: a.agent };
    }
    if (a.cwd && a.cwd.toLowerCase().endsWith(t)) {
      return { paneId: a.pane_id, hasAgent: true, agentKind: a.agent };
    }
  }

  // 2. Direct match on panes (by pane_id, agent occupant, or cwd)
  for (const p of panes) {
    if (p.pane_id.toLowerCase() === t) {
      return { paneId: p.pane_id, hasAgent: Boolean(p.agent), agentKind: p.agent };
    }
    if (p.agent && p.agent.toLowerCase() === t) {
      return { paneId: p.pane_id, hasAgent: true, agentKind: p.agent };
    }
    if (p.cwd && p.cwd.toLowerCase().endsWith(t)) {
      return { paneId: p.pane_id, hasAgent: Boolean(p.agent), agentKind: p.agent };
    }
  }

  return { paneId: target, hasAgent: false };
}

export async function promptAgent(
  target: string,
  promptText: string,
  options?: { wait?: boolean; timeoutMs?: number }
): Promise<string> {
  // Recursion guard: never prompt self!
  const myPane = currentPaneId();
  if (myPane && target.toLowerCase() === myPane.toLowerCase()) {
    throw new Error(
      `Recursion prevented: Orchestrator cannot delegate to its own pane (${myPane})!`
    );
  }

  const args = ["agent", "prompt", target, promptText];
  if (options?.wait) {
    args.push("--wait");
  }
  if (options?.timeoutMs) {
    args.push("--timeout", String(options.timeoutMs));
  }

  const res = await runHerdr(args);
  if (res.code !== 0) {
    throw new Error(
      `herdr agent prompt to ${target} failed (code ${res.code}): ${res.stderr || res.stdout}`
    );
  }
  return res.stdout.trim();
}

export async function readAgent(
  target: string,
  lines = 50
): Promise<string> {
  const args = ["agent", "read", target, "--lines", String(lines), "--format", "text"];
  const res = await runHerdr(args);
  if (res.code !== 0) {
    throw new Error(`herdr agent read from ${target} failed: ${res.stderr || res.stdout}`);
  }
  return res.stdout.trim();
}
