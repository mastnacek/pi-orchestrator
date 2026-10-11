# Katalog rolí agentů (Soul-bound)

Syntéza nejlepších multi-agentních systémů (`pi-herdsman`, `oh-my-opencode-slim`, `herdr-projects`, `VoltAgent/awesome-claude-code-subagents`, `hermes-agent`, `ak-pi-workflow-roles`) upravená pro **Pi agent + Herdr multiplexer + UMA paměť**.

**Klíčový princip:** role není jen text v promptu. Každá role má **dvě vrstvy vynucení**:

| Vrstva | Soubor | Vynucuje |
|---|---|---|
| **Soul (identita)** | `souls/<role>.md` | Poslání, zákazy, výstupní formát |
| **Strukturální (flagy)** | `AgentProfile` v `config.ts` | `--tools` allowlist, `--thinking`, `--no-skills`, `--no-extensions` |

Prose deklaruje záměr; flagy ho činí nevynutitelným k obejití. Scout s `--tools read,ls,find,grep` **fyzicky nemůže** zavolat `edit` nebo `write`, i kdyby ho o to model požádal.

---

## Přehled rolí

```text
                  ┌────────────────────────┐
                  │  ORCHESTRATOR          │  dispečer, nikdy nepíše kód
                  │  (hlavní Pi instance)   │
                  └───────────┬────────────┘
                              │
      ┌───────────────────────┼───────────────────────┐
      ▼                       ▼                       ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  PRŮZKUM     │      │  REALIZACE   │      │  KONTROLA    │
│  scout       │      │  implementer │      │  reviewer    │
│  librarian   │      │  fixer       │      │  oracle      │
└──────────────┘      │  frontend    │      └──────────────┘
                      │  lotus       │
                      └──────────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │  CURATOR               │  hygiena UMA paměti
                  └────────────────────────┘
```

---

## Vrstva 1 — Řízení

| Role | Model | Thinking | Nástroje | Soul |
|---|---|---|---|---|
| *orchestrator* | `nvidia/nemotron-3-ultra-550b-a55b:free` | off | `orch_*`, `uma_*` | *(žije v hlavní instanci)* |

Orchestrátor **nikdy sám neimplementuje**. Vyhodnotí úkol přes System-1, otevře panel v Herdr a předá balíček paměti.

---

## Vrstva 2 — Průzkum (striktně čtecí)

| Role | Model | Thinking | Nástroje | Soul |
|---|---|---|---|---|
| `scout` | `nvidia/nemotron-3-ultra-550b-a55b:free` | off | `read,ls,find,grep` + `--no-skills --no-extensions` | `souls/scout.md` |
| `librarian` | `google/gemini-2.5-flash` | low | `read,ls,find,grep,bash` | `souls/librarian.md` |

Běží na **levných modelech za 0 Kč**, aby drahý model nemusel tápat a pálit kontext. Dodávají přesné cesty a čísla řádků.

---

## Vrstva 3 — Realizace (zapisovací)

| Role | Model | Thinking | Nástroje | Soul |
|---|---|---|---|---|
| `implementer` | `anthropic/claude-3-7-sonnet` | high | plné | `souls/implementer.md` |
| `fixer` | `google/gemini-2.5-flash` | low | plné | `souls/fixer.md` |
| `frontend` | `anthropic/claude-3-7-sonnet` | high | plné | `souls/frontend.md` |
| `lotus` | `anthropic/claude-3-7-sonnet` | high | plné + MCP | `souls/lotus.md` |

Dostávají předem zúžený rozsah práce a pre-warmed kontext z UMA.

---

## Vrstva 4 — Kontrola (striktně čtecí, vysoké myšlení)

| Role | Model | Thinking | Nástroje | Soul |
|---|---|---|---|---|
| `reviewer` | `anthropic/claude-3-7-sonnet` | high | `read,ls,find,grep` + `--no-extensions` | `souls/reviewer.md` |
| `oracle` | `anthropic/claude-3-7-sonnet` | high | `read,ls,find,grep` + `--no-extensions` | `souls/oracle.md` |

Nezávislí auditoři bez práva zápisu. Reviewer hledá regrese a chybějící okrajové případy; Oracle je architektonický ďáblův advokát (využívá `uma_skeptic`).

---

## Vrstva 5 — Paměť

| Role | Model | Thinking | Nástroje | Soul |
|---|---|---|---|---|
| `curator` | `nvidia/nemotron-3-ultra-550b-a55b:free` | off | `uma_*`, staging | `souls/curator.md` |

Dohlíží na hygienu paměti. **Nikdy nezapisuje bez schválení** — vše jde přes modální okno `uma_write` / `uma_supersede`.

---

## Ovládání

```bash
/orch profile list                  # výpis všech rolí s modely a nástroji
/orch profile select scout --global # aktivace výchozí role
/orch split scout                   # otevře panel se scoutem (čtecí, 0 Kč)
/orch split reviewer                # otevře panel s reviewrem
/orch auto "zkontroluj AST kontrakty v pi-uma"   # plné směrování
```

## Ukázka vygenerovaného příkazu

```bash
# scout — strukturálně čtecí, zakázané skills i extensions
pi --provider openrouter-soukr \
   --model nvidia/nemotron-3-ultra-550b-a55b:free \
   --thinking off \
   --tools read,ls,find,grep \
   --no-skills --no-extensions \
   --append-system-prompt "…/souls/scout.md"
```

Poznámka k `--thinking`: je předán vlastním přepínačem, nikoli jako suffix modelu. Variantní id (`...:free`) by se jinak srazilo se zkratkou `:thinking` a vznikl by neparsovatelný `:free:off`.
