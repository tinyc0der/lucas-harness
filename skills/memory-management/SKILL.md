---
name: memory-management
description: Organizes a project's durable memory so future sessions start from real knowledge instead of re-deriving it. Routes each fact to the right home (project.md, ADRs, spec folders, or steering/), promotes lessons through review, and keeps memory pruned and trustworthy. Use whenever a feature ships, the user states a durable preference or correction, a failure is diagnosed, or memory looks stale, sprawling, or contradicts the code — even if the user doesn't say the word "memory." Also use when setting up a project's steering/ directory or deciding where a piece of knowledge belongs.
---

# Memory Management

## Overview

A project should get faster to work in over time. Every session, feature, fix, and failure leaves behind knowledge — but most of it dies when the session ends, so the next session re-derives it from scratch. Memory management fixes that: it captures the *durable* knowledge, routes it to a home where future sessions will actually find it, and keeps it from rotting.

The core skill is **knowing what to keep and where to put it.** Memory is not a dumping ground for everything that happened — it's the small, curated set of facts a future session genuinely needs and could not quickly re-derive. Save too little and the agent hallucinates project conventions; save too much (or save wrong things) and the signal drowns in noise.

This skill is **tool-agnostic**. It assumes a git-backed project but makes no assumptions about Claude Code, Cursor, or any specific tool's memory mechanism. Git is the common substrate: durable memory lives in tracked files, and changes to it go through reviewable commits. The one place it touches the tool layer is a thin *pointer* in the agent's rules file (`CLAUDE.md`/`AGENTS.md`/…) that signposts memory's location — never a copy of it (see Bootstrap).

## When to Use

Trigger this skill — even when the user doesn't say "memory":

- **A feature ships.** Promote what was learned during the work into durable memory.
- **The user states a durable preference or corrects you** in a way that should outlive this session ("we always run migrations in a transaction", "don't use default exports here").
- **A failure is diagnosed and reproducible.** The failure mode and its cause are worth keeping.
- **A session starts and feels familiar** — load the relevant memory rather than re-exploring.
- **Memory looks stale, sprawling, or wrong** — it contradicts the current code, or files have grown unscannable. Pruning and reorganizing is part of this skill, not a separate one.
- **Setting up a project's `steering/` directory** for the first time (Bootstrap mode — derive it from the codebase), or deciding where a new piece of knowledge belongs.

If a piece of knowledge only matters to the current conversation, it does **not** belong in memory. Memory is for what survives the session.

## A Note on Terms: Memory vs. `steering/`

**Memory** is the whole durable-knowledge system — `project.md`, `adrs/`, the shipped `specs/` history, and the `steering/` directory together. It is the concept this skill manages.

**`steering/`** is one part of that system: the directory holding durable knowledge that has no more specific home. It used to be called `memory/`; it's renamed to `steering/` precisely so "memory" can keep its broader meaning without the directory name colliding with it.

So: *memory* = the system; *`steering/`* = the residue directory inside it.

## The Mental Model: Three Tiers

Knowledge lives at one of three levels, and only earns promotion upward when it's useful, scoped, evidence-backed, and reviewable:

```
Session memory   → what this agent has in context right now (most of it is disposable)
Workflow state   → task-specific state for one feature        (lives in docs/specs/<feature>/)
Project memory   → durable knowledge reused across features   (docs/project.md, docs/adrs/, docs/steering/)
```

The promotion test for project memory: **"Would a future feature that has nothing to do with this one still need this fact?"** If yes, it belongs in durable memory — and if it has no more specific home, in `steering/`. If no, it stays in the feature's workflow state and dies with it (which is fine).

## Where Knowledge Lives

Durable memory is separated into homes. The skill's first move is always to ask *"does this belong somewhere more specific?"* and only land in `steering/` when the answer is no.

**All durable-memory artifacts are rooted under `docs/`** — that is the artifacts location for this project. The paths below (and the shorthand `steering/`, `adrs/`, etc. used throughout this skill) are all relative to `docs/`.

