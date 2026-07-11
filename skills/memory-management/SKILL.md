---
name: memory-management
description: Organizes portable project memory as Open Knowledge Format (OKF) bundles so future sessions start from real knowledge instead of re-deriving it. Routes each fact to the right concept (project, decisions, steering, or runbooks), promotes lessons through review, and keeps memory pruned and trustworthy. Use whenever a feature ships, the user states a durable preference or correction, a failure is diagnosed, memory drifts from code, or a project needs an OKF-compatible durable-memory core.
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
- **Setting up a project's durable-memory core** for the first time (Bootstrap mode — derive it from the codebase), or deciding where a new piece of knowledge belongs.

If a piece of knowledge only matters to the current conversation, it does **not** belong in memory. Memory is for what survives the session.

## A Note on Terms: Memory vs. `steering/`

**Memory** is the whole durable-knowledge system: the portable OKF knowledge bundle plus the shipped `specs/` history that supplies workflow evidence. The bundle contains `project.md`, `decisions/`, `steering/`, and `runbooks/`; feature workflow state stays outside it.

**`steering/`** is one part of that system: the directory holding durable knowledge that has no more specific home. It used to be called `memory/`; it's renamed to `steering/` precisely so "memory" can keep its broader meaning without the directory name colliding with it.

So: *memory* = the system; *`steering/`* = the residue directory inside it.

## The Mental Model: Three Tiers

Knowledge lives at one of three levels, and only earns promotion upward when it's useful, scoped, evidence-backed, and reviewable:

```
Session memory   → what this agent has in context right now (most of it is disposable)
Workflow state   → task-specific state for one feature        (lives in docs/specs/<slug>/)
Project memory   → durable knowledge reused across features   (docs/knowledge/ OKF bundle)
```

The promotion test for project memory: **"Would a future feature that has nothing to do with this one still need this fact?"** If yes, it belongs in durable memory — and if it has no more specific home, in `steering/`. If no, it stays in the feature's workflow state. Shipped feature folders remain as provenance, but feature-local facts are not promoted into the always-discovered core.

## Where Knowledge Lives

Durable memory is separated into homes. The skill's first move is always to ask *"does this belong somewhere more specific?"* and only land in `steering/` when the answer is no.

**Every durable artifact has a resolved memory root.** Resolve scope first: the repository memory root is `docs/`; a package-owned memory root is `packages/<pkg>/docs/`. The OKF bundle root is always `<memory-root>/knowledge/`. Per-feature workflow state remains in repository `docs/specs/<slug>/`, outside the bundle, regardless of memory scope. The repository layout is:

```
docs/knowledge/
  index.md              → OKF bundle entrypoint and version declaration
  project.md            → stable (but evolving) project contract, direction, constraints
  decisions/            → deliberate, dated architecture decisions
    index.md
    NNNN-*.md
  steering/             → declarative cross-workflow knowledge with no more specific home
    index.md
    <domain>.md
  runbooks/             → repeatable operational procedures
    index.md
    <procedure>.md

docs/specs/<slug>/      → feature workflow: spec → plan → memory delta → review → ship
```

Each bundle has a root `index.md`; each durable collection under `<memory-root>/knowledge/` carries its own `index.md`. These maps provide one-line summaries and discovery paths so a session can find the right concept without reading the whole directory.

## OKF v0.1 Interoperability Profile

Before bootstrapping, syncing, migrating, or promoting memory, read [references/okf-v0.1.md](references/okf-v0.1.md). It contains the canonical bundle, frontmatter, reserved-file, linking, and producer/consumer rules derived from the [Open Knowledge Format v0.1 draft](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md).

The non-negotiable profile rules are:

- Treat `docs/knowledge/` and each `packages/<pkg>/docs/knowledge/` as independent OKF bundles. General docs and feature workflow artifacts are not bundle concepts.
- Put `okf_version: "0.1"` in the bundle-root `index.md`. Other indexes contain no frontmatter.
- Give every non-reserved Markdown concept parseable YAML frontmatter with a non-empty `type`; producers also add `title` and a one-sentence `description`. Lucas producers use a deterministic flat top-level mapping with scalar values or inline scalar lists, quoting values that contain YAML punctuation. This is a producer convention, not a consumer restriction. Default types are `Project`, `Project Guidance`, `Architecture Decision`, and `Playbook` for the four homes.
- Reserve `index.md` and `log.md` at every depth. Index entries are grouped under headings and use relative links plus descriptions. Omit `log.md` by default because git already provides reviewable history.
- Prefer absolute bundle-relative links for concepts inside one bundle. Use durable repository or web citations for workflow evidence or cross-bundle sources when the bundle must remain portable.
- Consume permissively: tolerate unknown types, unknown frontmatter fields, missing optional fields, broken links, and missing optional indexes. If the root declares an unrecognized OKF version, warn and attempt best-effort consumption rather than refusing the bundle. Preserve unknown keys when round-tripping and propose repairs without overwriting human-authored content.

