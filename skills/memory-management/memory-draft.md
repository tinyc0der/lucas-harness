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
> - cc-sdd kiro-steering + kiro-steering-custom skills — bootstrap vs. sync modes,
>   the Golden Rule (patterns not catalogs), bidirectional drift detection,
>   additive/preserve-user updates, ~100–200-line soft target, domain files
>   derived from codebase, don't-document-agent-tooling
>   (https://github.com/gotalab/cc-sdd)

## Problem Statement

How might we help an agent (in any vibe-coding tool, not just Claude Code) keep a
project's `docs/steering/` directory durable, relevant, and trustworthy — so future
sessions start from real knowledge instead of re-deriving it, without polluting
memory with unverified one-off assumptions?

## Recommended Direction

A tool-agnostic skill that owns one job: **route durable knowledge to the right
home and keep `docs/steering/` to only what the other artifacts don't already cover.**

The project separates durable knowledge into clear homes:

```
docs/project.md          → stable (but evolving) project contract, direction, constraints
docs/decisions/          → architecture decision records
docs/specs/<slug>/       → per-feature workflow lifecycle: spec → plan → memory delta → review → ship
docs/steering/           → durable cross-workflow knowledge that fits nowhere above (declarative)
docs/runbooks/           → repeatable operational procedures (imperative)
```

`docs/specs/<slug>/` IS the workflow folder — organized by feature rather than an
abstract workflow id. Each feature's folder holds its whole journey:

```
docs/specs/<slug>/
  spec.md          → intent converted to a spec
  plan.md          → task graph / task ledger
  memory-delta.md  → proposed durable updates discovered during this feature
  review.md        → review results
  ship.md          → launch / deployment record
```

`docs/steering/` is the residue. The skill's first move is always to ask "does
this belong in `docs/project.md`, `docs/decisions/`, this feature's spec folder,
or `docs/runbooks/` instead?" — and only route it to `docs/steering/` when the
answer is no.

The skill rests on two ideas from principles.md:

1. **The three-tier model** — Session memory → Workflow state → Project memory.
   In this layout, workflow state lives in `docs/specs/<slug>/`. Knowledge is
   *promoted* up this chain only when it is useful, scoped, evidence-backed, and
   reviewable. Most session context should never become project memory. The
   promotion test: *"would a future feature with nothing to do with this one
   still need this fact?"* — if yes, route it to its canonical durable home; if
   no, it stays in the spec folder.

2. **The memory-delta → PR pattern** — Discovered knowledge lands in the feature's
   `docs/specs/<slug>/memory-delta.md` during the work. At closeout each verified
   item is promoted only after a GO decision. Resolve repository-versus-package
   scope first, then route by type to that memory root's `project.md`,
   `decisions/`, `steering/`, or `runbooks/` through a git branch + PR. Record a
   disposition for every candidate rather than silently dropping it. A NO-GO
   leaves the delta unpromoted. The PR *is* the review and provenance trail — git
   already gives diff, history, and approval, so no hand-rolled
   `proposed-updates/` queue is needed. Nothing becomes durable memory without
   passing through a reviewable change.

## What steering/ Should Capture (and not)

| Goes elsewhere | Belongs in steering/ |
|---|---|
| Product direction → `docs/project.md` | Conventions the code follows but no doc states |
| Architecture decisions → `docs/decisions/` | Build / test / verify commands and env quirks |
| Feature requirements → `docs/specs/<slug>/` | Known risks and fragile areas found while working |
| Per-feature lifecycle → `docs/specs/<slug>/` | Recurring failure modes |
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

**The Golden Rule: capture patterns, not catalogs (cc-sdd).** *"If new code that
follows existing patterns wouldn't require updating memory, the pattern is
captured well."* Document the principle that guides decisions, not an inventory a
session could re-derive by looking. Bad: list every file in the tree. Good:
"feature-first organization — each feature owns its components, hooks, and tests
under `features/<name>/`." A catalog goes stale on every commit; a pattern
survives. This is also the sharpest *capture test* — if a fact is just an
enumeration of what's already visible in the code, it doesn't belong in memory.

## Always-Loaded Core vs. Load-on-Demand

Split memory into two tiers (adapted from Letta's `initializing-memory`):

- **Always-loaded core** — `docs/project.md` plus `docs/steering/index.md`,
  `docs/decisions/index.md`, and `docs/runbooks/index.md`. Small, durable, read at
  the start of every session: the project's identity plus maps of everything else.
- **Load-on-demand** — the rest of `docs/steering/`, `docs/decisions/`, and
  `docs/runbooks/`. Pulled in only when an index says the current task needs it.

This split is what makes progressive disclosure work: the core is cheap enough to
always load, and it carries enough signal to decide what *not* to load.

## Suggested steering/ Layout

**Organize by domain, not by knowledge-type.** A file is a *domain*, not a
category of fact. Auth's conventions, risks, and lessons live together in
`auth.md` — not scattered across a `conventions.md` + `risks.md` + `lessons.md`.
Both Kiro and Letta organize this way; retrieval is by *what you're working on*.
A `risks.md` collecting risks from every domain is a dumping ground that breaks
one-domain-per-file and conditional loading. There is **no** catch-all `risks.md`
or `lessons.md`.

```
docs/steering/       → declarative durable knowledge
  index.md          → compact summaries + discovery paths (always loaded)

  # cross-cutting type files — only for genuinely project-wide knowledge:
  conventions.md    → global rules (naming, no default exports, imports)
  commands.md       → build / test / verify / deploy commands + env quirks
  preferences.md    → team working preferences

  # domain files — the default home; each holds its own conventions,
  # risks, lessons; nests as it grows:
  auth.md           → auth/session.md → auth/session/fixation.md
  billing.md
  api.md
  testing.md

docs/runbooks/       → sibling top-level home for imperative procedures
  index.md
  deploy.md
  rollback.md
  incident-db-failover.md
```

**Routing rule:** domain-specific knowledge → its domain file; only knowledge with
no single domain → a cross-cutting type file. **Lead each file with its *why*** (a
philosophy/rationale line, per Kiro) before specifics.

**Runbooks are memory's *imperative* half — a top-level home, not a `steering/`
subfolder.** Most of memory is declarative (facts, conventions, lessons) and lives
in `steering/`; a runbook is an ordered, executable procedure for a recurring
operation. It's durable and cross-workflow, owned by no spec or ADR, but distinct
in *shape* from declarative knowledge — so it sits in a sibling `runbooks/`
directory alongside `docs/steering/` and `docs/decisions/`. Two rules keep them honest:

- **Link, don't restate** — a runbook references the actual scripts, CI config,
  and `commands.md` rather than copying command text that will drift. One
  canonical location per fact.
- **Runbooks are a promotion target from lessons** — after an incident, a lesson
  ("DB failover needs X") graduates into a runbook *step*. This extends the
  promotion chain: delta → lesson → (when procedural and recurring) runbook.

Kiro's domain templates are a good guide for which domains commonly earn a file —
each is a *domain*, not a knowledge-type: `api-standards.md`, `testing.md`,
`security.md`, `database.md`, `authentication.md`, `error-handling.md`,
`deployment.md`. Each opens with a `## Philosophy` line (the why) before patterns.

Note: Kiro's foundational trio (`product.md`/`tech.md`/`structure.md`) is **not**
adopted — it overlaps `docs/project.md` and `docs/decisions/`, which already own product
direction, stack, and architecture decisions in our layout.

(In this project, `product.md`/`tech.md`/`structure.md` overlap with `project.md`
and `docs/decisions/` — prefer those homes and reserve `docs/steering/` for the
domain files that have no other home.)

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

The only hard threshold is a *floor* (merge tiny files), not a ceiling. As a
*soft* calibration, cc-sdd targets ~100–200 lines per file (a 2–3 minute read):
treat that as a smell, not a rule — a file drifting well past it is a hint to
check for a second concept, but a cohesive single-topic file that runs long is
fine. Split by concept, never because a line count tripped.

**Hierarchical `/` naming, depth over breadth.** Nest related topics rather than
spreading flat top-level files. Three levels:

| Depth | Example | Use for |
|---|---|---|
| 1 | `auth.md` | a domain (also acts as that domain's index once nested) |
| 2 | `auth/session.md` | a sub-topic within the domain |
| 3 | `auth/session/fixation.md` | a specific detail |

Good: `auth/session/fixation.md`. Bad: `auth_session_risk.md` (flat,
underscores). Start flat; nest a domain only once its content justifies it.

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

## Two Modes: Bootstrap and Sync (cc-sdd)

The skill has two operational modes, detected by the state of the durable core:

- **Bootstrap** (`docs/project.md` or any of `docs/steering/index.md`,
  `docs/decisions/index.md`, and `docs/runbooks/index.md` is missing) — generate
  or repair the core by *analyzing the codebase*: README, configs, dependency
  manifests, and directory structure. Extract the patterns (per the Golden
  Rule), don't interrogate the user for what the code already shows. Research
  areas (product, tech, structure, domain patterns) are independent and can run
  in parallel.
- **Sync** (the durable core exists) — reconcile memory against the current code
  and propose updates. This is the ongoing maintenance loop and where most
  triggers below fire.

**Sync is bidirectional drift detection:**
- **Memory → Code**: an entry references something that no longer exists → a
  *prune candidate* (warn, don't auto-delete).
- **Code → Memory**: a pattern the code now follows that memory doesn't mention →
  an *update candidate*.

**Updates are additive; user-written content is sacred.** A sync proposes
*additions* and *supersessions* through review — it never silently overwrites a
human-authored entry. When in doubt, add rather than replace.

## Triggers (when the skill runs)

This is **one skill** covering both saving and pruning — pruning is a trigger,
not a separate process.

- A feature gets a GO ship decision → review `docs/specs/<slug>/memory-delta.md`,
  resolve scope, route each verified item to its canonical home, record every
  disposition, and promote the accepted set in **one batched PR** (not a PR per
  fact). A NO-GO leaves the delta unpromoted. Memory entries **link** to
  `docs/specs/<slug>/review.md` for evidence rather than copying it — the spec
  folder is kept permanently.
- The user corrects behavior or states a preference → capture it as evidence-backed.
- A failure is verified and reproducible → record the failure mode.
- A session starts and feels familiar → load the four-file core, then only the
  *relevant* memory via its indexes.
- Memory looks stale or contradicts the live codebase → **prune**: update,
  supersede, or remove (same skill, same branch + PR flow).

**Prune for wrongness, not size.** Pruning targets the *stale, wrong, or
superseded* — never the merely large or rarely-touched. A stable preference that
is read once a month still earns its place; deleting it to shrink the file is the
*opposite* failure from sprawl, and lost specificity is harder to recover than a
few extra tokens cost. Do not collapse distinct topics just to reduce file count.

## Key Assumptions to Validate

- [ ] Agents will actually consult the steering, decisions, and runbooks indexes
      before loading leaf files, rather than reading everything (test by checking
      session-start behavior).
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

- **Not re-storing project.md / decisions / specs content** — duplication is the main
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
- **Not catalogs** — capture the pattern that guides decisions, not an inventory
  of files/dependencies a session could re-derive by looking (the Golden Rule).
- **Not the agent's own scaffolding** — `.claude/`, `.cursor/`, `.gemini/` and
  other agent-tooling dirs are not project knowledge; don't memorialize them.
- **Not a duplicate of an existing memory file** — before creating a new domain
  file, check it doesn't overlap one that exists; extend the existing one instead.

## Resolved Decisions

- **`project.md` evolves** → memory must flag significant drift from the contract
  so future sessions reconcile instead of trusting a stale assumption.
- **One skill, not two** → saving and pruning are the same skill; pruning is a
  trigger, not a separate process.
- **Promote via branch + PR, not a staging folder** → memory changes go through a
  reviewable git change; git provides diff, history, provenance, and approval.
- **`docs/specs/<slug>/` is kept permanently** → memory *links* to
  `docs/specs/<slug>/review.md` for evidence rather than copying it; one canonical
  source, no duplication.
- **One batched PR at feature ship, not per-fact** → all of a feature's verified
  lessons land in a single reviewable change; keeps friction low without losing
  reviewability.
