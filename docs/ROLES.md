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
| `orchestrator` | `nvidia/nemotron-3-ultra-550b-a55b:free` (přes `openrouter-soukr`) | medium | plné **mínus** `edit,write` | `souls/orchestrator.md` |

Dispečer běží na **bezplatném** frontier orchestration modelu s 1M kontextem za $0/M, a to na **vlastním účtu** operátora. Alias účtu smí být na **profilu**, ale nikdy na **příkazové řádce**: CLI zahazuje providery mimo vestavěný katalog a alias kvalifikuje pouze běhový příkaz `/model`. To je podstatné — vestavěný účet `openrouter` bezplatné modely odmítá (404), zatímco alias je povoluje.

Orchestrátor **nikdy sám neimplementuje**. Vyhodnotí úkol přes System-1, otevře panel v Herdr a předá balíček paměti. Odebrání nástrojů `edit` a `write` je strukturálním vyjádřením tohoto pravidla: když dostane chuť upravit soubor, znamená to, že má delegovat.

### Která role ovládá UMA a umí delegovat?

`orchestrator` — a pouze ona. Pozor na dva chytáky:

- **`pi-uma` NENÍ správce UMA paměti.** Je to *repo specialista* pro práci **v** kódu `pi-uma`, stejně jako `mozek_rust` pro svůj repozitář.
- **`curator` se o UMA stará, ale nedispečuje.** Jeho soul ho váže k hygieně paměti (staging, konsolidace), nikoli k rozdělování práce.

Role `scout`, `oracle` a `reviewer` běží s `--no-extensions`, takže **nemohou delegovat vůbec** — průzkumný agent, který by mohl plodit další agenty, by popřel vlastní nákladovou a rozsahovou kázeň.

---

## Vrstva 2 — Průzkum (striktně čtecí)

| Role | Model | Thinking | Nástroje | Soul |
|---|---|---|---|---|
| `scout` | `google/gemini-2.5-flash-lite` | off | `read,ls,find,grep` + `--no-skills --no-extensions` | `souls/scout.md` |
| `librarian` | `google/gemini-2.5-flash` | low | `read,ls,find,grep,bash` | `souls/librarian.md` |

Běží na **levných modelech za 0 Kč**, aby drahý model nemusel tápat a pálit kontext. Dodávají přesné cesty a čísla řádků.

---

## Vrstva 3 — Realizace (zapisovací)

| Role | Model | Thinking | Nástroje | Soul |
|---|---|---|---|---|
| `implementer` | `anthropic/claude-sonnet-4.6` | high | plné | `souls/implementer.md` |
| `fixer` | `google/gemini-2.5-flash` | low | plné | `souls/fixer.md` |
| `frontend` | `anthropic/claude-sonnet-4.6` | high | plné | `souls/frontend.md` |
| `lotus` | `anthropic/claude-sonnet-4.6` | high | plné + MCP | `souls/lotus.md` |

Dostávají předem zúžený rozsah práce a pre-warmed kontext z UMA.

---

## Vrstva 4 — Kontrola (striktně čtecí, vysoké myšlení)

| Role | Model | Thinking | Nástroje | Soul |
|---|---|---|---|---|
| `reviewer` | `anthropic/claude-sonnet-4.6` | high | `read,ls,find,grep` + `--no-extensions` | `souls/reviewer.md` |
| `oracle` | `anthropic/claude-sonnet-4.6` | high | `read,ls,find,grep` + `--no-extensions` | `souls/oracle.md` |

Nezávislí auditoři bez práva zápisu. Reviewer hledá regrese a chybějící okrajové případy; Oracle je architektonický ďáblův advokát (využívá `uma_skeptic`).

---

## Vrstva 5 — Paměť

| Role | Model | Thinking | Nástroje | Soul |
|---|---|---|---|---|
| `curator` | `google/gemini-2.5-flash-lite` | off | `uma_*`, staging | `souls/curator.md` |

Dohlíží na hygienu paměti. **Nikdy nezapisuje bez schválení** — vše jde přes modální okno `uma_write` / `uma_supersede`.

---

## Řetězení rolí (pipeline)

Role lze spojovat do sekvenčních řetězů. Každá etapa běží ve svém panelu se svým soulem a svou hranicí nástrojů a **dostává report předchozí etapy jako explicitní handoff**.

Řetězení je sekvenční už z principu: reviewer nemůže auditovat práci, která ještě neexistuje, a implementátor nesmí začít dřív, než mu průzkum dodá fakta.

### Vestavěné řetězy

| Název | Složení | K čemu |
|---|---|---|
| `build` | `scout → implementer → reviewer` | Plný cyklus: zmapuj → implementuj → zkontroluj |
| `design` | `scout → oracle` | Průzkum + architektonická oponentura **před** psaním kódu |
| `research` | `librarian → implementer` | Nejdřív dokumentace, pak kód |
| `repair` | `fixer → reviewer` | Oprava + nezávislá kontrola |

