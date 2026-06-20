---
description: Route any incoming ticket to its correctly-calibrated flow — classify Epic/Feature/Task/Bug/Improvement/Spike/Chore, then dispatch existing commands, stopping for a human only at critical gates.
---

`/ultra` is a **router**, not a new workflow. It reads the ticket in `$ARGUMENTS`, classifies it, sets up the branch, then dispatches the existing commands and skills in the calibration that fits that ticket type. It adds no new mechanics — every step below is an existing `/command` or `lucas-harness:<skill>`. The win is *picking the right flow* and *skipping the steps that type doesn't need*, while still stopping for a human at the genuinely critical gates.

## Step 1 — Classify (explicit and overridable)

Classify from the **content** of the ticket — judge what the work actually entails, not any type label the user typed. A prefix like `bug:` is a hint at most, never authoritative: a ticket tagged "bug" that adds a new capability is a **Feature**, and one tagged "task" that needs a destructive migration escalates. Match the description against the signals below, then **state your classification in one line and proceed**; the user can correct it. When the content genuinely fits two types, ask.

| Type | Signal |
|------|--------|
| **Epic** | Spans multiple shippable features/surfaces; "build an X system"; too big for one spec. |
| **Feature** | One net-new user-facing capability worth a spec; a single shippable unit. |
| **Task** | A small, well-defined slice of an already-specced feature; no spec of its own. |
| **Bug** | Something is broken, incorrect, or regressed; a reproducible defect. |
| **Improvement · refactor** | Change internal structure *without* changing behavior ("clean up", "simplify", "refactor"). |
| **Improvement · perf** | Make existing behavior faster/lighter ("slow", "optimize", "latency", "memory"). |
| **Spike** | Open question or research ("investigate", "explore", "prototype to learn"); throwaway. |
| **Chore** | Maintenance with no user-facing runtime change (deps bump, config, CI, tooling, version, formatting). |

## Step 2 — Set up the branch (preserve the slug contract)

All per-feature artifacts live at `docs/specs/<slug>/`, where `<slug>` is the current git branch name (see the Workflow Artifacts map in the `context-engineering` skill). **Never write feature artifacts onto `main`/`master`.** Create the branch *before* any artifact-producing step:

- Feature → `feature/<x>` · Task → parent branch or `task/<x>` · Bug → `fix/<x>` · Refactor → `improve/<x>` · Perf → `perf/<x>` · Spike → `spike/<x>` (throwaway) · Chore → `chore/<x>`
- Epic → no single branch; each child feature gets its own `feature/<x>` (see below).

## Step 3 — Dispatch the calibrated flow

Throughout, **"verify"** means: run the app and observe the changed runtime behavior — invoke `lucas-harness:browser-testing-with-devtools` for browser surfaces, otherwise smoke-test the app directly. It is distinct from `/test` (unit/integration tests) and from `/ship`'s static review fan-out. 🔴 marks a deliberate human gate.

- **Epic** — `lucas-harness:interview-me` → write intent to `docs/intent/<topic>.md` → 🔴 **approve the split** into features → run the **Feature** flow below for each child feature on its own branch → finish with an integration **verify** across the assembled features. *Skips:* one mega spec/plan/ship.
- **Feature** — `/spec` (🔴 confirm spec) → `/build auto` (🔴 approve plan — the gate lives inside `build auto`) → **verify** if the ticket has runtime surface → `/ship` (🔴 GO/NO-GO). *Skips:* `/plan` and `/test` — both run inside `/build auto`.
- **Task** — `/build` (single task) → **verify** if it has runtime surface. The child rides the parent feature's `/ship`. *Skips:* spec, plan, `/test`, full ship. No human gate unless an escalation trigger fires.
- **Bug** — reproduce with a failing test via `lucas-harness:debugging-and-error-recovery` / `/test` (Prove-It; the failing test *is* the spec) → fix → **verify** (always — a bug is an observable defect) → `/review` if the root cause is risky → ship (🔴 if it's a hotfix). *Skips:* spec, plan. Here `/test` is correct: the fix is hand-written and bypasses `/build`'s loop.
- **Improvement · refactor** — ensure tests guard the current behavior first (add via `/test` if missing) → `/code-simplify` (it runs the test loop internally) → `/review` → ship-lite. *Skips:* spec, plan, a separate `/test` pass, and **verify** — unless the change turns out to alter behavior, in which case verify.
- **Improvement · perf** — capture a baseline measurement → `lucas-harness:performance-optimization` (or `/webperf` for web surfaces) → **verify the measured improvement** (re-measure, don't assume) → `/review` → `/ship`. 🔴 if it touches a hot or risky path. *Skips:* spec, plan.
- **Spike** — 🔴 **frame the scope/question** → explore (throwaway code, don't merge) → write findings to `docs/ideas/<x>.md` via `lucas-harness:idea-refine` → 🔴 **promote** (re-enter as a Feature) **or drop**. *Skips:* tests, verify, review, ship.
- **Chore** — make the change → `/test` + build (hand-written change bypasses `/build`'s loop, so `/test` is the explicit gate) → smoke-**verify** only if it touches a runtime dependency or config → ship-lite. 🔴 if it touches secrets, CI, deploy, or config. *Skips:* spec, plan, review.

## Two calibration rules (why steps get skipped)

1. **`/test` is redundant wherever a test loop already runs.** `/build`, `/build auto`, and `/code-simplify` each run RED→GREEN (or revert-on-fail) internally. Call `/test` explicitly **only** when the work *bypasses* those loops — a hand-written bug fix, a chore, a legacy backfill.
2. **"verify" is orthogonal to tests.** Add it wherever the ticket changes **observable runtime behavior**, regardless of whether tests ran — and omit it when nothing observable changes (most refactors).

## Human-in-the-middle (critical gates only)

Run autonomously between steps. Stop for a human **only** at: the 🔴 gates above (spec confirm, plan approval inside `/build auto`, ship GO/NO-GO, Epic split, Spike frame/promote-drop), and the standard escalation triggers — auth/permissions, payments, destructive migrations, deletions, deploys, secrets, anything not undoable with `git revert`, unfixable test/build failures, ambiguous specs, or Critical security/review findings (NO-GO by default). These are enforced by `lucas-harness:doubt-driven-development` and the escalation list in `/build`; don't re-derive them.

## Rules

1. Classification is a *recommendation* — always let the user override the type.
2. Never invent requirements. If a Feature/Epic ticket is too thin to classify or spec, ask before branching.
3. Preserve the branch-slug contract — create the branch before writing any `docs/specs/<slug>/` artifact; never write feature artifacts onto the trunk.
4. The router only dispatches; it does not duplicate skill logic. Each step's behavior lives in its command/skill.
5. When a ticket genuinely spans two types (e.g. a bug fix that also needs a perf pass), run the flows in sequence rather than forcing one box.
