# Memory Management Skill — Draft

> Sources:
> - principles.md (Core Model, "Give each project its own memory", Memory freshness)
> - Letta `initializing-memory` skill + memory subagent — progressive disclosure,
>   always-loaded core vs. load-on-demand, retention over compression, File
>   Granularity (hierarchical `/` naming, depth over breadth, split/merge by
>   signal not line cap, merge files under ~20 lines, "Related files" sections)
>   (https://www.skills.sh/letta-ai/letta-code/initializing-memory)
> - Kiro steering docs — domain-split artifact catalog, one-domain-per-file,
>   "explain the why" behind standards
>   (https://kiro.dev/docs/steering/)

## Problem Statement

How might we help an agent (in any vibe-coding tool, not just Claude Code) keep a
project's `memory/` directory durable, relevant, and trustworthy — so future
sessions start from real knowledge instead of re-deriving it, without polluting
memory with unverified one-off assumptions?

## Recommended Direction

A tool-agnostic skill that owns one job: **route durable knowledge to the right
home and keep `memory/` to only what the other artifacts don't already cover.**

The project separates durable knowledge into clear homes:

```
project.md         → stable (but evolving) project contract, direction, constraints
adrs/              → architecture decision records
specs/<feature>/   → per-feature workflow lifecycle: intent → spec → plan → review → ship
memory/            → durable cross-workflow knowledge that fits nowhere above
```

`specs/<feature>/` IS the workflow folder — organized by feature rather than an
abstract workflow id. Each feature's folder holds its whole journey:

```
specs/<feature>/
  intent.md        → approved user contract (goal, success criteria)
  spec.md          → intent converted to a spec
  plan.md          → task graph / task ledger
  review.md        → review results
  ship.md          → launch / deployment record
  memory-delta.md  → proposed memory updates discovered during this feature
  ...
```

`memory/` is the residue. The skill's first move is always to ask "does this
belong in project.md, an ADR, or this feature's spec folder instead?" — and only
promote to `memory/` when the answer is no.

The skill rests on two ideas from principles.md:

1. **The three-tier model** — Session memory → Workflow state → Project memory.
   In this layout, workflow state lives in `specs/<feature>/`. Knowledge is
   *promoted* up this chain only when it is useful, scoped, evidence-backed, and
   reviewable. Most session context should never become project memory. The
   promotion test: *"would a future feature with nothing to do with this one
   still need this fact?"* — if yes, promote to `memory/`; if no, it stays in the
   spec folder.

2. **The memory-delta → PR pattern** — Discovered knowledge lands in the feature's
   `specs/<feature>/memory-delta.md` during the work. At closeout it is promoted
   to `memory/` via a git branch + PR, not by writing durable memory in place.
   The PR *is* the review and provenance trail — git already gives diff, history,
   and approval, so no hand-rolled `proposed-updates/` queue is needed. Nothing
   becomes durable memory without passing through a reviewable change.

## What memory/ Should Capture (and not)

| Goes elsewhere | Belongs in memory/ |
|---|---|
| Product direction → `project.md` | Conventions the code follows but no doc states |
| Architecture decisions → `adrs/` | Build / test / verify commands and env quirks |
| Feature requirements → `specs/<feature>/` | Known risks and fragile areas found while working |
| Per-feature lifecycle → `specs/<feature>/` | Recurring failure modes |
| | Lessons from completed features (tried X, failed because Y) |
| | User/team working preferences too informal for a spec |

Because `project.md` evolves, memory should also note *significant drift* — when
the working reality has moved away from the current contract — so the next session
knows to reconcile rather than trust a stale assumption.

**ADR vs. memory boundary:** a deliberate architecture choice gets an ADR; an
observed gotcha or failure with no formal decision attached is a memory lesson.
Memory *links* to the ADR rather than restating it.

**Every entry explains its *why*, not just its *what*.** A rule without its
rationale can't be re-evaluated — a future session can't tell when it stopped
applying. "Use `cn()` for classNames" is weaker than "Use `cn()` for classNames —
hand-concatenation caused duplicate-class bugs in #142." The why is also the
evidence (provenance from principles.md) and the staleness check (when the why no
longer holds, prune the rule).

## Always-Loaded Core vs. Load-on-Demand

Split memory into two tiers (adapted from Letta's `initializing-memory`):

- **Always-loaded core** — `project.md` + `memory/index.md`. Small, durable,
  read at the start of every session. Identity of the project + a map of what
  else exists.
- **Load-on-demand** — the rest of `memory/`. Pulled in only when the index says
  the current task needs it.

This split is what makes progressive disclosure work: the core is cheap enough to
always load, and it carries enough signal to decide what *not* to load.

## Suggested memory/ Layout

```
memory/
  index.md          → compact summaries + discovery paths, not just a file list
  overview.md       → durable project summary
  conventions.md    → naming, file org, import patterns, anti-patterns
  commands.md       → build / test / verify / deploy commands + env quirks
  risks.md          → known fragile areas, failure modes
  lessons.md        → evidence-backed lessons from completed features
  preferences.md    → user/team working preferences
  runbooks/         → imperative, step-by-step operational procedures
    deploy.md
    rollback.md
    incident-db-failover.md
```

**Runbooks are memory's *imperative* half.** Most of memory is declarative (facts,
conventions, lessons); a runbook is an ordered, executable procedure for a
recurring operation. It's durable and cross-workflow, owned by no spec or ADR — so
it belongs in `memory/`, nested under `runbooks/`. Two rules keep them honest:

- **Link, don't restate** — a runbook references the actual scripts, CI config,
  and `commands.md` rather than copying command text that will drift. One
  canonical location per fact.
- **Runbooks are a promotion target from lessons** — after an incident, a lesson
  ("DB failover needs X") graduates into a runbook *step*. This extends the
  promotion chain: delta → lesson → (when procedural and recurring) runbook.

As the project grows, split by domain rather than letting files sprawl — Kiro's
steering catalog is a good guide for what tends to deserve its own file:

- `product.md` — product purpose, target users, key features, business goals
- `tech.md` — frameworks, libraries, tools, technical constraints
- `structure.md` — file organization, naming conventions, import patterns
- `api-standards.md` — REST conventions, error formats, auth flows, versioning
- `testing-standards.md` — test patterns, mocking, coverage expectations
- `code-conventions.md` — naming, import ordering, preferred structures, anti-patterns
- `security-policies.md` — auth requirements, validation, input sanitization
- `deployment-workflow.md` — build, env config, deploy steps, rollback, CI/CD

(In this project, `product.md`/`tech.md`/`structure.md` overlap with `project.md`
and `adrs/` — prefer those homes and reserve `memory/` for the domain files that
have no other home.)

**One domain per file.** Three sources agree (Kiro "focus", Letta "do not
collapse distinct topics", principles.md indexed memory): a file covers exactly
one concern. Don't merge unrelated topics to cut file count, and don't let one
file accumulate several. This is what keeps the index and pruning clean.

### File Granularity (Letta)

Letta's memory-defrag subagent gives the operational rules for how files split,
nest, and merge. Optimize for *clarity and retrieval*, with **no hard file-count
target**.

**Size: split and merge by signal, not by a line cap.** *"Avoid arbitrary limits;
prioritize clarity, low redundancy, and easy retrieval."*

- **Split** a file when it holds 2+ distinct concepts, or has grown hard to scan.
- **Merge** files when they overlap, or when one is too small to stand alone
  (the one concrete number: **under ~20 lines**).

The only hard threshold is a *floor* (merge tiny files), not a ceiling. Resist
splitting a cohesive single-topic file just because it got long.

**Hierarchical `/` naming, depth over breadth.** Nest related topics rather than
spreading flat top-level files. Three levels:

| Depth | Example | Use for |
|---|---|---|
| 1 | `project.md` | index files only |
| 2 | `project/tooling.md` | main topic areas |
| 3 | `project/tooling/bun.md` | specific details |

Good: `risks/auth/session-fixation.md`. Bad: `auth_session_risk.md` (flat,
underscores). Prefer a 3-level hierarchy over many top-level files.

**Each parent lists its children in a "Related files" section** — this is how
progressive disclosure threads through the hierarchy, and it's the per-level
equivalent of the top-level `index.md`.

**One canonical location per fact** — reference, don't duplicate. A shared fact
lives in one file; others link to it.

**Defrag is one of three actions per file:** SPLIT (multi-concept → nested
files), MERGE (overlap or <20 lines → consolidate, delete originals), or
KEEP+CLEAN (already focused → add structure, dedupe, resolve contradictions).

**`index.md` does real work.** It is not a table of contents — it carries a
one-line summary per topic plus the path to the full file, so a session can often
answer a question from the index alone and only open the full file when it needs
detail. *Surface context at the level the moment requires.*

No `proposed-updates/` directory: memory changes are reviewed as a git branch +
PR, so git holds the staging, diff, and provenance. The exact files can flex per
project; the principle does not — memory must be explicit, indexed, and readable
by a future session.

## Triggers (when the skill runs)

This is **one skill** covering both saving and pruning — pruning is a trigger,
not a separate process.

- A feature ships → promote its `memory-delta.md` to `memory/` in **one batched
  PR** (all the feature's verified lessons in a single reviewable change, not a PR
  per fact). Memory entries **link** to `specs/<feature>/review.md` for evidence
  rather than copying it — the spec folder is kept permanently.
- The user corrects behavior or states a preference → capture it as evidence-backed.
- A failure is verified and reproducible → record the failure mode.
- A session starts and feels familiar → load only the *relevant* memory via index.
- Memory looks stale or contradicts the live codebase → **prune**: update,
  supersede, or remove (same skill, same branch + PR flow).

**Prune for wrongness, not size.** Pruning targets the *stale, wrong, or
superseded* — never the merely large or rarely-touched. A stable preference that
is read once a month still earns its place; deleting it to shrink the file is the
*opposite* failure from sprawl, and lost specificity is harder to recover than a
few extra tokens cost. Do not collapse distinct topics just to reduce file count.

## Key Assumptions to Validate

- [ ] Agents will actually consult `memory/index.md` before loading files, rather
      than reading everything (test by checking session-start behavior).
- [ ] The ADR-vs-lesson boundary is clear enough that agents route consistently.
- [ ] A branch + PR per memory change isn't too heavy for fast/solo workflows
      (fallback: batch deltas, one PR at feature ship rather than per-fact).
- [ ] Tool-agnostic instructions are still actionable without a "how to persist"
      mechanism for each tool (git is the common substrate; verify every target
      tool sits on git).

## MVP Scope

**In:** the routing rule (right home for knowledge), the what-to-capture table,
the trigger list, and the delta → branch + PR promotion pattern — written
tool-agnostically.

**Out:** tool-specific persistence mechanics, a machine-readable `memory.json`
schema, and automated audit tooling. Describe the audit *behavior*, not a script.

## Not Doing (and Why)

- **Not re-storing project.md / adrs / specs content** — duplication is the main
  failure mode; memory captures the gaps between those docs.
- **Not a Claude-Code-only design** — no hardcoded `~/.claude` paths or the
  global user/feedback/project/reference taxonomy; the skill must run anywhere.
- **Not silent learning** — no memory from unverified assumptions or one-off
  behavior; every entry is evidence-backed and reviewable.
- **Not one giant memory file** — sessions get only relevant memory via the index.
- **Not a hand-rolled staging queue** — git branch + PR is the review mechanism,
  not a `proposed-updates/` folder.
- **Not over-compression** — memory hygiene is two-sided. Aggressively collapsing
  topics or dropping stable-but-rare facts to shrink memory is as much a failure
  as sprawl. Prune wrongness; preserve specificity.

## Resolved Decisions

- **`project.md` evolves** → memory must flag significant drift from the contract
  so future sessions reconcile instead of trusting a stale assumption.
- **One skill, not two** → saving and pruning are the same skill; pruning is a
  trigger, not a separate process.
- **Promote via branch + PR, not a staging folder** → memory changes go through a
  reviewable git change; git provides diff, history, provenance, and approval.
- **`specs/<feature>/` is kept permanently** → memory *links* to
  `specs/<feature>/review.md` for evidence rather than copying it; one canonical
  source, no duplication.
- **One batched PR at feature ship, not per-fact** → all of a feature's verified
  lessons land in a single reviewable change; keeps friction low without losing
  reviewability.