### Použití

```bash
/orch pipeline build "oprav WAL locking v pi-uma"
/orch pipeline design "přepiš store na async SQLite"
/orch pipeline scout,oracle,implementer "vlastní řetěz"
```

Ekvivivalentně jako nástroj pro model: `orch_pipeline`.

### Zastavení řetězu

Řetěz se **zastaví hlasitě**, pokud etapa:
- vyprší časový limit (10 minut na etapu), nebo
- skončí ve stavu `blocked` (agent čeká na operátora).

Pokračovat s neúplným reportem by znamenalo briefovat další roli na základě neúplných dat — to je horší než zastavit.

---

## Volba modelů z katalogu Pi

Modely se neopisují ručně. Při psaní příkazu `/orch profile set <role> ` našeptávač nabídne **živý katalog modelů Pi** — přesně ty, které vidíte v pickeru `/model`:

```bash
/orch profile set scout            # → našeptávač vypíše dostupné modely
/orch profile set reviewer anthropic/claude-sonnet-4.6
```

---

## Omezení: účty OpenRouteru (`openrouter-soukr`)

Víceúčtové aliasy (např. `openrouter-soukr`) registruje plugin `pi-openrouter-accounts` **až při `session_start`** — tedy dlouho poté, co Pi ověřil příkazové přepínače. Ověřeno experimentálně:

| Forma | Výsledek |
|---|---|
| `--provider openrouter-soukr` | ❌ `Unknown provider` (validace před načtením extensionů) |
| `--model openrouter-soukr/<id>` | ❌ `Model not found` |
| `OPENROUTER_API_KEY=<soukr>` + `--model <id>` | ❌ klíč z auth.json vyhrál, 404 |
| `--model <id>` (bez provideru) | ⚠️ model se resolvuje přes **vestavěný** `openrouter` účet |
| *žádný* `--model` | ✅ použije se `defaultProvider`/`defaultModel` ze settings (tedy soukr) |

**Zásadní důsledek:** alias účtu **není z příkazové řádky adresovatelný vůbec**. A předání `--model` přepne resolvaci na vestavěný `openrouter` účet.

Platné hodnoty `provider` jsou pouze ty v katalogu při parsování argumentů: `antigravity`, `kimi-coding`, `ollama`, `opencode`, `openrouter`, `zenfree`.

### Dvě různé účty (ověřeno přes `/api/v1/key`)

| Záznam v `auth.json` | Hash klíče | Útrata | Bezplatné modely |
|---|---|---|---|
| `openrouter` + `openrouter-default` | `54c4d305e9` | $54,47 | ❌ 404 (`free-model-training`) |
| `openrouter-soukr` | `5df4e96577` | $0,00087 | ✅ 200 OK |

> **Oprava dřívějšího tvrzení:** bezplatný model není blokován na účtu `soukr` — je blokován na **vestavěném** účtu. Účet `soukr` bezplatné modely povoluje. Jakékoli selhání bezplatného modelu tedy znamená, že zakázka šla na vestavěný účet, nikoli na soukr.

### Co z toho plyne pro role

Role proto **model v příkazové řádce vůbec nepředávají**. CLI nese jen strukturální přepínače (allowlist nástrojů, soul, izolace kontextu), které přiřazení účtu nijak neovlivňují. Model a thinking se nastavují **až za běhu** příkazy `/model` a `/thinking`, tedy v živém sezení, kde jsou alias providery už zaregistrované:

```
CLI:  pi --tools read,ls,find,grep --no-skills --no-extensions \
         --append-system-prompt "…/souls/scout.md"
RT :  /model google/gemini-2.5-flash-lite
      /thinking off
```

Tím je splněn požadavek „jakýkoli model registrovaný v Pi“ — vybrat lze všechno, co ukazuje picker `/model`, včetně modelů z alias účtů:

```
/model openrouter-soukr/nvidia/nemotron-3-ultra-550b-a55b:free
```

`--no-extensions` zůstává jen jako hranice proti vnořené delegaci u čtecích rolí; přiřazení účtu neovlivňuje (ověřeno: stejná chyba se i bez něj).

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
# scout — strukturálně čtecí; model se přepíná až za běhu
pi --tools read,ls,find,grep \
   --no-skills --no-extensions \
   --append-system-prompt "…/souls/scout.md"
# a v sezení:
#   /model google/gemini-2.5-flash-lite
#   /thinking off
```

**Poznámka k účtům:** vynechání `--model` z CLI je zároveň to, co nechává panel na účtu nakonfigurovaném v `settings.json` (`defaultProvider`). Předání `--model` totiž resolvuje přes vestavěný katalog a přesměruje platbu na vestavěný účet.

Poznámka k `--thinking`: není na příkazové řádce vůbec — nastavuje se za běhu příkazem `/thinking`.
