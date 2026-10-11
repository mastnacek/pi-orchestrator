# Multi-Agent Orchestration & Ecosystem Study

A comprehensive survey of multi-agent architectures across **Pi**, **Claude Code**, **Herdr**, **OpenCode**, **Hermes**, and **OhMyPi**, prepared for `@mastnacek/pi-orchestrator` and `pi-uma`.

Target repository collection location: `D:\01_programovani\pi\plugins\pi-orchestrator\docs\zdroje\`

---

## 1. Executive Summary & Core Comparison

| Framework | Orchestration Pattern | Multi-Process / Multiplexer | Shared Memory / Context | Isolation Model |
|---|---|---|---|---|
| **Pi Herdsman** (`boadij/pi-herdsman`) | Manager → Lead → Worker Fleet | Native **Herdr** integration (panes, workspaces) | Pi sessions + owned usage tracking | Git worktrees + Herdr panes |
| **Herdr Projects** (`eliasstravik/herdr-projects`) | Coordinator conversation | Native **Herdr** plugin (Rust) | Shared memory + `## Remember` feedback | Git worktrees per task |
| **oh-my-opencode-slim** (`alvinunreal/oh-my-opencode-slim`) | Seven specialized divine agents | Pluggable multiplexer (**Herdr**, tmux, zellij, cmux) | Shared admission runtime + memory | Sub-agent processes in split panes |
| **Overstory** (`jayminwest/overstory`) | Worktree task swarm | Headless CLI runtimes + tmux attach | SQLite mail system (`.overstory/`) | Pluggable adapters (Pi, Claude, Codex) |
| **Hermes Agent** (`NousResearch/hermes-agent`) | Curator & delegate tools | Single agent with subagent worker threads | Unified `MemoryProvider` + `MemoryManager` | Subagent bounds & iteration caps |
| **OhMyPi** (`ajjucoder/ohmypi`) | Multi-model specialist processes | Process spawning without touching Pi core | Registry-driven roles (scout, reviewer, frontend) | Model specialization per role |
| **pi-subagents** (`nicobailon/pi-subagents` & `tintinweb`) | Scripted workflows & council | In-process child sessions / Pi CLI subprocesses | Artifact routing + session trees | Forked context + managed worktrees |

---

## 2. Deep Dive: Pi Agent Ecosystem

### A. `boadij/pi-herdsman` (Pi + Herdr Native Bridge)
- **Architecture:** Directly connects Pi sessions with Herdr workspaces and panes.
- **Key Concepts:**
  - **Manager:** Coordinates durable branch-based work across Leads and their Agent trees.
  - **Lead:** Owns a conversation and delegates bounded subtasks to workers.
  - **Supervision & Mailbox:** `extension/mailbox.ts` and `supervision.ts` handle asynchronous message exchange between parent and child terminals.
  - **Herdr Client:** `extension/herdr.ts` manages split directions, pane IDs, and monitors terminal lifecycle (`idle`, `working`, `blocked`).

### B. `nicobailon/pi-subagents` & `@tintinweb/pi-subagents`
- **Architecture:** Canonical subagent execution inside the `@earendil-works` Pi runtime.
- **Key Concepts:**
  - **Scripted Workflows:** Defines single-agent delegation and scripted multi-agent workflows (parallel reviews, council mode, code quality auditors).
  - **Safety Invariant:** `PI_SUBAGENT=true` recursion guard to prevent subagents from recursively loading child extensions.
  - **Managed Worktrees:** Isolate each workflow child in a managed git worktree with automatic artifact routing.

### C. `ajjucoder/ohmypi` (Specialist Processes)
- **Architecture:** Keeps stock Pi untouched; routes tasks to dedicated specialist processes based on role:
  - **Main Orchestrator:** High-level planning and synthesis.
  - **Frontend Specialist:** Dedicated process with `gpt-taste` and `frontend-design` skills.
  - **Scout:** Low-thinking cheap model discovering file context.
  - **Reviewer:** Audits code before completion.

---

## 3. Deep Dive: Claude Code Ecosystem

### A. Subagent Catalogs (`VoltAgent/awesome-claude-code-subagents` & `0xfurai`)
- **Structure:** Over 100 specialized subagents for development lifecycle.
- **Pattern:**
  - Each subagent is an independent markdown configuration defining:
    - Dedicated role prompt & persona
    - Constrained tool whitelist (`read`, `bash`, `edit`, `git`)
    - Output schemas and quality acceptance criteria.
  - Categories: Security auditors, PR reviewers, refactoring specialists, test generators, database migrators.

### B. `aaddrick/claude-pipeline`
- **Pattern:** Connects Claude Code subagents into a directed pipeline with explicit quality gates:
  - Plan → Spec → Implement → Test → Security Review.
  - Inter-agent handoff via structured markdown documents.

---

## 4. Deep Dive: OpenCode & Hermes Agent

### A. `oh-my-opencode-slim` (`alvinunreal/oh-my-opencode-slim`)
- **Multiplexer Engine (`src/multiplexer/`):**
  - Ships first-class adapters for **Herdr**, tmux, zellij, and cmux.
  - `src/multiplexer/herdr/index.ts` uses `HERDR_PANE_ID` environment variable as the anchor.
  - Supports side-by-side (`right`) and stacked (`down`) splits.
