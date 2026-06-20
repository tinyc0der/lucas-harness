---
name: ticket-routing
description: Routes any incoming ticket or raw request to its correctly-calibrated flow by classifying its type (Epic, Feature, Task, Bug, Incident, Migration, Improvement, Spike, Chore), setting up the branch, then dispatching the existing lifecycle commands and skills — skipping the steps that type doesn't need and stopping for a human only at critical gates. Use when you're handed a ticket, issue, or feature request and aren't sure which command or flow to run, or when you want the full lifecycle orchestrated end-to-end from a single starting point.
---

# Ticket Routing

## Overview

This skill is a **router**, not a new workflow. It reads an incoming ticket or request, classifies it, sets up the branch, then dispatches the existing commands and skills in the calibration that fits that ticket type. It adds no new mechanics — every step below is an existing `/command` or `lucas-harness:<skill>`. The win is *picking the right flow* and *skipping the steps that type doesn't need*, while still stopping for a human at the genuinely critical gates.

## When to Use

- You have a ticket, issue, or feature request and aren't sure which command or flow it warrants.
- You want the full lifecycle orchestrated end-to-end rather than driving each command by hand.
- The work could be anything from a one-line chore to a multi-feature epic, and you want it calibrated to the right depth.

**When NOT to use:** You already know exactly which single command fits (call that command directly), or the request is a plain question with no change to make (just answer it).

## Step 0 — Intake (what kind of input is this?)

The input may be a scoped ticket *or* a raw description of intent. Decide which before classifying:

- **Non-actionable** — a question, duplicate, missing detail needed to act, or won't-fix/out-of-scope item → don't force it into a flow; answer it, ask for the missing detail, or recommend closing it, then stop.
- **Raw intent** — a goal, wish, or problem statement that isn't yet a concrete change ("make onboarding smoother", "we should support SSO") → run the **Define phase first**: `lucas-harness:interview-me` for a broad/fuzzy goal (→ `docs/intent/<topic>.md`) or `lucas-harness:idea-refine` for a rough but bounded idea (→ `docs/ideas/<idea>.md`). Then re-enter at Step 1 to classify the sharpened result, and carry a `> Source:` link to the Define artifact onto whatever spec/guide it produces (provenance).
- **Scoped change** — already concrete enough to name the work → go straight to Step 1.

Don't over-trigger Define: most natural-language descriptions ("the dashboard feels slow" → a perf Improvement) are concrete enough to classify directly. Refine first only when the input is genuinely too broad (spans multiple features) or too fuzzy (a wish with no concrete change in mind) to classify with confidence.

## Step 1 — Classify (explicit and overridable)

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

## Step 2 — Set up the branch & artifacts

All per-feature artifacts live at `docs/specs/<slug>/`, where `<slug>` is the current git branch name (see the Workflow Artifacts map in the `context-engineering` skill). **Never write feature artifacts onto `main`/`master`.** Create the branch *before* any artifact-producing step:

- Feature → `feature/<x>` · Task → parent branch or `task/<x>` · Bug → `fix/<x>` · Incident → `hotfix/<x>` · Migration → `migrate/<x>` · Improvement (refactor) → `improve/<x>` · Improvement (perf) → `perf/<x>` · Spike → `spike/<x>` (throwaway) · Chore → `chore/<x>`
- Epic → no single branch; each child feature gets its own `feature/<x>` (see below).
- Migration guides live at `docs/migrations/<name>.md` and incident runbooks at `docs/runbooks/<alert>.md` — both **global** tiers in the artifact map, not under `docs/specs/<slug>/`.

## Step 3 — Dispatch the calibrated flow

Throughout, **"verify"** means: run the app and observe the changed runtime behavior — invoke `lucas-harness:browser-testing-with-devtools` for browser surfaces, otherwise smoke-test the app directly. It is distinct from `/test` (unit/integration tests) and from `/ship`'s static review fan-out. **"ship-lite"** means `/ship` with the persona fan-out auto-skipped — `/ship` already does this for small, low-blast-radius diffs (≤2 files, <50 lines, nothing touching auth, payments, data, or config). 🔴 marks a deliberate human gate.