```
docs/project.md         → stable (but evolving) project contract, direction, constraints
docs/adrs/              → architecture decision records (deliberate, dated decisions); adrs/index.md maps them
docs/specs/<feature>/   → one feature's full lifecycle: intent → spec → plan → review → ship
docs/steering/          → durable cross-workflow knowledge that fits nowhere above (declarative)
docs/runbooks/          → repeatable operational procedures (imperative); runbooks/index.md maps them
```

Each residue directory — `docs/steering/`, `docs/adrs/`, and `docs/runbooks/` — carries its own `index.md`: a compact map (one-line summary + path per entry) so a session can find the right file without reading the whole directory.

`steering/` and `runbooks/` are siblings that split durable knowledge by *shape*: `steering/` holds **declarative** facts (what's true — conventions, risks, lessons), and `runbooks/` holds **imperative** procedures (what to do — deploy, rollback, incident response). They share the same lifecycle (durable, synced, promoted, reviewed); the split is just declarative-vs-imperative.

`steering/` is the **residue** — the institutional knowledge that lives *between* the other documents:

| Goes elsewhere | Belongs in `steering/` |
|---|---|
| Product direction → `project.md` | Conventions the code follows but no doc states |
| A deliberate architecture decision → `adrs/` | Build / test / verify / deploy commands and env quirks |
| One feature's requirements → `specs/<feature>/` | Known risks and fragile areas found while working |
| A step-by-step operational procedure → `runbooks/` | Recurring failure modes |
| | Lessons from completed features ("tried X, failed because Y") |
| | User/team working preferences too informal for a spec |

**ADR vs. memory lesson:** a *deliberate* architecture choice gets an ADR; an *observed* gotcha or failure with no formal decision attached is a memory lesson. Memory links to the ADR rather than restating it.

**`project.md` evolves**, so memory should also flag *significant drift* — when working reality has moved away from the stated contract — so the next session reconciles rather than trusting a stale assumption.

## The Cardinal Rule: Explain the Why

Every memory entry records **why it's true, not just what it says.** A rule without its rationale can't be re-evaluated — a future session can't tell when it has stopped applying, so it either follows a dead rule or distrusts a live one.

```
Weak:    Use cn() for conditional classNames.
Strong:  Use cn() for conditional classNames — hand-concatenation caused
         duplicate-class bugs in #142.
```

The "why" does triple duty: it's the **rationale** (so the rule can be applied with judgment), the **evidence/provenance** (so it's trustworthy), and the **staleness check** (when the why no longer holds, prune the rule). This is also why silent learning is banned — a memory entry must trace to a completed feature, an accepted decision, a verified failure, or a user-approved preference. Never write memory from an unverified assumption or a one-off behavior.

## The Golden Rule: Capture Patterns, Not Catalogs

The test for whether something belongs in memory at all: **if new code that follows the existing pattern wouldn't require a memory update, the pattern is captured well.** Document the principle that guides decisions — not an inventory a future session could re-derive just by looking at the code.

```
Catalog (bad):  components/Button.tsx, components/Card.tsx, components/Modal.tsx,
                hooks/useAuth.ts, hooks/useCart.ts ... (goes stale every commit)
Pattern (good): Feature-first organization — each feature owns its components,
                hooks, and tests under features/<name>/. Shared primitives live
                in components/ui/.
```

A catalog rots on every commit and adds nothing a `ls` couldn't show; a pattern survives and encodes judgment. When you catch yourself enumerating what's already visible in the tree, stop — capture the rule behind the arrangement instead. This is also why memory is *derived from the codebase* during bootstrap, not invented: the patterns you record should be ones the code actually exhibits.

## Two Modes: Bootstrap and Sync

The skill operates in one of two modes, chosen by the state of `steering/`:

**Bootstrap** — `steering/` is empty or missing its core files. Generate the initial memory by *analyzing the codebase*: README, config and dependency files, directory structure, naming and import patterns. Extract patterns (per the Golden Rule), don't interrogate the user for what the code already shows. The research areas — product/direction, tech/stack, structure/conventions, and any domain patterns — are independent and can be gathered in parallel. Present the result for review before treating it as the source of truth.

