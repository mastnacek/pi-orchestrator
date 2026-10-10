/**
 * @mastnacek/pi-orchestrator — Pi coding agent extension.
 *
 * Memory-native task orchestrator for the Herdr multiplexer.
 * Uses UMA's System-1 fastbrain router to delegate tasks with pre-warmed context.
 *
 * Composition root: wires slices and guards against subagent recursion.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createInitialState } from "./src/shared/state.ts";
import { registerCommands } from "./src/slices/commands/index.ts";
import { registerRouteTool } from "./src/slices/route/index.ts";
import { registerDelegateTool } from "./src/slices/delegate/index.ts";
import { registerStatusTool } from "./src/slices/status/index.ts";
import { registerCollectTool } from "./src/slices/collect/index.ts";

/** Subagent recursion guard: avoid duplicating hooks in child sessions. */
function isDelegatedSession(): boolean {
	return process.env.PI_SUBAGENT === "true" || Boolean(process.env.PI_CHILD_SESSION);
}

export default function (pi: ExtensionAPI): void {
	if (isDelegatedSession()) {
		return;
	}

	const state = createInitialState();
	const unsubscribers: Array<() => void> = [];

	// Wire slices
	registerCommands(pi, state);
	registerRouteTool(pi, state);
	registerDelegateTool(pi, state);
	registerStatusTool(pi, state);
	registerCollectTool(pi, state);

	// Drain all listeners on session shutdown
	pi.on("session_shutdown", async () => {
		while (unsubscribers.length > 0) {
			unsubscribers.pop()?.();
		}
	});
}