- **Epic** — `lucas-harness:interview-me` → write intent to `docs/intent/<topic>.md` (reuse the intent doc if Step 0 already produced one — don't re-interview) → 🔴 **approve the split** into features → run the **Feature** flow below for each child feature on its own branch → finish with an integration **verify** across the assembled features. *Skips:* one mega spec/plan/ship.
- **Feature** — `/spec` (🔴 confirm spec) → `/build auto` (🔴 approve plan — the gate lives inside `build auto`) → **verify** if the ticket has runtime surface → `/ship` (🔴 GO/NO-GO). *Skips:* `/plan` and `/test` — both run inside `/build auto`.
- **Task** — `/build` (single task) → **verify** if it has runtime surface. The child rides the parent feature's `/ship` (a standalone `task/<x>` ships itself, ship-lite). *Skips:* spec, plan, `/test`, full ship. No human gate unless an escalation trigger fires.
- **Bug** — reproduce with a failing test via `lucas-harness:debugging-and-error-recovery` / `/test` (Prove-It; the failing test *is* the spec) → fix → **verify** (always — a bug is an observable defect) → `/review` if the root cause is risky → `/ship` (🔴 if the root cause was risky). *Skips:* spec, plan. Here `/test` is correct: the fix is hand-written and bypasses `/build`'s loop. (If it's live in production, route to **Incident** instead.)
- **Incident · hotfix** — calibration is *inverted*: stabilize first, process after. 🔴 **Mitigate** — stop the bleeding via rollback or feature flag *before* diagnosing → **verify recovery** against production signals → root-cause as a **Bug** (failing test → fix) on the `hotfix/<x>` branch → ship the fix (🔴 expedited GO/NO-GO) → **postmortem**: write or update a runbook at `docs/runbooks/<alert>.md` via `lucas-harness:observability-and-instrumentation` and file follow-ups. *Skips:* spec, plan — speed first; the postmortem is **mandatory**, not optional.
- **Migration · deprecation** — write the migration/deprecation guide to `docs/migrations/<name>.md` via `lucas-harness:deprecation-and-migration` (the guide *is* the spec) → roll out in phases (deprecate → warn → remove) → 🔴 **destructive/irreversible-step gate** before any data migration, public-API removal, or dropped column (anything not `git revert`-able) → **verify** each phase → `/review` → `/ship` with the guide + a `CHANGELOG.md` entry and the deprecation timeline communicated. *Skips:* `/spec`, `/plan` for the mechanics.
- **Improvement · refactor** — ensure tests guard the current behavior first (add via `/test` if missing) → `/code-simplify` (it runs the test loop internally) → `/review` → ship-lite. *Skips:* spec, plan, a separate `/test` pass, and **verify** — unless the change turns out to alter behavior, in which case verify.
- **Improvement · perf** — capture a baseline measurement → `lucas-harness:performance-optimization` (or `/webperf` for web surfaces) → **verify the measured improvement** (re-measure, don't assume) → `/review` → `/ship`. 🔴 if it touches a hot or risky path. *Skips:* spec, plan.
- **Spike** — 🔴 **frame the scope/question** → explore (throwaway code, don't merge) → write findings to `docs/ideas/<x>.md` via `lucas-harness:idea-refine` → 🔴 **promote** (re-enter as a Feature) **or drop**. *Skips:* tests, verify, review, ship.
- **Chore** — make the change → `/test` + build (hand-written change bypasses `/build`'s loop, so `/test` is the explicit gate) → smoke-**verify** only if it touches a runtime dependency or config → ship-lite. 🔴 if it touches secrets, CI, deploy, or config. *Skips:* spec, plan, review. (Docs-only chores: invoke `lucas-harness:documentation-and-adrs` and skip the test step.)

## Two calibration rules (why steps get skipped)

1. **`/test` is redundant wherever a test loop already runs.** `/build`, `/build auto`, and `/code-simplify` each run RED→GREEN (or revert-on-fail) internally. Call `/test` explicitly **only** when the work *bypasses* those loops — a hand-written bug fix, a chore, a legacy backfill.
2. **"verify" is orthogonal to tests.** Add it wherever the ticket changes **observable runtime behavior**, regardless of whether tests ran — and omit it when nothing observable changes (most refactors).

## Human-in-the-middle (critical gates only)

Run autonomously between steps. Stop for a human **only** at: the 🔴 gates above (spec confirm, plan approval inside `/build auto`, ship GO/NO-GO, Epic split, Spike frame/promote-drop, Incident mitigate-first, Migration destructive-step), and the standard escalation triggers — auth/permissions, payments, destructive migrations, deletions, deploys, secrets, anything not undoable with `git revert`, unfixable test/build failures, ambiguous specs, or Critical security/review findings (NO-GO by default). These are enforced by `lucas-harness:doubt-driven-development` and the escalation list in `/build`; don't re-derive them.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The user typed `bug:`, so it's a Bug." | A type label is a hint, not authority. Classify from what the work actually entails — a "bug" that adds a capability is a Feature. |
| "I'll just run the full Feature flow to be safe." | Over-calibrating burns the user's time on spec/plan/ship steps a Chore or Task doesn't need. Right-sizing is the whole point. |
| "This vague goal is close enough to spec directly." | Raw intent that spans features or has no concrete change must go through Define first, or you'll spec the wrong thing. |
| "I can skip the human gate, the change looks safe." | The 🔴 gates and escalation triggers are non-negotiable. Auth, payments, destructive, and deploy steps stop for a human regardless of how safe they look. |
| "I'll write the artifacts now and branch later." | Feature artifacts must never land on `main`/`master`. Create the branch before the first artifact-producing step. |

## Red Flags

- Classifying from the typed label instead of the content of the work.
- Writing `docs/specs/<slug>/` artifacts while still on `main`/`master`.
- Forcing a non-actionable question or a raw goal straight into a build flow.
- Running spec/plan/test/ship steps the chosen type explicitly skips.
- Duplicating a skill's logic here instead of dispatching to it.
- Sailing past a 🔴 gate or an escalation trigger without stopping for a human.

## Verification

Before considering the routing complete, confirm:

- [ ] The input was triaged (non-actionable / raw intent / scoped change) before classifying.
- [ ] A single classification was stated in one line, with the user given a chance to override.
- [ ] A correctly-named branch exists before any feature artifact was written.
- [ ] Only the steps the chosen type calls for were run — skipped steps were genuinely skipped, not silently dropped.
- [ ] Every 🔴 gate and escalation trigger reached was surfaced to a human.
- [ ] Each dispatched step ran its own command/skill rather than re-implementing it here.

## Rules

1. Classification is a *recommendation* — always let the user override the type.
2. Never invent requirements. If a Feature/Epic ticket is too thin to classify or spec, ask before branching.
3. Preserve the branch-slug contract — create the branch before writing any `docs/specs/<slug>/` artifact; never write feature artifacts onto the trunk.
4. The router only dispatches; it does not duplicate skill logic. Each step's behavior lives in its command/skill.
5. When a ticket genuinely spans two types (e.g. a bug fix that also needs a perf pass), run the flows in sequence rather than forcing one box.
