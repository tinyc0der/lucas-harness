---
name: using-lucas-harness
description: Discovers, routes, and invokes agent skills. Use when starting a session, when you need to discover which skill applies to the current task, or when you're handed a whole ticket or request to drive end-to-end — it classifies the ticket type (Epic, Feature, Task, Bug, Incident, Migration, Improvement, Spike, Chore) and dispatches the calibrated flow over the lifecycle skills and commands, stopping for a human only at critical gates. This is the meta-skill that governs how all other skills are discovered, routed, and invoked.
---

# Using Lucas Harness

## Overview

Lucas Harness is a collection of engineering workflow skills organized by development phase. Each skill encodes a specific process that senior engineers follow. This meta-skill helps you discover and apply the right skill for your current task.

It works at two levels. For a single activity, it points you to the **one** skill that fits what you're doing right now (see Skill Discovery). For a whole incoming ticket or request, it **classifies** the work and **routes** it through the full lifecycle, skipping the steps that type doesn't need and stopping for a human only at critical gates (see Routing an Incoming Ticket).

## Skill Discovery

When a task arrives, identify the development phase and apply the corresponding skill:

```
Task arrives
    │
    ├── A whole ticket/request to drive end-to-end? ─→ Routing an Incoming Ticket (below)
    │
    ├── Don't know what you want yet? ──────→ interview-me
    ├── Have a rough concept, need variants? → idea-refine
    ├── New project/feature/change? ──→ spec-driven-development
    ├── Have a spec, need tasks? ──────→ planning-and-task-breakdown
    ├── Implementing code? ────────────→ incremental-implementation
    │   ├── UI work? ─────────────────→ frontend-ui-engineering
    │   ├── API work? ────────────────→ api-and-interface-design
    │   ├── Need better context? ─────→ context-engineering
    │   ├── Need doc-verified code? ───→ source-driven-development
    │   └── Stakes high / unfamiliar code? ──→ doubt-driven-development
    ├── Writing/running tests? ────────→ test-driven-development
    │   └── Browser-based? ───────────→ browser-testing-with-devtools
    ├── Something broke? ──────────────→ debugging-and-error-recovery
    ├── Reviewing code? ───────────────→ code-review-and-quality
    │   ├── Too complex? ─────────────→ code-simplification
    │   ├── Security concerns? ───────→ security-and-hardening
    │   └── Performance concerns? ────→ performance-optimization
    ├── Committing/branching? ─────────→ git-workflow-and-versioning
    ├── CI/CD pipeline work? ──────────→ ci-cd-and-automation
    ├── Deprecating/migrating? ────────→ deprecation-and-migration
    ├── Writing docs/ADRs? ───────────→ documentation-and-adrs
    ├── Saving/syncing durable knowledge? → memory-management
    ├── Adding logs/metrics/alerts? ───→ observability-and-instrumentation
    └── Deploying/launching? ─────────→ shipping-and-launch
```

## Routing an Incoming Ticket

When the task is a whole ticket or request to drive from intake through ship — not just a single activity — classify it and run the calibrated flow. This adds no new mechanics: every step dispatches an existing `/command` or `lucas-harness:<skill>`. The win is *picking the right flow* and *skipping the steps that type doesn't need*, while still stopping for a human at the genuinely critical gates.

**Route vs. pick one skill:** Route when you're handed a ticket, issue, or feature request and want the lifecycle driven end-to-end. If you only need the single skill for what you're doing right now, use the Skill Discovery tree above instead. Don't route a plain question with no change to make — just answer it.

### Step -1 — Load durable project context

Before classifying a project-scoped request, follow the rules-file pointer and
load `docs/knowledge/index.md` plus `docs/knowledge/project.md` when the OKF
bundle exists. If the request targets a package with its own bundle, also load
`packages/<pkg>/docs/knowledge/index.md` plus
`packages/<pkg>/docs/knowledge/project.md`. Consult only the relevant collection
indexes and concepts on demand. If legacy memory homes are detected instead,
read them best-effort and surface the migration need, but make no file move
before ticket classification and branch setup. Execute migration handling only
when the current request authorizes that migration or as separately approved
work; never create a second core in the meantime.

