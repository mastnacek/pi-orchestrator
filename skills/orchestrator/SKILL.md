---
name: orchestrator
description: Expert guide for task orchestration across Herdr multiplexer panes using UMA fastbrain routing, agent profiles, and context-slice handoffs. Triggers on mentions of "orchestrator", "orch", "delegate task", "herdr panes", or multi-agent multiplexer workflows.
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
│    (herdr agent read)        │  harvest results back with /orch collect.
└──────────────────────────────┘
```

---

## 2. Interactive Slash Commands (`/orch`)

| Command | Description & Practical Example |
|---|---|
| `/orch auto <prompt>` | **Full tiered routing:** Evaluates prompt, shows confirmation modal with pane name & status, and submits task.<br>`/orch auto "oprav WAL locking v pi-uma storu"` |
| `/orch route <prompt>` | **Dry-run route preview:** Previews winner specialist, confidence score, and context slice facts without delegating.<br>`/orch route "prekoduj video v mozek_rust pipeline"` |
| `/orch split [specialist]` | **Split workspace:** Opens a side-by-side terminal pane to the right with the specialist's directory and launches Pi.<br>`/orch split pi-uma` |
| `/orch rename <název>` | **Label current pane:** Renames the active Herdr pane for clear visual multiplexer orientation.<br>`/orch rename "Hlavní dispečer"` |
| `/orch status` | **Multiplexer overview:** Displays all active workspaces, panes, labels, and live agent states.<br>`/orch status` |
| `/orch profile` | **Profile manager:** Interactive TUI selector or CLI manager for agent models, thinking, and system prompts.<br>`/orch profile list`<br>`/orch profile select frontier`<br>`/orch profile set mozek_rust anthropic/claude-3-7-sonnet` |
| `/orch delegate <target> <prompt>` | **Manual delegation:** Bypasses routing to send a prompt directly to a specific pane ID or agent.<br>`/orch delegate w1Y:p2Q "analyzuj kód paměti"` |

---

## 3. Concrete Status Output Example (`/orch status`)

Running `/orch status` outputs structured diagnostics:

```text
── Herdr Orchestrator Status ──
Herdr active: yes (HERDR_ENV=1)
Orchestrator pane: w1Z:p4 ("Orchestrator")
Active Workspace: w1Z (pi-uma)

Live Panes & Agents:
  • Pane w1Z:p4 "Orchestrator" [agent: pi, status: working]
    cwd: D:\01_programovani\pi\plugins
  • Pane w1Z:p9 "Specialist: pi-uma" [agent: pi, status: idle]
    cwd: D:\01_programovani\pi\plugins\pi-uma
  • Pane w1Y:p2Q "Memory Researcher" [agent: agy, status: idle]
    cwd: D:\01_programovani\ai-memory
```

- **`idle`**: Agent is ready to receive a new prompt immediately.
- **`working`**: Agent is currently generating code or executing tools.
- **`blocked`**: Agent is waiting for user confirmation or question approval.

---

## 4. Agent Profiles Configuration

Profiles define the exact model, reasoning effort, and system prompts for each specialist pane. Configured in `~/.pi/agent/orchestrator.json` or `.pi/orchestrator.json`:

```json
{
  "defaultProfile": "fast",
  "autoConfirm": true,
  "splitDirection": "right",
  "profiles": {
    "pi-uma": {
      "name": "pi-uma",
      "model": "nvidia/nemotron-3-ultra-550b-a:off",
      "thinking": "off",
      "appendSystemPrompt": "Dodržuj přísně VSA architekturu a AST kontrakty."
    },
    "mozek_rust": {
      "name": "mozek_rust",
      "model": "anthropic/claude-3-7-sonnet",
      "thinking": "high"
    },
    "fast": {
      "name": "fast",
      "model": "google/gemini-2.5-flash",
      "thinking": "off"
    }
  }
}
```

---

## 5. Invariants & Safety

1. **Self-Recursion Guard:** Structurally checks `HERDR_PANE_ID` and forbids delegating to the orchestrator's own pane.
2. **Subagent Recursion Guard:** Suppresses extension execution if `PI_SUBAGENT` or `PI_CHILD_SESSION` is detected.
3. **Automated Enter Dispatch:** When pasting prompts into target panes, automatically dispatches an `Enter` keypress after a 150ms buffer flush so the agent begins work autonomously.
4. **Human-in-the-Loop Confirmation:** When using `/orch auto`, an interactive modal always confirms whether to reuse an existing idle pane or split a new one.