The Lucas profile requires discovery indexes even though base OKF makes them optional. A missing profile index is a repair candidate, not a reason to reject the remaining bundle as unreadable.

`steering/` and `runbooks/` are siblings that split durable knowledge by *shape*: `steering/` holds **declarative** facts (what's true — conventions, risks, lessons), and `runbooks/` holds **imperative** procedures (what to do — deploy, rollback, incident response). They share the same lifecycle (durable, synced, promoted, reviewed); the split is just declarative-vs-imperative.

`steering/` is the **residue** — the institutional knowledge that lives *between* the other documents:

| Goes elsewhere | Belongs in `steering/` |
|---|---|
| Product direction → `<bundle-root>/project.md` | Conventions the code follows but no doc states |
| A deliberate architecture decision → `<bundle-root>/decisions/` | Build / test / verify / deploy commands and env quirks |
| One feature's requirements → `docs/specs/<slug>/` | Known risks and fragile areas found while working |
| A step-by-step operational procedure → `<bundle-root>/runbooks/` | Recurring failure modes |
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

## Three Modes: Bootstrap, Migrate, and Sync

Resolve the active scope, then choose a mode from the state of its `<memory-root>/knowledge/` bundle:

**Bootstrap** — no legacy layout exists and `<bundle-root>/index.md`, `<bundle-root>/project.md`, or a required collection index is missing. Generate or repair the active repository or package bundle by *analyzing its codebase scope*: README, config and dependency files, directory structure, naming and import patterns. Extract patterns (per the Golden Rule), don't interrogate the user for what the code already shows. The research areas — product/direction, tech/stack, structure/conventions, and domain patterns — are independent and can be gathered in parallel. Write OKF-conformant concepts and indexes, then present the result for review before treating it as source of truth.

**Migrate** — any subset of the legacy homes (`<memory-root>/project.md`, `steering/`, `decisions/`, or `runbooks/`) exists. Follow [the legacy-layout migration procedure](references/okf-v0.1.md#legacy-layout-migration). If `<memory-root>/knowledge/` also exists, **stop and reconcile ownership with the user**, even when one tree appears empty; do not guess which scaffold is canonical. Otherwise inventory and move every existing legacy artifact, repair missing required profile files from verified codebase evidence, add concept frontmatter, rewrite links, and update rules-file pointers in one reviewable change. Preflight reserved legacy `index.md` and `log.md` names: keep files that already have the reserved meaning, but rename ambiguous concept collisions with user approval and rewrite inbound links. Before trimming a human-authored rules file, route its unique durable facts into the bundle and preserve its tool-specific controls. Never bootstrap a second copy or discard partial legacy content.

**Bridge the agent's rules file to memory (pointer only).** After bootstrap or migration writes a bundle, update the existing rules file at the same scope — repository `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.github/copilot-instructions.md`, etc., or a package-local rules file for a package bundle. Create `AGENTS.md` only when no rules file exists and the user wants one. This block does **not** duplicate memory; it is a signpost.

For the repository bundle:

```markdown
## Project memory
Durable knowledge is an OKF v0.1 bundle under `docs/knowledge/`. Read these at session start:
- `docs/knowledge/index.md` — bundle map and OKF version
- `docs/knowledge/project.md` — project contract, direction, constraints
Use the root index to load collection indexes and individual concepts on demand; don't inline their contents here.
```

For a package bundle, use the same block with
`packages/<pkg>/docs/knowledge/index.md` and
`packages/<pkg>/docs/knowledge/project.md`. If the package has no local rules
file, keep the repository rules pointer unchanged and add the package bundle to
the typed root `docs/knowledge/bundles.md` catalog instead; do not put a
cross-bundle pointer in a reserved index.

Keep each block to those pointers. The rules file is a *bridge*, not a second copy of memory — canonical content stays in the OKF bundle, and this block is the one place the tool-specific layer touches it (**link, don't restate**). On Sync, refresh the applicable block only if its bundle location changes; indexes absorb everything else.

**Sync** — the OKF bundle exists; keep it aligned with reality. This is the ongoing maintenance loop, and it works as **bidirectional drift detection**:

- **Memory → Code**: an entry references something that no longer exists (a deleted file, a removed tool, a dropped convention) → a **prune candidate**. Flag it; don't auto-delete.
- **Code → Memory**: a pattern the code now follows that memory doesn't capture yet → an **update candidate**.

**Sync updates are additive, and human-written content is sacred.** A sync proposes *additions* and explicit *supersessions* through review — it never silently overwrites an entry a person wrote. Preserve unknown OKF types and frontmatter keys when round-tripping. Broken links and missing profile indexes are repair candidates, not reasons to reject the bundle. When in doubt, add rather than replace.

## How Memory Gets Saved: Delta → Review → Promote

Discovered knowledge does not get written straight into durable memory. It flows through review:

1. **During a feature**, candidate knowledge accumulates in `docs/specs/<slug>/memory-delta.md` — a scratchpad. It is *not* durable memory yet; the feature might get reverted and take its "lessons" with it.
2. **At ship, resolve scope first.** For each candidate, choose the memory root before choosing the concept type. Use `docs/` for repo-wide or cross-package knowledge. For knowledge owned by one package, use `packages/<pkg>/docs/` only when that package already has (or now justifies) an independent bundle; otherwise keep it in the repository bundle with package scope encoded in the concept. The target OKF bundle is `<memory-root>/knowledge/`.
3. **GO — review, record, and promote.** Give every candidate a disposition with rationale: accepted, rejected as unverified, or retained as feature-local. Route accepted items within the resolved bundle: project direction or constraints → `<bundle-root>/project.md`; deliberate architecture choices → `<bundle-root>/decisions/`; declarative conventions, risks, or lessons → `<bundle-root>/steering/`; repeatable procedures → `<bundle-root>/runbooks/`. At repository scope these resolve to `docs/knowledge/project.md`, `docs/knowledge/decisions/`, `docs/knowledge/steering/`, and `docs/knowledge/runbooks/`. Create or update an OKF concept with the required frontmatter, update the affected collection index, and keep the root index current. Promote the accepted set in **one batched PR** and record target links in `memory-delta.md`.
4. **NO-GO — preserve workflow state.** Record why the launch was blocked, leave every candidate unpromoted in `memory-delta.md`, and make no durable-memory edit. A later GO decision performs the review and promotion.
5. **Knowledge discovered outside a feature** (a standalone correction, a preference, or an incident with no feature branch) skips the delta scratchpad, resolves root-versus-package scope, and goes straight to its canonical home through a reviewable commit/PR.

The promotion chain for procedural knowledge extends one step further: **delta → lesson → runbook.** After an incident, a lesson ("DB failover needs X") that proves recurring and procedural graduates into a runbook *step*.

Memory concepts **cite** `docs/specs/<slug>/review.md` and other permanent evidence rather than copying it. Prefer a durable repository/web URL in `# Citations` when the bundle may be distributed independently; use a checkout-relative link only when that portability trade-off is explicit.

## How Memory Gets Loaded: Progressive Disclosure

Never load all of memory at once. Split it into two tiers:

- **Always-loaded core** — `docs/knowledge/index.md` + `docs/knowledge/project.md`. Small, durable, and read at the start of every session: the bundle map plus project identity.
- **Load-on-demand** — load the relevant steering, decisions, or runbooks index on demand from the root map, then load only the concepts that index says the current task needs.

Each `index.md` does real work — it is **not** a bare table of contents. It carries a one-line summary per entry plus the path to the full file, so a session can often answer a question from the index alone and only open the full file when it needs detail. *Surface context at the level the moment requires.*

## How Memory Is Organized: Organize by Domain, Not by Knowledge-Type

The single most important structural rule: **a file is a domain, not a category of fact.** When you work on auth, you want auth's conventions, its risks, and its past lessons *together* — so they belong in `auth.md`, not scattered across a `conventions.md`, a `risks.md`, and a `lessons.md`. Both Kiro and Letta organize this way, and the reason is retrieval: you look things up by *what you're working on*, not by what type of knowledge it is. A `risks.md` that collects risks from every domain is a dumping ground that violates one-domain-per-file and makes conditional loading impossible.

```
docs/knowledge/steering/
  index.md          → compact summaries + discovery paths (load on demand)

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

docs/knowledge/runbooks/      → sibling home for imperative procedures
  index.md          → compact summaries + discovery paths (load on demand)
  deploy.md
  rollback.md

docs/knowledge/decisions/     → architecture decision records
  index.md          → compact summaries + discovery paths (load on demand)
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

## Monorepos: Two-Level Memory

A monorepo breaks the single-bundle assumption — one repository bundle covering many packages eventually makes unrelated package concepts noisy. The fix is a shared OKF bundle plus independent package bundles. Each bundle has its own concept-ID namespace and `okf_version: "0.1"` declaration.

```
docs/knowledge/                         # repo-wide OKF bundle
  index.md
  project.md                            # monorepo contract and shared direction
  bundles.md                            # typed catalog of independent package bundles, when needed
  steering/index.md + <domain>.md       # rules that apply across packages
  decisions/index.md + NNNN-*.md        # cross-package decisions
  runbooks/index.md + <procedure>.md    # workspace procedures

packages/<pkg>/docs/knowledge/          # independent package OKF bundle
  index.md
  project.md                            # package contract, direction, constraints
  steering/index.md + <domain>.md
  decisions/index.md + NNNN-*.md
  runbooks/index.md + <procedure>.md
```

The required package core resolves exactly to `packages/<pkg>/docs/knowledge/index.md`,
`packages/<pkg>/docs/knowledge/project.md`,
`packages/<pkg>/docs/knowledge/steering/index.md`,
`packages/<pkg>/docs/knowledge/decisions/index.md`, and
`packages/<pkg>/docs/knowledge/runbooks/index.md`.

**Routing rule:** resolve scope before type. A fact that affects **one package** lives in `packages/<pkg>/docs/knowledge/` when that independent bundle exists; until the split is justified, it remains in `docs/knowledge/` with the package named in its concept ID, title, or tags. A fact that affects multiple packages or the workspace itself always lives in the repository bundle. Within the chosen bundle, route project contract → `project.md`, deliberate decision → `decisions/`, declarative domain knowledge → `steering/`, and procedure → `runbooks/`. A cross-package contract is a root-bundle ADR. Reference it from a package concept using a durable repository URL when independent bundle portability matters.

**Loading stays progressive:** always load `docs/knowledge/index.md` and `docs/knowledge/project.md`. When the active package has its own bundle, also load `packages/<pkg>/docs/knowledge/index.md` and `packages/<pkg>/docs/knowledge/project.md`. Consult each bundle's collection indexes on demand; never load every package bundle. If discovery from the root is needed, add package links to a typed `docs/knowledge/bundles.md` concept. Do not put cross-bundle links in `steering/index.md`, because a reserved OKF index inventories only its own directory.

**Start lighter, split when justified.** For a small monorepo, keep each package as a domain concept in the root bundle — `docs/knowledge/steering/foo.md`, `docs/knowledge/steering/bar.md`. Promote a package to `packages/<pkg>/docs/knowledge/` only when it needs multiple concepts. Create the entire required package profile together: root index, project concept, and the three collection indexes.

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
- Treating all of `docs/` as the OKF bundle and accidentally imposing concept frontmatter on specs, migration guides, or general documentation.
- A non-reserved bundle concept with missing or empty `type` frontmatter.
- Frontmatter on a collection `index.md`, or any root-index frontmatter beyond `okf_version: "0.1"`.
- Dropping unknown OKF types or extension keys during sync.
- Putting package-bundle links in a reserved collection index instead of a typed bundle-catalog concept.

## Verification

Before considering memory work complete:

- [ ] Each new entry records **why**, not just what — with provenance (feature, decision, failure, or approved preference).
- [ ] The active bundle root is `docs/knowledge/` or `packages/<pkg>/docs/knowledge/`; workflow and general docs remain outside it.
- [ ] The bundle-root index declares `okf_version: "0.1"`; every non-reserved concept has parseable frontmatter with non-empty `type`, `title`, and `description`.
- [ ] Reserved `index.md` and any `log.md` follow the OKF structure; collection indexes have no frontmatter.
- [ ] Each entry captures a **pattern, not a catalog** — nothing that's just an inventory of what the code already shows.
- [ ] A new domain file doesn't duplicate an existing one; sync changes are additive, not silent overwrites of human-written content.
- [ ] Unknown types and frontmatter keys were preserved; optional fields, broken links, or missing optional indexes did not cause destructive normalization.
- [ ] The knowledge was routed to the right home; nothing duplicates `project.md`, an ADR, or a spec folder.
- [ ] Every fact has exactly one canonical location; everything else links to it.
- [ ] The change went through a reviewable diff (commit/PR), not a silent in-place edit.
- [ ] The corresponding root or package-local bundle and collection index is updated so a future session can find the new content without reading everything.
- [ ] Each file covers one concern; tiny/overlapping files were merged, multi-topic files split.
- [ ] Any pruning removed something *stale or wrong*, and preserved stable-but-rare facts.
- [ ] Runbooks link to real scripts/CI rather than restating commands.