### Step 0 — Intake (what kind of input is this?)

The input may be a scoped ticket *or* a raw description of intent. Decide which before classifying:

- **Non-actionable** — a question, duplicate, missing detail needed to act, or won't-fix/out-of-scope item → don't force it into a flow; answer it, ask for the missing detail, or recommend closing it, then stop.
- **Raw intent** — a goal, wish, or problem statement that isn't yet a concrete change ("make onboarding smoother", "we should support SSO") → run the **Define phase first**: `interview-me` for a broad/fuzzy goal (→ `docs/intent/<topic>.md`) or `idea-refine` for a rough but bounded idea (→ `docs/ideas/<idea>.md`). Then re-enter at Step 1 to classify the sharpened result, and carry a `> Source:` link to the Define artifact onto whatever spec/guide it produces (provenance).
- **Scoped change** — already concrete enough to name the work → go straight to Step 1.

Don't over-trigger Define: most natural-language descriptions ("the dashboard feels slow" → a perf Improvement) are concrete enough to classify directly. Refine first only when the input is genuinely too broad (spans multiple features) or too fuzzy (a wish with no concrete change in mind) to classify with confidence.

### Step 1 — Classify (explicit and overridable)

Classify from the **content** of the ticket — judge what the work actually entails, not any type label the user typed. A prefix like `bug:` is a hint at most, never authoritative: a ticket tagged "bug" that adds a new capability is a **Feature**, and one tagged "task" that needs a destructive migration escalates. Match the description against the signals below, then **state your classification in one line and proceed**; the user can correct it. When the content genuinely fits two types, ask. If Step 0 refined raw intent, classify the sharpened result — a broad goal typically lands as an **Epic**, a sharpened single idea as a **Feature**.

| Type | Signal |
|------|--------|
| **Epic** | Spans multiple shippable features/surfaces; "build an X system"; too big for one spec. |
| **Feature** | One net-new user-facing capability worth a spec; a single shippable unit. |
| **Task** | A small, well-defined slice of an already-specced feature; no spec of its own. |
| **Bug** | Something is broken, incorrect, or regressed; a reproducible defect (not currently a live outage). |
| **Incident · hotfix** | Production is broken or degraded **right now**; urgency dominates ("outage", "down", "P0/P1", "prod regression"). |
| **Migration · deprecation** | Removing, replacing, or sunsetting existing behavior/API/data — not adding or fixing ("deprecate", "migrate", "sunset", "remove X", "drop support for"). |
| **Improvement · refactor** | Change internal structure *without* changing behavior ("clean up", "simplify", "refactor"). |
| **Improvement · perf** | Make existing behavior faster/lighter ("slow", "optimize", "latency", "memory"). |
| **Spike** | Open question or research ("investigate", "explore", "prototype to learn"); throwaway. |
| **Chore** | Maintenance with no user-facing runtime change (deps bump, config, CI, tooling, version, formatting; docs-only counts here). |

### Step 2 — Set up the branch & artifacts

All per-feature artifacts live at `docs/specs/<slug>/`, where `<slug>` is the filesystem-safe feature slug derived from the current git branch name (see the Workflow Artifacts map in the `context-engineering` skill). **Never write feature artifacts onto `main`/`master`, and never use the raw branch name as a path.** Create the branch *before* any artifact-producing step:

