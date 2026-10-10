import { execFile } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
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

export async function splitPane(options?: {
  paneId?: string;
  cwd?: string;
  direction?: "right" | "down";
  ratio?: number;
  focus?: boolean;
}): Promise<string> {
  const args = ["pane", "split"];
  if (options?.paneId) {
    args.push(options.paneId);
  } else {
    args.push("--current");
  }
  args.push("--direction", options?.direction || "right");
  if (options?.cwd) {
    args.push("--cwd", options.cwd);
  }
  if (options?.ratio) {
    args.push("--ratio", String(options.ratio));
  }
  if (options?.focus === false) {
    args.push("--no-focus");
  }

  const res = await runHerdr(args);
  if (res.code !== 0) {
    throw new Error(`herdr pane split failed (code ${res.code}): ${res.stderr || res.stdout}`);
  }
  try {
    const data = JSON.parse(res.stdout);
    return data.result?.pane?.pane_id || data.result?.pane_id || res.stdout.trim();
  } catch {
    return res.stdout.trim();
  }
}

export async function runInPane(paneId: string, command: string): Promise<string> {
  const res = await runHerdr(["pane", "run", paneId, command]);
  if (res.code !== 0) {
    throw new Error(`herdr pane run failed (code ${res.code}): ${res.stderr || res.stdout}`);
  }
  return res.stdout.trim();
}

export async function waitForAgentReady(
  paneId: string,
  maxWaitMs = 15000,
  pollIntervalMs = 500
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const agents = await listAgents();
      const match = agents.find(
        (a) => a.pane_id.toLowerCase() === paneId.toLowerCase()
      );
      if (match && (match.agent_status === "idle" || match.agent_status === "working")) {
        return true;
      }
    } catch {
      // ignore transient polling errors
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  return false;
}

export function resolveProjectDirectory(
  specialist: string,
  cwd: string = process.cwd()
): string | undefined {
  const candidates = [
    path.join(cwd, specialist),
    path.join(cwd, "..", specialist),
    path.join("D:/01_programovani/pi/plugins", specialist),
    path.join("D:/01_programovani", specialist),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
      return path.resolve(c);
    }
  }
  return undefined;
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
): Promise<{ paneId: string; hasAgent: boolean; agentKind?: string; agentStatus?: string }> {
  const t = target.toLowerCase();
  const [agents, panes] = await Promise.all([
    listAgents(cwd).catch(() => []),
    listPanes(cwd).catch(() => []),
  ]);

  // 1. Direct match on live agents (by pane_id, agent name, or project cwd)
  for (const a of agents) {
    if (a.pane_id.toLowerCase() === t || a.agent.toLowerCase() === t) {
      return { paneId: a.pane_id, hasAgent: true, agentKind: a.agent, agentStatus: a.agent_status };
    }
    if (a.cwd && a.cwd.toLowerCase().endsWith(t)) {
      return { paneId: a.pane_id, hasAgent: true, agentKind: a.agent, agentStatus: a.agent_status };
    }
  }

  // 2. Direct match on panes (by pane_id, agent occupant, or cwd)
  for (const p of panes) {
    if (p.pane_id.toLowerCase() === t) {
      return { paneId: p.pane_id, hasAgent: Boolean(p.agent), agentKind: p.agent, agentStatus: p.agent_status };
    }
    if (p.agent && p.agent.toLowerCase() === t) {
      return { paneId: p.pane_id, hasAgent: true, agentKind: p.agent, agentStatus: p.agent_status };
    }
    if (p.cwd && p.cwd.toLowerCase().endsWith(t)) {
      return { paneId: p.pane_id, hasAgent: Boolean(p.agent), agentKind: p.agent, agentStatus: p.agent_status };
    }
  }

  return { paneId: target, hasAgent: false };
}

export async function sendKeys(target: string, ...keys: string[]): Promise<void> {
  const args = ["agent", "send-keys", target, ...keys];
  const res = await runHerdr(args);
  if (res.code !== 0) {
    await runHerdr(["pane", "send-keys", target, ...keys]);
  }
}

export async function promptAgent(
  target: string,
  promptText: string,
  options?: { wait?: boolean; timeoutMs?: number; autoConfirm?: boolean }
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

  // Auto-confirm: send Enter key so the agent submits immediately without waiting
  if (options?.autoConfirm !== false) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await sendKeys(target, "enter").catch(() => {});
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
