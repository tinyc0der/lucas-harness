---
name: idea-handoff
description: >-
  Hands a drafted idea off to a fresh session in a new worktree, where that
  session drives the full implementation via the using-lucas-harness skill. Use
  when an idea or brief is implementation-ready in the current session and you
  want to spin up a separate worktree/session to build it ("hand this off to
  implement", "build this in another worktree", "spin up a session to implement
  this idea"). Builds the handoff brief, then uses the orchestration skill's
  worktree-creation path to launch the new session.
---

# Idea Handoff

## Overview

This skill is the bridge between the **Define** phase (where an idea gets drafted) and a **fresh implementation session**. You draft and sharpen an idea in one session — usually via [interview-me](../interview-me/SKILL.md) or [idea-refine](../idea-refine/SKILL.md) — then hand it off to a *new* session in its own worktree that owns the build end-to-end.

The new session is told, as its very first action, to invoke [using-lucas-harness](../using-lucas-harness/SKILL.md) and treat the brief as an incoming ticket: classify it, then drive the calibrated lifecycle (spec → plan → build → verify → review → ship), stopping for a human only at critical gates.

This is a **full ownership handoff** by default. The current session packages the brief, launches the worktree, and stops. It does not supervise, poll, or read the new terminal afterward. Use the supervised variant only when you explicitly want to track completion (see Mode B).

The mechanics of creating the worktree and session come from the [orchestration](../orchestration/SKILL.md) skill. See also [references/orchestration-patterns.md](../../references/orchestration-patterns.md) — the governing rule that *the user/session is the orchestrator and personas do not invoke other personas* still holds here: this skill hands off work, it does not nest personas.

## When to Use

- An idea, one-pager, or spec is **implementation-ready** in the current session and you want a separate session to build it.
- You want the implementation to run in its **own worktree** (isolated checkout) so the current session stays free.
- The user says "hand this off to implement", "build this in another worktree", "spin up a session to implement this", or "give this idea to another agent to build".

**Do not use when:**

- The idea is still vague — route back to [interview-me](../interview-me/SKILL.md) or [idea-refine](../idea-refine/SKILL.md) first. Handing off a one-liner just moves the ambiguity to a session with *less* context.
- The work must stay in the **current** worktree (depends on uncommitted files, must validate the current branch). Then implement here, or create the worker in the active worktree — do not spin up an independent worktree.
- You actually want to *supervise* a DAG of workers — that is the [orchestration](../orchestration/SKILL.md) skill's coordinator flow, not a handoff.

## Preconditions

Inherited from the [orchestration](../orchestration/SKILL.md) skill — verify before launching:

- `orca status --json` shows a running runtime.
- `orca` is on PATH (`orca-ide` on Linux).
- The orchestration experimental feature is enabled in **Settings → Experimental**.
- The new worktree's agent has the lucas-harness skills available (so it can invoke `using-lucas-harness`).

## Process

### 1. Confirm the idea is implementation-ready

The handoff is only as good as the brief. Before packaging, the idea must have:

- A one-sentence statement of **what** is being built and **why**.
- Concrete scope: what's in, what's explicitly **not** in (non-goals).
- Acceptance criteria or a definition of done.
- Known constraints (stack, deadlines, interfaces it must respect).

If any of these are missing, stop and route back to [idea-refine](../idea-refine/SKILL.md) / [interview-me](../interview-me/SKILL.md). Do not hand off ambiguity.

### 2. Package a self-contained handoff brief

A new worktree is created from the repo's **default base** (`origin/main`), so an *uncommitted* idea doc in the current branch will **not** be present in the new worktree. The brief must travel inside the handoff itself. Two options:

- **Short brief** → embed it directly in the `--prompt`.
- **Long brief** → write it to an **absolute path** the new session can read (the worktree is a separate checkout on the *same machine*, so an absolute path outside the repo — e.g. the scratchpad — is readable), and reference that path in the prompt.

Use this template for the brief (see [Handoff Brief Template](#handoff-brief-template) below for the full version):

```
# Implementation Handoff: <title>

## First action
Invoke the `using-lucas-harness` skill. Treat the idea below as an incoming
ticket: classify its type and drive the calibrated lifecycle (spec → plan →
build → verify → review → ship), stopping for a human only at critical gates.

## The idea
<one-pager content, OR: read the full brief at <absolute-path>>

## Constraints & non-goals
<...>

## Definition of done
<acceptance criteria>
Open a PR when the lifecycle reaches Ship. Do not merge without human approval.
```

### 3. Choose the handoff mode

| Mode | When | What you do |
|---|---|---|
| **A — Full handoff (default)** | "hand off", "build this in another worktree", "give this to another agent" | Launch the worktree with the brief as `--prompt`, then **stop**. No `task-create`, no `dispatch --inject`, no `check --wait`, no peeking at the terminal. |
| **B — Supervised** | User *explicitly* says "supervise", "wait for it", "track completion", "tell me when it's done" | Use the orchestration coordinator flow: `task-create` → create worker → `dispatch --inject` → `check --wait`. |

Default to **A**. Per the orchestration skill, "hand off" language is a full ownership transfer, and custom model/effort words (`gpt-5.5`, `xhigh`) do **not** make it supervised.

### 4a. Mode A — launch and stop

```bash
# Verify runtime is up
orca status --json

# Independent top-level worktree, agent launched with the brief.
# --no-parent: top-level lineage. Omit --base-branch so Orca uses the repo
# default base (origin/main) — never base an independent handoff on the
# current feature branch.
orca worktree create \
  --name <task-slug> \
  --no-parent \
  --agent claude \
  --prompt "$(cat <absolute-path-to-brief>)" \
  --json
```

Then **report** the new worktree id and terminal handle to the user and stop. Do not monitor.

If an older CLI rejects `worktree create --agent` or `--prompt`, fall back to: create the worktree, create a terminal with `--command "claude"`, wait for `tui-idle`, then `orca terminal send … --text "<brief>" --enter`. Send only once so the prompt isn't lost; do not poll afterward.

### 4b. Mode B — supervised (only if explicitly requested)

```bash
orca orchestration task-create --spec "<brief>" --json
orca worktree create --name <task-slug> --no-parent --agent claude --json
orca terminal list --worktree id:<newWorktreeId> --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca orchestration dispatch --task <task_id> --to <handle> --inject --json
orca orchestration check --wait --types worker_done,escalation,decision_gate --timeout-ms 900000 --json
```

Treat a `check --wait` timeout as a checkpoint, not a failure — implementation lifecycles run long. Reply to `decision_gate` messages and keep waiting until `worker_done`/`escalation`.

### 5. Report

Tell the user: the worktree/session that now owns the build, the mode (handoff vs. supervised), and — for Mode A — that the current session is no longer tracking it.

## Handoff Brief Template

```markdown
# Implementation Handoff: <short title>

You are picking up a drafted idea to implement end-to-end in this fresh worktree.

## First action
Invoke the `using-lucas-harness` skill. Treat this brief as an incoming ticket:
classify its type (Epic / Feature / Task / Bug / Migration / Improvement / Spike /
Chore) and drive the calibrated lifecycle across spec → plan → build → verify →
review → ship, stopping for a human only at critical gates.

## The idea (what & why)
<one-paragraph statement, OR: read the full one-pager at /abs/path/to/idea.md>

## In scope
- <...>

## Non-goals (explicitly out)
- <...>

## Constraints & context
- Stack / interfaces it must respect: <...>
- Base branch: origin/main (independent worktree)
- Current-branch context the new worktree won't see: <paste anything relevant>

## Definition of done
- <acceptance criteria, one per line>
- Open a PR when the lifecycle reaches Ship. Do not merge without human approval.
```

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The idea's rough but the next session will figure it out" | A fresh session has *less* context than you do now. Sharpen the brief here or it gets built wrong. |
| "I'll just point it at my idea doc by relative path" | The new worktree is checked out from `origin/main`; your uncommitted doc isn't there. Embed the brief or use an absolute path. |
| "I'll dispatch with --inject so I can track it" | `--inject` plus `check --wait` is *supervision*, not a handoff. Only do that if the user explicitly asked to track completion. |
| "Let me peek at the worker terminal to see how it's going" | For a full handoff you've transferred ownership. Reading the terminal to monitor progress re-creates the obligation you handed away. |
| "I'll base the worktree on my current branch so it has my changes" | Independent handoffs base off the repo default. Put any current-branch context in the brief instead. |
| "It's faster to send the prompt twice to be sure it landed" | Send once. A double-send can interleave and corrupt the brief; use `terminal wait --for tui-idle` first if timing is the worry. |

## Red Flags

- Handing off a one-line idea with no scope, non-goals, or definition of done.
- The brief references a file by **relative path** or one that only exists uncommitted in the current worktree.
- Using `task-create` / `dispatch --inject` / `check --wait` for what the user called a "handoff".
- Basing the new worktree on the current feature branch instead of `origin/main` (without an explicit request for stacked work).
- Reading or polling the worker terminal after a full handoff to "check progress".
- The new worktree's agent doesn't have the lucas-harness skills, so it can't actually run `using-lucas-harness`.
- Spinning up an independent worktree when the work depends on the current worktree's uncommitted state.

## Verification

Before considering the handoff complete:

- [ ] The brief is self-contained — readable with zero access to this session's context.
- [ ] The brief's **first action** instructs the new session to invoke `using-lucas-harness`.
- [ ] Scope, non-goals, and a definition of done are all present in the brief.
- [ ] `orca status --json` confirmed the runtime before launching.
- [ ] The worktree was created `--no-parent` off the repo default base (Mode A).
- [ ] The correct mode was chosen: handoff (default) vs. supervised (only on explicit request).
- [ ] You reported the new worktree/terminal to the user and — for Mode A — stopped monitoring.
