# @mastnacek/pi-orchestrator

Memory-native task orchestrator for the **[Pi coding agent](https://pi.dev)** and **[Herdr](https://herdr.dev)** terminal multiplexer.

Built on **Vertical Slice Architecture (VSA)** and **Proposal 09** (`docs/proposals/09-memory-orchestrator.md`).

---

## 🌟 Architecture & Premise

Frontier models are expensive. The premise of the memory orchestrator is that an agent running in a designated Herdr pane acts as a dispatcher:

1. **System-1 Fastbrain Routing (`orch_route`):**  
   Evaluates user tasks using UMA's fastbrain offline router (`uma route check --json`). Determines target project specialists deterministically, falling back to Jev or escalating to the orchestrator model when ambiguous.
2. **Context-Prewarmed Delegation (`orch_delegate`):**  
   Submits instructions to specialist coding agents running in persistent Herdr panes/tabs (e.g. `pi-uma`, `mozek_rust`). Pre-warms the delegate with UMA memory facts (the *context slice*) so the delegate needs no cold exploratory phase.
3. **Full Observability & Intervention (`orch_status`, `orch_collect`):**  
   Delegates run as full Pi instances in visible Herdr panes — **never blind subagents**. The operator can watch them work live and switch into their terminal at any time.

---

## 🛠️ Custom Tools

| Tool | Parameters | Description |
|---|---|---|
| `orch_route` | `prompt`, `judge?`, `maxContext?` | Query UMA fastbrain routing: specialist, confidence, runner-up, and context slice facts. |
| `orch_delegate` | `target`, `prompt`, `includeContext?`, `wait?`, `timeoutMs?` | Delegate task prompt to Herdr agent pane with pre-warmed memory context. |
| `orch_status` | *(none)* | Live report of active Herdr workspaces, tabs, panes, and agent lifecycle states. |
| `orch_collect` | `target`, `lines?` | Read terminal output from a delegated coding agent. |

---

## ⌨️ Slash Commands (`/orch`)

- `/orch auto <prompt>` — Evaluates route; if confident, summarizes and delegates to the target specialist.
- `/orch route <prompt>` — Displays the System-1 routing verdict, confidence score, and recalled context slice facts without delegating.
- `/orch delegate <target> <prompt>` — Manually delegates a prompt to a named specialist or pane ID.
- `/orch split [target]` — Splits workspace into a new side-by-side pane for the specialist and launches Pi.
- `/orch rename <label>` — Renames the current pane in Herdr.
- `/orch profile` — Interactive profile selector menu and manager.
  - `/orch profile list` — List all defined specialist profiles.
  - `/orch profile select <name>` — Set the default agent profile.
  - `/orch profile set <name> <model>` — Create/update a profile with a model.
  - `/orch profile remove <name>` — Remove an agent profile.
- `/orch status` — Shows active Herdr multiplexer panes, tabs, and agents.
- `/orch lang [en|cs]` — Switch between English and Czech.

---

## 🛡️ Invariants & Safety

- **Recursion Guard:** Structurally checks `HERDR_PANE_ID` and forbids delegating to the orchestrator's own pane.
- **Subagent Guard:** Suppresses hooks if `PI_SUBAGENT` or `PI_CHILD_SESSION` is set.
- **Deterministic Routing:** Uses offline keyword markers and winner margin before escalating to model reasoning.
- **Multilingual UI:** Compliant string tables (`en` / `cs`) with strict type-safety.

---

## 📦 License

MIT © mastnacek
