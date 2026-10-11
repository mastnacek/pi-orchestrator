---
id: 01M4N1JACGK5G8P3EHPZP39K3R
scope: "project:pi-orchestrator"
type: decision
title: "Orchestrator plugin requirements: comprehensive help, status examples, and skill"
tags:
  - orchestrator
  - help
  - standards
  - herdr
status: stable
generated:
  by: pi-agent/1.1
  at: "2026-10-11T08:34:14.544433+00:00"
verified:
  - by: "human:operator"
    at: "2026-10-11T08:34:14.544440300+00:00"
since: "2026-10-11T08:34:14.544440300+00:00"
---
### Context
The operator requires all orchestration and memory tools to ship with detailed, self-explanatory Czech help, concrete command examples, and real status output examples so anyone can orient instantly without guessing.

### Rule
1. pi-orchestrator must provide rich in-product help (/orch help), including practical examples of routing, delegation, pane management, and profile workflows.
2. Status outputs (/orch status) must show concrete layout examples and agent states (idle, working, blocked).
3. The plugin must bundle an official agent skill (skills/orchestrator/SKILL.md) following pi-plugin-dev standards.