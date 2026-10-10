import { execFile } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import type { RouteVerdict } from "./types.ts";

export function findUmaBinary(cwd?: string): string {
  const isWindows = process.platform === "win32";
  const primary = isWindows ? "uma.exe" : "uma";

  if (process.env.UMA_BIN_PATH && fs.existsSync(process.env.UMA_BIN_PATH)) {
    return process.env.UMA_BIN_PATH;
  }

  const baseDir = import.meta.dirname || "";
  const candidates = [
    // Monorepo sibling pi-uma
    baseDir ? path.join(baseDir, "..", "..", "..", "pi-uma", "bin", primary) : "",
    "D:/01_programovani/pi/plugins/pi-uma/bin/" + primary,
    // AppData standard location
    path.join(process.env.APPDATA || "", "uma", "uma", "bin", primary),
    // Local to caller
    cwd ? path.join(cwd, "bin", primary) : "",
    primary,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return primary;
}

export function runUma(
  binPath: string,
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    execFile(binPath, args, { cwd }, (error, stdout, stderr) => {
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

export async function checkRoute(
  prompt: string,
  cwd: string,
  judge: "off" | "jev" = "off",
  maxContext = 3
): Promise<RouteVerdict> {
  const bin = findUmaBinary(cwd);
  const args = ["route", "check", prompt, "--judge", judge, "--max", String(maxContext), "--json"];

  const res = await runUma(bin, args, cwd);
  if (res.code !== 0) {
    throw new Error(`UMA route check failed (code ${res.code}): ${res.stderr || res.stdout}`);
  }

  try {
    return JSON.parse(res.stdout) as RouteVerdict;
  } catch (err) {
    throw new Error(`Failed to parse UMA route verdict: ${String(err)}\nOutput was: ${res.stdout}`);
  }
}
