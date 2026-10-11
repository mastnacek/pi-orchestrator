---
name: orchestrator
description: Expert guide for task orchestration across Herdr multiplexer panes using UMA fastbrain routing, soul-bound agent roles, role pipelines, and context-slice handoffs. Triggers on mentions of "orchestrator", "orch", "pipeline", "delegate task", "herdr panes", or multi-agent multiplexer workflows.
---

# Herdr Memory Orchestrator (`@mastnacek/pi-orchestrator`)

The **Memory Orchestrator** organizes coding tasks across persistent terminals in the [Herdr](https://herdr.dev) multiplexer. Instead of spawning opaque, unobservable subagents, it routes tasks to visible side-by-side panes running full Pi instances, pre-warmed with [UMA](https://github.com/mastnacek/pi-uma) project memory facts.

---

## 1. Core Workflow: Route → Delegate → Supervise

```text
User Request
     │
     ▼
┌──────────────────────────────┐
│ 1. /orch route <prompt>      │  System-1 Fastbrain evaluates candidate
│    (or /orch auto <prompt>)  │  specialists, confidence, and memory slice.
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ 2. Confirmation Modal        │  Displays target pane, label, agent status,
│    (Send / Split / Cancel)   │  and pre-warmed facts before executing.
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ 3. Pane Delegation           │  Submits prompt prepended with context slice
│    (herdr agent prompt)      │  and automatically triggers Enter.
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ 4. Observability & Collect   │  Watch the agent work in real-time side pane;
│    (herdr agent read)        │  harvest results with the orch_collect tool.
└──────────────────────────────┘
```

---

## 2. Soul-bound Agent Roles

A role is **not** just prose in a prompt. Every role has two enforcement layers:

| Layer | Location | Enforces |
|---|---|---|
| **Soul (identity)** | `souls/<role>.md` | Mission, prohibitions, output contract |
| **Structural (flags)** | `AgentProfile` | `--tools` allowlist, `--thinking`, `--no-skills`, `--no-extensions` |

A `scout` launched with `--tools read,ls,find,grep` **physically cannot** call `edit` or `write`, even if the model asks for it. Prose declares intent; flags make it impossible to violate.

| Layer | Role | Model (applied at runtime) | Thinking | Tools |
|---|---|---|---|---|
| Control | `orchestrator` | `nvidia/nemotron-3-ultra-550b-a55b:free` (via `openrouter-soukr`) | medium | full **minus** `edit,write` |
| Recon | `scout` | `google/gemini-2.5-flash-lite` | off | `read,ls,find,grep` |
| Recon | `librarian` | `google/gemini-2.5-flash` | low | `read,ls,find,grep,bash` |
| Execution | `implementer` | `anthropic/claude-sonnet-4.6` | high | full |
| Execution | `fixer` | `google/gemini-2.5-flash` | low | full |
| Execution | `frontend` | `anthropic/claude-sonnet-4.6` | high | full |
| Execution | `lotus` | `anthropic/claude-sonnet-4.6` | high | full + MCP |
| Control | `reviewer` | `anthropic/claude-sonnet-4.6` | high | `read,ls,find,grep` |
| Control | `oracle` | `anthropic/claude-sonnet-4.6` | high | `read,ls,find,grep` |
| Memory | `curator` | `google/gemini-2.5-flash-lite` | off | `uma_*`, staging |

Project/model profiles without a soul: `pi-uma`, `mozek_rust`, `fast`, `frontier`.

### Which role controls UMA and delegates?

`orchestrator` — and only it. Note two traps:

- **`pi-uma` is NOT the UMA controller.** It is a *repo specialist* for working
  **in** the `pi-uma` codebase, the same way `mozek_rust` is for its repo.
- **`curator` minds UMA, but does not dispatch.** Its soul binds it to memory
  hygiene (staging, consolidation), not to routing work.

The orchestrator is the only role that holds the delegation tools *and* is
denied the coding tools (`--exclude-tools edit,write`). That denial is the
structural statement of "coordinate, never implement": when it feels the urge
to edit a file, the correct move is to delegate.

It runs the free `nvidia/nemotron-3-ultra-550b-a55b:free` (1M context, $0/M)
through the operator's own account alias. The alias may appear on a **profile**
but never on the **command line**: the CLI drops non-catalog providers, and the
alias qualifies only the runtime `/model` command. That routing matters — the
built-in `openrouter` credential rejects free models with a 404, while the
alias permits them.

Read-only roles (`scout`, `oracle`, `reviewer`) run with `--no-extensions`, so
they **cannot** delegate at all — a recon agent that could spawn more agents
would defeat its own cost and scope discipline.

---

## 3. Role Pipelines (chained execution)

Roles chain sequentially. Each stage runs in its own pane with its soul and tool boundary, and receives the **previous stage's report as an explicit handoff**.

| Pipeline | Chain | Use |
|---|---|---|
| `build` | `scout → implementer → reviewer` | Full cycle: map → implement → audit |
| `design` | `scout → oracle` | Reconnaissance plus architecture critique *before* code |
| `research` | `librarian → implementer` | Docs first, then code |
| `repair` | `fixer → reviewer` | Fix plus independent audit |

```bash
/orch pipeline build "oprav WAL locking v pi-uma"
/orch pipeline design "přepiš store na async SQLite"
/orch pipeline scout,oracle,implementer "vlastní řetěz"
```

**Why sequential:** a reviewer cannot audit work that does not exist yet, and an implementer must not start before reconnaissance returns facts.

**Stop conditions:** the chain halts **loudly** (and reports `failedStage`) when a stage times out (10 min budget) or settles as `blocked` — the agent is waiting on the operator. Briefing the next role on a partial report is worse than stopping. A stage is only harvested after the agent has been *observed working*, so fast stages are not collected mid-flight.

---

## 4. Interactive Slash Commands (`/orch`)

| Command | Description & Practical Example |
|---|---|
| `/orch auto <prompt>` | **Full tiered routing:** Evaluates prompt, shows confirmation modal with pane name & status, and submits task.<br>`/orch auto "oprav WAL locking v pi-uma storu"` |
| `/orch pipeline <name\|roles> <task>` | **Chain roles:** each stage in its own pane, report handed forward.<br>`/orch pipeline build "oprav WAL v pi-uma"` |
| `/orch route <prompt>` | **Dry-run route preview:** winner specialist, confidence score, and context slice facts without delegating. |
| `/orch split [specialist]` | **Split workspace:** opens a side-by-side pane and launches Pi with the role's soul and flags.<br>`/orch split scout` |
| `/orch delegate <target> <prompt>` | **Manual delegation:** send a prompt directly to a pane ID or agent.<br>`/orch delegate w1Y:p2Q "analyzuj kód paměti"` |
| `/orch rename <label>` | **Label a pane:** rename the active pane for clear multiplexer orientation. |
| `/orch status` | **Multiplexer overview:** all panes, labels, agents and lifecycle states, plus example actions. |
| `/orch profile` | **Profile manager:** interactive selector or CLI manager.<br>`/orch profile list`<br>`/orch profile select scout`<br>`/orch profile set reviewer anthropic/claude-sonnet-4.6` |
| `/orch auto-confirm on\|off` | Toggle automatic Enter dispatch after prompt paste. |
| `/orch direction right\|down` | Pane split direction. |
| `/orch lang cs\|en` | Interface language. |
| `/orch help` | Full in-product guide. |

---

## 5. Custom Tools

| Tool | Parameters | Description |
|---|---|---|
| `orch_route` | `prompt`, `judge?`, `maxContext?` | UMA fastbrain routing verdict with context slice. |
| `orch_pipeline` | `pipeline`, `task` | Run a chained role pipeline with handoff between panes. |
| `orch_delegate` | `target`, `prompt`, `includeContext?`, `wait?`, `timeoutMs?` | Delegate a prompt to a Herdr pane with pre-warmed memory. |
| `orch_status` | *(none)* | Live panes, tabs and agent lifecycle states. |
| `orch_collect` | `target`, `lines?` | Read a delegated agent's terminal output. |

---

## 6. Model Selection from Pi's Catalog

Models are **never hand-typed**. `/orch profile set <role> ` completes from Pi's **live model catalog** — the same models the `/model` picker shows, with `[provider]` badges. The catalog is snapshotted at `session_start` (completion callbacks receive no context).

```bash
/orch profile set scout            # → picker lists available models
/orch profile set reviewer anthropic/claude-sonnet-4.6
```

---

## 7. Provider & Account Limitation (important)

Multi-account OpenRouter aliases (e.g. `openrouter-soukr`) are registered by the `pi-openrouter-accounts` plugin **at `session_start`** — long after Pi validated its command-line flags. This was verified experimentally:

| Form | Result |
|---|---|
| `--provider openrouter-soukr` | ❌ `Unknown provider` |
| `--model openrouter-soukr/<id>` | ❌ `Model not found` |
| `OPENROUTER_API_KEY=<soukr>` + `--model <id>` | ❌ auth.json key won, 404 |
| `--model <id>` (no provider) | ⚠️ resolves through the **built-in** `openrouter` account |
| *no* `--model` at all | ✅ uses `settings.json` `defaultProvider`/`defaultModel` (i.e. the alias) |

**Consequence:** the account alias is **not addressable from the command line by any means**. Passing `--model` switches resolution to the built-in `openrouter` account.

**`--no-extensions` does NOT change account routing.** Verified: the same 404 occurs with and without extensions. It removes the account plugin, but `--model` resolution never consulted that plugin anyway. Keep `--no-extensions` on read-only roles — it prevents nested delegation, and costs nothing in account terms.

### Two distinct accounts (verified via `/api/v1/key`)

| `auth.json` entry | Key hash | Spend | Free models |
|---|---|---|---|
| `openrouter` + `openrouter-default` | `54c4d305e9` | $54.47 | ❌ 404 (`free-model-training`) |
| `openrouter-soukr` | `5df4e96577` | $0.00087 | ✅ 200 OK |

> **Correction of an earlier claim:** the free model is *not* blocked on the `soukr` account — it is blocked on the **built-in** account. `soukr` permits free models. Any free-model failure therefore proves the request went to the built-in account, not to `soukr`.

### What this means for roles

Roles therefore **never pass a model on the command line**. The CLI carries only structural flags (tool allowlist, soul, context isolation), none of which affect account resolution. Model and thinking level are applied **at runtime**, in the live session where alias providers are already registered:

```
CLI:  pi --tools read,ls,find,grep --no-skills --no-extensions \
         --append-system-prompt "…/souls/scout.md"
RT :  /model google/gemini-2.5-flash-lite
      /thinking off
```

This satisfies "any model registered in Pi": everything the `/model` picker shows is selectable, alias-served models included:

```
/model openrouter-soukr/nvidia/nemotron-3-ultra-550b-a55b:free
```

Omitting `--model` is also what keeps a pane on the account configured in `settings.json` (`defaultProvider`). Passing `--model` resolves through the built-in catalog and re-routes billing to the built-in account.

Valid `provider` values are only those present in the catalog at argument-parse time: `antigravity`, `kimi-coding`, `ollama`, `opencode`, `openrouter`, `zenfree`.

---

## 8. Invariants & Safety

1. **Self-Recursion Guard:** structurally checks `HERDR_PANE_ID` and forbids delegating to the orchestrator's own pane.
2. **Subagent Recursion Guard:** suppresses extension execution when `PI_SUBAGENT` or `PI_CHILD_SESSION` is set.
3. **Read-only roles are enforced by flags**, not by prose — a scout cannot write.
4. **Automated Enter Dispatch:** prompts pasted into a target pane are followed by an `Enter` keypress after a 150 ms buffer flush.
5. **Pane placement:** a role pane is created by splitting **the orchestrator's own pane** (`HERDR_PANE_ID`), so it always appears as a pane in the orchestrator's current tab — never in whatever tab happened to be focused, and never as a tab of its own. `--current` is used only as a fallback when the caller is not inside a Herdr pane.
6. **Human-in-the-Loop Confirmation:** `/orch auto` always shows an interactive modal before delegating.
7. **UMA write discipline:** memory mutations go exclusively through `uma_write` / `uma_supersede` so the operator can approve them in the modal. Direct file writes to `.uma/` and `bash` invocations of `uma write` are blocked at runtime.