- Feature → `feature/<x>` · Task → parent branch or `task/<x>` · Bug → `fix/<x>` · Incident → `hotfix/<x>` · Migration → `migrate/<x>` · Improvement (refactor) → `improve/<x>` · Improvement (perf) → `perf/<x>` · Spike → `spike/<x>` (throwaway) · Chore → `chore/<x>`
- Epic → no single branch; each child feature gets its own `feature/<x>` (see below).
- Migration guides live at global `docs/migrations/<name>.md`. Incident runbooks live at `<memory-root>/knowledge/runbooks/<alert>.md` after resolving root-versus-package scope through `memory-management`; they are OKF `Playbook` concepts. Neither belongs under `docs/specs/<slug>/`.
- Candidate durable knowledge discovered during feature work lives in `docs/specs/<slug>/memory-delta.md` until the feature reaches `/ship`.

### Step 3 — Dispatch the calibrated flow

Throughout, **"verify"** means: run the app and observe the changed runtime behavior — invoke `lucas-harness:browser-testing-with-devtools` for browser surfaces, otherwise smoke-test the app directly. It is distinct from `/test` (unit/integration tests) and from `/ship`'s static review fan-out. **"ship-lite"** means `/ship` with the persona fan-out auto-skipped — `/ship` already does this for small, low-blast-radius diffs (≤2 files, <50 lines, nothing touching auth, payments, data, or config). 🔴 marks a deliberate human gate.

In Claude Code, dispatch the slash commands below. In harnesses without slash commands, invoke the equivalent lifecycle skill(s) named by that command instead: `/spec` → `lucas-harness:spec-driven-development`, `/build` → `lucas-harness:incremental-implementation` + `lucas-harness:test-driven-development`, `/test` → `lucas-harness:test-driven-development`, `/review` → `lucas-harness:code-review-and-quality`, `/code-simplify` → `lucas-harness:code-simplification`, and `/ship` → `lucas-harness:shipping-and-launch`.

Every `/ship` performs memory closeout **sequentially after** the merged GO/NO-GO decision. On GO, `shipping-and-launch` invokes `memory-management` against `docs/specs/<slug>/memory-delta.md`, routes verified items to their canonical homes, and records each disposition. On NO-GO, the delta remains unpromoted workflow state. Memory closeout is never part of `/ship`'s parallel review fan-out.

