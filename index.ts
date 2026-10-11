/**
 * @mastnacek/pi-orchestrator — Pi coding agent extension.
 *
 * Memory-native task orchestrator for the Herdr multiplexer.
 * Uses UMA's System-1 fastbrain router to delegate tasks with pre-warmed context.
 *
 * Composition root: wires slices and guards against subagent recursion.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createInitialState, refreshModelCatalog } from "./src/shared/state.ts";
import { registerCommands } from "./src/slices/commands/index.ts";
import { registerRouteTool } from "./src/slices/route/index.ts";
import { registerDelegateTool } from "./src/slices/delegate/index.ts";
import { registerStatusTool } from "./src/slices/status/index.ts";
import { registerCollectTool } from "./src/slices/collect/index.ts";
import { registerPipelineTool } from "./src/slices/pipeline/tool.ts";

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
	const track = (result: unknown): void => {
		if (typeof result === "function") unsubscribers.push(result as () => void);
	};

	// Wire slices
	registerCommands(pi, state);
	registerRouteTool(pi, state);
	registerDelegateTool(pi, state);
	registerStatusTool(pi, state);
	registerCollectTool(pi, state);
	registerPipelineTool(pi, state);

	// Snapshot Pi's live model catalog so the profile menu can offer the same
	// models the /model picker shows. Completion callbacks receive no context,
	// so the snapshot has to happen here, where a context exists.
	track(
		pi.on("session_start", (_event, ctx) => {
			refreshModelCatalog(state, ctx.modelRegistry as never);
		}),
	);

	// Drain all listeners on session shutdown
	track(
		pi.on("session_shutdown", async () => {
			while (unsubscribers.length > 0) {
				unsubscribers.pop()?.();
			}
		}),
	);
}