**Bridge the agent's rules file to memory (pointer only).** After bootstrap writes the durable homes, add a short block to whichever rules file the project's agent already uses — `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.github/copilot-instructions.md`, etc. (detect the existing one; create `AGENTS.md` only if none exists and the user wants it). This block does **not** duplicate memory — it is a signpost so a fresh agent session discovers memory exists and knows where to look:

```markdown
## Project memory
Durable knowledge lives under `docs/`. Read these at session start:
- `docs/project.md` — project contract, direction, constraints
- `docs/steering/index.md` — conventions, risks, lessons (map)
- `docs/adrs/index.md` — architecture decisions (map)
- `docs/runbooks/index.md` — operational procedures (map)
Load individual files on demand via the indexes; don't inline their contents here.
```

Keep it to those pointers. The rules file is a *bridge*, not a second copy of memory — the canonical content stays in `docs/`, and this block is the one place the tool-specific layer touches the tool-agnostic memory system (**link, don't restate**). On Sync, refresh this block only if the set of top-level homes changes (e.g. a new `docs/runbooks/` appears); the indexes it points to absorb everything else.

**Sync** — `steering/` exists; keep it aligned with reality. This is the ongoing maintenance loop, and it works as **bidirectional drift detection**:

- **Memory → Code**: an entry references something that no longer exists (a deleted file, a removed tool, a dropped convention) → a **prune candidate**. Flag it; don't auto-delete.
- **Code → Memory**: a pattern the code now follows that memory doesn't capture yet → an **update candidate**.

**Sync updates are additive, and human-written content is sacred.** A sync proposes *additions* and explicit *supersessions* through review — it never silently overwrites an entry a person wrote. When in doubt, add rather than replace. (This is the same instinct as retention-over-compression, applied to maintenance.)

## How Memory Gets Saved: Delta → Review → Promote

Discovered knowledge does not get written straight into durable memory. It flows through review:

1. **During a feature**, candidate knowledge accumulates in `specs/<feature>/memory-delta.md` — a scratchpad. It is *not* durable memory yet; the feature might get reverted and take its "lessons" with it.
2. **At ship**, the verified deltas are promoted into `steering/` via a **single batched PR** (all of the feature's lessons in one reviewable change — not a PR per fact). The PR *is* the review and provenance trail: git already provides diff, history, and approval, so there's no need for a hand-rolled staging folder.
3. **Knowledge discovered outside a feature** (a standalone correction, a preference, an incident with no feature branch) skips the delta scratchpad and goes straight to a `steering/` edit + commit/PR.

The promotion chain for procedural knowledge extends one step further: **delta → lesson → runbook.** After an incident, a lesson ("DB failover needs X") that proves recurring and procedural graduates into a runbook *step*.

Memory entries **link** to `specs/<feature>/review.md` (and other permanent artifacts) for evidence rather than copying it — one canonical source, no duplication.

## How Memory Gets Loaded: Progressive Disclosure

Never load all of memory at once. Split it into two tiers:

- **Always-loaded core** — `docs/project.md` + the three directory indexes (`docs/steering/index.md`, `docs/adrs/index.md`, `docs/runbooks/index.md`). Small, durable, read at the start of every session. The project's identity plus a map of everything else.
- **Load-on-demand** — the rest of `docs/steering/`, `docs/adrs/`, and `docs/runbooks/`. Pulled in only when an index says the current task needs it.

Each `index.md` does real work — it is **not** a bare table of contents. It carries a one-line summary per entry plus the path to the full file, so a session can often answer a question from the index alone and only open the full file when it needs detail. *Surface context at the level the moment requires.*

## How Memory Is Organized: Organize by Domain, Not by Knowledge-Type

The single most important structural rule: **a file is a domain, not a category of fact.** When you work on auth, you want auth's conventions, its risks, and its past lessons *together* — so they belong in `auth.md`, not scattered across a `conventions.md`, a `risks.md`, and a `lessons.md`. Both Kiro and Letta organize this way, and the reason is retrieval: you look things up by *what you're working on*, not by what type of knowledge it is. A `risks.md` that collects risks from every domain is a dumping ground that violates one-domain-per-file and makes conditional loading impossible.

```
docs/steering/
  index.md          → compact summaries + discovery paths (always loaded)
  overview.md       → durable project summary (always loaded)

  # cross-cutting type files — only for genuinely project-wide knowledge
  # that has no single domain to live in:
  conventions.md    → global rules (naming, no default exports, import patterns)
  commands.md       → build / test / verify / deploy commands + env quirks
  preferences.md    → team working preferences

  # domain files — the default home; each holds ITS OWN conventions,
  # risks, and lessons, and nests as it grows:
  auth.md           → auth/session.md → auth/session/fixation.md
  billing.md
  api.md
  testing.md

docs/runbooks/      → sibling home for imperative procedures
  index.md          → compact summaries + discovery paths (always loaded)
  deploy.md
  rollback.md

docs/adrs/          → architecture decision records
  index.md          → compact summaries + discovery paths (always loaded)
  0001-....md
  0002-....md
```

**The routing rule that kills the ambiguity:** domain-specific knowledge goes in its domain file; only knowledge with *no single domain* goes in a cross-cutting type file. An auth token-lifetime rule → `auth.md`. A risk found in billing → `billing.md`. A truly project-wide rule like "no default exports" → `conventions.md`. There is no catch-all `risks.md` or `lessons.md`.

**Lead every file with its *why*.** Open a domain file with a one- or two-line philosophy/rationale before the specifics (Kiro structures every steering file this way). The why is what lets a future session apply the rules with judgment and know when they've stopped applying.

**One domain per file.** A file covers exactly one concern. Don't merge unrelated topics to cut file count, and don't let one file accumulate several — that's what keeps the index and pruning clean.

**Size by signal, not by a line cap.** There is no fixed ceiling — prioritize clarity and easy retrieval over arbitrary limits.
- **Split** a file when it holds 2+ distinct concepts, or has grown hard to scan.
- **Merge** files when they overlap, or when one is too small to stand alone (rule of thumb: under ~20 lines). This is the only hard threshold, and it's a *floor* — resist splitting a cohesive single-topic file just because it got long.
- As a *soft* calibration, ~100–200 lines (a 2–3 minute read) is a healthy size. Treat drift well past it as a smell worth checking for a second concept, not a rule that forces a split. Split by concept, never because a line count tripped.

**Start flat, nest as a domain grows.** A small project's `auth.md` is one file. When it gets big, decompose by topic — `auth.md → auth/session.md → auth/session/fixation.md` — and have the parent list its children in a **"Related files"** section (the per-level equivalent of the top-level index). Prefer depth over a sprawl of flat top-level files, but don't pre-build a deep hierarchy before the content justifies it. Good: `auth/session-fixation.md`. Bad: `auth_session_risk.md` (flat, underscored).

**Runbooks are memory's imperative half — their own top-level home.** Most of memory is declarative (facts, conventions, lessons) and lives in `steering/`; a runbook is an ordered, executable procedure for a recurring operation, so it sits in a sibling `runbooks/` directory rather than inside `steering/`. Keep them honest with one rule: **link, don't restate** — a runbook references the actual scripts, CI config, and `steering/commands.md` rather than copying command text that will drift.

## Pruning: Cut for Wrongness, Not Size

Memory hygiene is two-sided. Sprawl is one failure; **over-compression is the equal and opposite failure.**

Prune what is **stale, wrong, or superseded** — never what is merely large or rarely read. A stable preference consulted once a month still earns its place; deleting it to shrink a file destroys specificity that is far harder to recover than a few tokens are to carry. When you reorganize, the three actions per file are:

- **SPLIT** — a multi-concept file into focused, nested files (add a "Related files" section to the parent).
- **MERGE** — overlapping or tiny files into one (consolidate, dedupe, delete the originals).
- **KEEP + CLEAN** — an already-focused file: add structure, remove redundancy, resolve contradictions.

All of these are memory changes, so they go through the same commit/PR review as any other.

## Common Rationalizations

- *"I'll just remember this in the conversation."* — The conversation ends and the knowledge dies with it. If it's durable, write it down; if it's not durable, it doesn't belong in memory anyway.
- *"This might be useful someday, I'll save it just in case."* — Speculative memory is noise. Save what a future feature would *need*, not everything that *happened*. Apply the promotion test.
- *"I'll write the rule now and add the reasoning later."* — A rule without its why is unmaintainable from the moment it's written. The why is not optional polish; it's what makes the entry trustworthy and prunable.
- *"The file's getting long, I'll split it to be tidy."* — Length alone is not a reason to split. Split on *multiple concepts*, not on line count. A long single-topic file is fine.
- *"Memory is bloated, I'll trim the stuff nobody reads."* — Rarely-read ≠ stale. Prune for wrongness, not for size. You may be deleting the one fact that saves a future session hours.
- *"I'll just edit memory directly, the PR is overhead."* — The review is what keeps unverified assumptions out of durable memory. For a quick correction a single commit is fine, but the change must still be a reviewable diff, not a silent in-place mutation.
- *"This decision should go in memory."* — If it's a deliberate architecture decision, it's an ADR. Memory is for the observed, the conventional, and the procedural — link to the ADR instead of restating it.
- *"Let me list the whole directory structure so the agent knows the layout."* — A file listing rots on the next commit and tells a session nothing it couldn't get from `ls`. Capture the *pattern* (how the tree is organized and why), not the inventory.
- *"The user said add it to memory, so I'll add it."* — If the fact already lives in `project.md` or an ADR, "add to memory" is best served by a pointer in the index, not a copy. Honor the intent (findability), not the literal duplication.

## Red Flags

- Memory entries that state a rule with no rationale or provenance.
- Knowledge saved from an unverified assumption or a single observation ("silent learning").
- The same fact copied into multiple files instead of one canonical location with links.
- A `steering/` file that has grown to cover several unrelated topics.
- Pruning justified by size ("too long", "rarely used") rather than by wrongness.
- Content duplicated from `project.md`, an ADR, or a spec folder instead of linked.
- Memory written straight into durable files with no reviewable diff.
- Loading the entire `steering/` directory at session start instead of consulting the index.
- A runbook that pastes command text instead of pointing at the real script/CI source.
- An entry that catalogs what's already visible in the tree (file lists, dependency dumps) instead of the pattern behind it.
- Memorializing the agent's own scaffolding — `.claude/`, `.cursor/`, `.gemini/` and similar tooling dirs are not project knowledge.
- A new domain file that overlaps an existing one instead of extending it.
- A sync that overwrites a human-written entry instead of proposing an additive change.

## Verification

Before considering memory work complete:

- [ ] Each new entry records **why**, not just what — with provenance (feature, decision, failure, or approved preference).
- [ ] Each entry captures a **pattern, not a catalog** — nothing that's just an inventory of what the code already shows.
- [ ] A new domain file doesn't duplicate an existing one; sync changes are additive, not silent overwrites of human-written content.
- [ ] The knowledge was routed to the right home; nothing duplicates `project.md`, an ADR, or a spec folder.
- [ ] Every fact has exactly one canonical location; everything else links to it.
- [ ] The change went through a reviewable diff (commit/PR), not a silent in-place edit.
- [ ] The relevant directory index (`docs/steering/index.md`, `docs/adrs/index.md`, or `docs/runbooks/index.md`) is updated so a future session can find the new content without reading everything.
- [ ] Each file covers one concern; tiny/overlapping files were merged, multi-topic files split.
- [ ] Any pruning removed something *stale or wrong*, and preserved stable-but-rare facts.
- [ ] Runbooks link to real scripts/CI rather than restating commands.