- **Epic** — `lucas-harness:interview-me` → write intent to `docs/intent/<topic>.md` (reuse the intent doc if Step 0 already produced one — don't re-interview) → 🔴 **approve the split** into features → run the **Feature** flow below for each child feature on its own branch → finish with an integration **verify** across the assembled features. *Skips:* one mega spec/plan/ship.
- **Feature** — `/spec` (🔴 confirm spec) → `/build auto` (🔴 approve plan — the gate lives inside `build auto`) → **verify** if the ticket has runtime surface → `/ship` (🔴 GO/NO-GO). *Skips:* `/plan` and `/test` — both run inside `/build auto`.
- **Task** — confirm the active parent feature has `docs/specs/<slug>/plan.md` with a pending task → `/build` (single task) → **verify** if it has runtime surface. The child rides the parent feature's `/ship`. If no parent spec/plan exists, reclassify the work as a Feature, Bug, or Chore before proceeding. *Skips:* spec, plan, `/test`, standalone ship. No human gate unless an escalation trigger fires.
- **Bug** — reproduce with a failing test via `lucas-harness:debugging-and-error-recovery` / `/test` (Prove-It; the failing test *is* the spec) → fix → **verify** (always — a bug is an observable defect) → `/review` if the root cause is risky → `/ship` (🔴 if the root cause was risky). *Skips:* spec, plan. Here `/test` is correct: the fix is hand-written and bypasses `/build`'s loop. (If it's live in production, route to **Incident** instead.)
- **Incident · hotfix** — calibration is *inverted*: stabilize first, process after. 🔴 **Mitigate** — stop the bleeding via rollback or feature flag *before* diagnosing → **verify recovery** against production signals → root-cause as a **Bug** (failing test → fix) on the `hotfix/<x>` branch → ship the fix (🔴 expedited GO/NO-GO) → **postmortem**: resolve memory scope, then write or update `<memory-root>/knowledge/runbooks/<alert>.md` via `lucas-harness:observability-and-instrumentation` under the `memory-management` OKF contract, and file follow-ups. *Skips:* spec, plan — speed first; the postmortem is **mandatory**, not optional.
- **Migration · deprecation** — write the migration/deprecation guide to `docs/migrations/<name>.md` via `lucas-harness:deprecation-and-migration` (the guide *is* the spec) → roll out in phases (deprecate → warn → remove) → 🔴 **destructive/irreversible-step gate** before any data migration, public-API removal, or dropped column (anything not `git revert`-able) → **verify** each phase → `/review` → `/ship` with the guide + a `CHANGELOG.md` entry and the deprecation timeline communicated. *Skips:* `/spec`, `/plan` for the mechanics.
- **Improvement · refactor** — ensure tests guard the current behavior first (add via `/test` if missing) → `/code-simplify` (it runs the test loop internally) → `/review` → ship-lite. *Skips:* spec, plan, a separate `/test` pass, and **verify** — unless the change turns out to alter behavior, in which case verify.
- **Improvement · perf** — capture a baseline measurement → `lucas-harness:performance-optimization` (or `/webperf` for web surfaces) → **verify the measured improvement** (re-measure, don't assume) → `/review` → `/ship`. 🔴 if it touches a hot or risky path. *Skips:* spec, plan.
- **Spike** — 🔴 **frame the scope/question** → explore (throwaway code, don't merge) → write findings to `docs/ideas/<x>.md` via `lucas-harness:idea-refine` → 🔴 **promote** (re-enter as a Feature) **or drop**. *Skips:* tests, verify, review, ship.
- **Chore** — make the change → `/test` + build (hand-written change bypasses `/build`'s loop, so `/test` is the explicit gate) → smoke-**verify** only if it touches a runtime dependency or config. Low-risk chores use ship-lite; chores touching secrets, CI, deploy, config/env, auth, payments, or data use full `/ship` and require the 🔴 gate. *Skips:* spec, plan, review. (Docs-only chores: invoke `lucas-harness:documentation-and-adrs` and skip the test step.)

### Two calibration rules (why steps get skipped)

1. **`/test` is redundant wherever a test loop already runs.** `/build`, `/build auto`, and `/code-simplify` each run RED→GREEN (or revert-on-fail) internally. Call `/test` explicitly **only** when the work *bypasses* those loops — a hand-written bug fix, a chore, a legacy backfill.
2. **"verify" is orthogonal to tests.** Add it wherever the ticket changes **observable runtime behavior**, regardless of whether tests ran — and omit it when nothing observable changes (most refactors).

### Human-in-the-middle (critical gates only)

Run autonomously between steps. Stop for a human **only** at: the 🔴 gates above (spec confirm, plan approval inside `/build auto`, ship GO/NO-GO, Epic split, Spike frame/promote-drop, Incident mitigate-first, Migration destructive-step), and the standard escalation triggers — auth/permissions, payments, destructive migrations, deletions, deploys, secrets, anything not undoable with `git revert`, unfixable test/build failures, ambiguous specs, or Critical security/review findings (NO-GO by default). These are enforced by `lucas-harness:doubt-driven-development` and the escalation list in `/build`; don't re-derive them.

### Routing rules

1. Classification is a *recommendation* — always let the user override the type.
2. Never invent requirements. If a Feature/Epic ticket is too thin to classify or spec, ask before branching.
3. Preserve the branch-slug contract — create the branch before writing any `docs/specs/<slug>/` artifact; never write feature artifacts onto the trunk.
4. The router only dispatches; it does not duplicate skill logic. Each step's behavior lives in its command/skill.
5. When a ticket genuinely spans two types (e.g. a bug fix that also needs a perf pass), run the flows in sequence rather than forcing one box.

### Routing rationalizations

| Rationalization | Reality |
|---|---|
| "The user typed `bug:`, so it's a Bug." | A type label is a hint, not authority. Classify from what the work actually entails — a "bug" that adds a capability is a Feature. |
| "I'll just run the full Feature flow to be safe." | Over-calibrating burns the user's time on spec/plan/ship steps a Chore or Task doesn't need. Right-sizing is the whole point. |
| "This vague goal is close enough to spec directly." | Raw intent that spans features or has no concrete change must go through Define first, or you'll spec the wrong thing. |
| "I can skip the human gate, the change looks safe." | The 🔴 gates and escalation triggers are non-negotiable. Auth, payments, destructive, and deploy steps stop for a human regardless of how safe they look. |
| "I'll write the artifacts now and branch later." | Feature artifacts must never land on `main`/`master`. Create the branch before the first artifact-producing step. |

### Routing verification

Before considering the routing complete, confirm:

- [ ] The input was triaged (non-actionable / raw intent / scoped change) before classifying.
- [ ] A single classification was stated in one line, with the user given a chance to override.
- [ ] A correctly-named branch exists before any feature artifact was written.
- [ ] Only the steps the chosen type calls for were run — skipped steps were genuinely skipped, not silently dropped.
- [ ] Every 🔴 gate and escalation trigger reached was surfaced to a human.
- [ ] Each dispatched step ran its own command/skill rather than re-implementing it here.

## Core Operating Behaviors

These behaviors apply at all times, across all skills. They are non-negotiable.

### 1. Surface Assumptions

Before implementing anything non-trivial, explicitly state your assumptions:

```
ASSUMPTIONS I'M MAKING:
1. [assumption about requirements]
2. [assumption about architecture]
3. [assumption about scope]
→ Correct me now or I'll proceed with these.
```

Don't silently fill in ambiguous requirements. The most common failure mode is making wrong assumptions and running with them unchecked. Surface uncertainty early — it's cheaper than rework.

### 2. Manage Confusion Actively

When you encounter inconsistencies, conflicting requirements, or unclear specifications:

1. **STOP.** Do not proceed with a guess.
2. Name the specific confusion.
3. Present the tradeoff or ask the clarifying question.
4. Wait for resolution before continuing.

**Bad:** Silently picking one interpretation and hoping it's right.
**Good:** "I see X in the spec but Y in the existing code. Which takes precedence?"

### 3. Push Back When Warranted

You are not a yes-machine. When an approach has clear problems:

- Point out the issue directly
- Explain the concrete downside (quantify when possible — "this adds ~200ms latency" not "this might be slower")
- Propose an alternative
- Accept the human's decision if they override with full information

Sycophancy is a failure mode. "Of course!" followed by implementing a bad idea helps no one. Honest technical disagreement is more valuable than false agreement.

### 4. Enforce Simplicity

Your natural tendency is to overcomplicate. Actively resist it.

Before finishing any implementation, ask:
- Can this be done in fewer lines?
- Are these abstractions earning their complexity?
- Would a staff engineer look at this and say "why didn't you just..."?

If you build 1000 lines and 100 would suffice, you have failed. Prefer the boring, obvious solution. Cleverness is expensive.

### 5. Maintain Scope Discipline

Touch only what you're asked to touch.

Do NOT:
- Remove comments you don't understand
- "Clean up" code orthogonal to the task
- Refactor adjacent systems as a side effect
- Delete code that seems unused without explicit approval
- Add features not in the spec because they "seem useful"

Your job is surgical precision, not unsolicited renovation.

### 6. Verify, Don't Assume

Every skill includes a verification step. A task is not complete until verification passes. "Seems right" is never sufficient — there must be evidence (passing tests, build output, runtime data).

## Failure Modes to Avoid

These are the subtle errors that look like productivity but create problems:

1. Making wrong assumptions without checking
2. Not managing your own confusion — plowing ahead when lost
3. Not surfacing inconsistencies you notice
4. Not presenting tradeoffs on non-obvious decisions
5. Being sycophantic ("Of course!") to approaches with clear problems
6. Overcomplicating code and APIs
7. Modifying code or comments orthogonal to the task
8. Removing things you don't fully understand
9. Building without a spec because "it's obvious"
10. Skipping verification because "it looks right"

## Skill Rules

1. **Check for an applicable skill before starting work.** Skills encode processes that prevent common mistakes.

2. **Skills are workflows, not suggestions.** Follow the steps in order. Don't skip verification steps.

3. **Multiple skills can apply.** A feature implementation might involve `idea-refine` → `spec-driven-development` → `planning-and-task-breakdown` → `incremental-implementation` → `test-driven-development` → `code-review-and-quality` → `code-simplification` → `shipping-and-launch` in sequence.

4. **When in doubt, start with a spec.** If the task is non-trivial and there's no spec, begin with `spec-driven-development`.

## Lifecycle Sequence

For a complete feature, the typical skill sequence is:

```
1.  interview-me                → Extract what the user actually wants
2.  idea-refine                 → Refine vague ideas
3.  spec-driven-development     → Define what we're building
4.  planning-and-task-breakdown → Break into verifiable chunks
5.  context-engineering         → Load the right context
6.  source-driven-development   → Verify against official docs
7.  incremental-implementation  → Build slice by slice
8.  observability-and-instrumentation → Instrument as you build (runs parallel with 7-9, not after)
9.  doubt-driven-development    → Cross-examine non-trivial decisions in-flight
10. test-driven-development     → Prove each slice works
11. code-review-and-quality     → Review before merge
12. code-simplification         → Reduce unnecessary complexity while preserving behavior
13. git-workflow-and-versioning → Clean commit history
14. documentation-and-adrs      → Document decisions
15. deprecation-and-migration   → Retire old systems and move users safely when needed
16. shipping-and-launch         → Decide and deploy safely
17. memory-management           → Promote verified knowledge during GO-only ship closeout
```

Not every task needs every skill. A bug fix might only need: `debugging-and-error-recovery` → `test-driven-development` → `code-review-and-quality`.

## Quick Reference

| Phase | Skill | One-Line Summary |
|-------|-------|-----------------|
| Define | interview-me | Surface what the user actually wants before any plan, spec, or code exists |
| Define | idea-refine | Refine ideas through structured divergent and convergent thinking |
| Define | spec-driven-development | Requirements and acceptance criteria before code |
| Plan | planning-and-task-breakdown | Decompose into small, verifiable tasks |
| Build | incremental-implementation | Thin vertical slices, test each before expanding |
| Build | source-driven-development | Verify against official docs before implementing |
| Build | doubt-driven-development | Adversarial fresh-context review of every non-trivial decision |
| Build | context-engineering | Right context at the right time |
| Build | frontend-ui-engineering | Production-quality UI with accessibility |
| Build | api-and-interface-design | Stable interfaces with clear contracts |
| Verify | test-driven-development | Failing test first, then make it pass |
| Verify | browser-testing-with-devtools | Chrome DevTools MCP for runtime verification |
| Verify | debugging-and-error-recovery | Reproduce → localize → fix → guard |
| Review | code-review-and-quality | Five-axis review with quality gates |
| Review | code-simplification | Preserve behavior while reducing unnecessary complexity |
| Review | security-and-hardening | OWASP prevention, input validation, least privilege |
| Review | performance-optimization | Measure first, optimize only what matters |
| Ship | git-workflow-and-versioning | Atomic commits, clean history |
| Ship | ci-cd-and-automation | Automated quality gates on every change |
| Ship | deprecation-and-migration | Remove old systems and migrate users safely |
| Ship | documentation-and-adrs | Document the why, not just the what |
| Ship | observability-and-instrumentation | Structured logs, RED metrics, traces, symptom-based alerts |
| Ship | shipping-and-launch | Pre-launch checklist, monitoring, rollback plan |
| Ship | memory-management | Route, review, promote, and prune durable project knowledge |