- **Team Model:**
  - Built-in divine roles: Scribe (docs), Scout (search), Architect (reviews), Coder, UI Specialist.
  - Orchestrator plans the DAG (directed acyclic graph), dispatches specialists as background tasks, and reconciles results before proceeding.

### B. `NousResearch/hermes-agent`
- **Memory & Subagent Separation:**
  - `agent/memory_manager.py` acts as the orchestrator; subagents run with `agent_context = "subagent"`.
  - Subagents are prevented from performing uncontrolled memory writes (writes are staged or routed through the curator).
  - Iteration limits (`max_iterations = 500`) shared across parent and subagent executions.

---

## 5. Herdr Multiplexer Ecosystem (`https://herdr.dev/plugins/`)

Top Herdr plugins relevant to multi-agent orchestration:

1. **`eliasstravik/herdr-projects` (599 stars):**  
   Coordinator agent runs on one branch, dispatches worker agents in git worktrees, and aggregates feedback through `## Remember` into shared memory.
2. **`boadij/pi-herdsman` (166 stars):**  
   Asynchronous Pi agent fleet orchestration in Herdr panes.
3. **`madarco/agentbox` (526 stars):**  
   Run multiple agents in parallel sandboxed VMs or containers with single command.
4. **`persiyanov/herdr-reviewr` (866 stars):**  
   Interactive code review in a split pane; sends feedback comments directly to agent panes.
5. **`plannotator/herdr-annotate` (653 stars):**  
   Annotate terminal output and send human feedback straight into agent stdin.
6. **`alexarthurs/herdr-sidebar` (457 stars):**  
   File tree + git source control in a dedicated side pane.
7. **`furkankly/zoetrope` (1,024 stars):**  
   Live execution flow graph visualizing agent decisions in browser/terminal.
8. **`zenbu-labs/terminal-browser` (3,797 stars):**  
   Terminal-embedded headless browser for frontend verification.
9. **`AltanS/collie` (1,287 stars):**  
   Remote mobile PWA console for driving Pi, Claude Code, and Herdr panes from phone.
10. **`devswha/herdr-web-ui` (779 stars):**  
    Web interface and push notifications for Herdr agent panes.

---

## 6. Top 10 Relevant Packages from `https://pi.dev/packages`

1. **`pi-subagents` (`@earendil-works` / `nicopreme` — 622k/mo):**  
   Official scripted workflow and single-agent delegation engine.
2. **`billion-context` (`ranxianglei` — 936k/mo):**  
   Context compression engine enabling month-long sessions across coding agents.
3. **`pi-web-access` (`nicopreme` — 693k/mo):**  
   Web research, PDF extraction, repo cloning, and video analysis.
4. **`pi-mcp-adapter` (`nicopreme` — 1.6M/mo):**  
   Token-efficient MCP client integration for Pi.
5. **`pi-lens` (`apmantza` — 108k/mo):**  
   Real-time code feedback: LSP, linters, structural ast-grep analysis.
6. **`pi-goal-x` / `@schovest/pi-goal` (`tmonk` / `schovest` — 141k/mo):**  
   Autonomous goal planning and independent completion auditing.
7. **`context-mode` (`mksglu` — 103k/mo):**  
   FTS5 knowledge base and intent-driven search saving 98% of context window.
8. **`agent-comms` (`jmearman` — 49k/mo):**  
   Cross-harness TCP mesh for LLM agents (rooms, DMs, presence, push alerts).
9. **`pi-memory` (`jayzeng` — 47k/mo):**  
   Semantic search over daily logs, long-term memory, and scratchpads.
10. **`pi-cache-optimizer` (`freescheme` — 31k/mo):**  
    KV-cache hit rate optimizer with stable prompt prefix caching.

---

## 7. Key Lessons & Recommendations for `pi-orchestrator` & `pi-uma`

1. **Multiplexer Panes Over Headless Subagents (Proven by `herdr-projects` & `herdsman`):**  
   Watching coding agents in visible side-by-side panes provides immediate operator confidence and instant human-in-the-loop takeover. Headless subagents suffer from compounding error rates and lack transparency.
2. **Pre-Warmed Memory Context Handoff (The UMA Advantage):**  
   Unlike generic orchestrators that force the worker to read the whole repo from scratch, `pi-orchestrator`'s context slice injects top architectural decisions from `pi-uma` immediately.
3. **Model Tiering Strategy (Proven by `oh-my-opencode-slim` & `ohmypi`):**  
   - Orchestrator = fast, cheap/free 1M model (`nvidia/nemotron-3-ultra:free` or `gemini-2.5-flash-lite`).
   - Workers/Specialists = frontier coding models (`claude-3-7-sonnet`, `qwen-2.5-coder`).
4. **Memory Write Isolation (Learned from Hermes & UMA):**  
   Workers must not write unapproved memory directly. All learnings report back via `## Remember` or staging drafts for human review.
