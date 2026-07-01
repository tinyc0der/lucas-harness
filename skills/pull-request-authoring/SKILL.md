---
name: pull-request-authoring
description: Drafts a pull request whose description carries enough context to be reviewed cold in a separate session. Use when opening a PR, handing a change to another agent or human for review, or preparing work that will be reviewed later without you present to explain it. Use when a reviewer would otherwise have to reconstruct intent from the diff alone.
---

# Pull Request Authoring

## Overview

A PR is reviewed by someone who was not in the room when the code was written — a teammate tomorrow, a fresh-context agent in another session, or you after the context is gone. The diff shows *what* changed; it never shows *why*, *what was considered and rejected*, or *how to know it works*. The PR description is where that missing context lives. A well-authored PR lets a reviewer reach a confident verdict without asking you a single question.

This skill covers writing the PR itself. For commit discipline and splitting large changes, use `git-workflow-and-versioning`. For the review that happens next, use `code-review-and-quality`.

## When to Use

- Opening any pull request that another party will review.
- Handing a change to a fresh-context reviewer — another agent or a later session — where you will not be present to explain intent.
- Preparing work for asynchronous review across a time zone or a session boundary.
- Any time the reviewer would otherwise have to infer the goal from the diff alone.

**Not for:** the review itself (`code-review-and-quality`), the go/no-go launch decision (`shipping-and-launch`), or deciding how to slice a change into commits/PRs (`git-workflow-and-versioning`).

## Core Process

```
Confirm the change is review-ready
    │  (scoped, committed, tests green — see git-workflow-and-versioning)
    ▼
Write the description for a cold reader
    │  Why → What → How to verify → What you didn't touch → Open questions
    ▼
Attach the evidence a reviewer needs
    │  test output, screenshots, migration/rollback notes, links
    ▼
Self-review the diff as the reviewer will
    │  read your own PR top to bottom; fix what confuses you
    ▼
Open the PR / hand it off
```

### 1. Confirm the change is review-ready

Before writing a word: the change is scoped to one logical concern, commits are clean, and tests pass. If the diff is over ~1000 lines or mixes refactor with feature, split it first — see `git-workflow-and-versioning` and the splitting strategies in `code-review-and-quality`. A tight diff is the single biggest favor you can do a reviewer.

The branch name is the first thing a reviewer reads — it appears on the PR before the title. An auto-generated name (`claude/pensive-booth-0dc063`) tells them nothing; rename it to describe the change (`docs/pull-request-authoring-skill`) using the `feature/`, `fix/`, `chore/`, `refactor/` conventions in `git-workflow-and-versioning`. If the branch has no upstream yet, `git branch -m <new-name>` is a safe, reversible local rename.

### 2. Write the description for a cold reader

Assume the reviewer has the repo and nothing else — no memory of the ticket, no chat history, no you. Fill each section below. If a section is genuinely empty (e.g. no user-facing change), write "None" rather than deleting it, so the reviewer knows you considered it.

```markdown
## Why
The problem or goal in 1-3 sentences. Link the ticket/issue. State what
was broken or missing and who it affects. A reviewer should understand the
motivation before reading any code.

## What changed
The approach, not a restatement of the diff. Name the key decisions and,
briefly, the alternatives you rejected and why. Call out anything the
reviewer would be surprised by.

- path/to/file.ts: what and why (mirror git-workflow's CHANGES MADE)
- path/to/other.ts: what and why

## How to verify
The exact steps a reviewer runs to confirm it works — commands, URLs,
fixtures, expected output. Paste real test output. If it's a UI change,
attach before/after screenshots.

## Not touched (intentionally)
Adjacent things you deliberately left alone, and why — proves scope
discipline and preempts "why didn't you also…" questions.

## Risk & rollback
Blast radius, data migrations, feature flags, and how to undo this if it
misbehaves in production. "Low risk, revert the commit" is a valid answer.

## Open questions
Decisions you want the reviewer to weigh in on. Empty is fine; leaving a
known doubt unstated is not.
```

The `Not touched` and `Open questions` sections come straight from the change-summary discipline in `git-workflow-and-versioning` — carry them into the PR rather than dropping them in chat where the reviewer never sees them.

### 3. Attach the evidence

A claim without evidence forces the reviewer to re-run your work. Include:
- **Test output** — the actual passing run, not "tests pass."
- **Screenshots / recordings** for any visible change (before *and* after).
- **Migration and rollback notes** if data or schema changed.
- **Links** to the ticket, the spec (`docs/specs/<slug>/`), a prior `/review`, or an ADR that explains the decision.

### 4. Self-review the diff as the reviewer will

Read your own PR top to bottom — description first, then every hunk of the diff — as if you'd never seen it. Every place you have to pause and reconstruct intent is a place the reviewer will too: add a code comment, a PR comment, or a line in the description. This pass catches leftover debug code, unrelated churn, and unexplained magic values before the reviewer does.

### 5. Hand it off

Open the PR (or, for an agent handoff, point the next session at the branch and this description). The description *is* the handoff — if you find yourself adding critical context in a follow-up message instead of the PR body, move it into the PR body.

## Writing for a Fresh-Context Agent Reviewer

When the reviewer is an agent in another session, it has no conversation history and cannot ask clarifying questions cheaply. Be explicit where a human would infer:

- State the acceptance criteria the change is meant to satisfy, so the reviewer can check against them directly.
- Give exact, copy-pasteable verification commands — an agent can't guess your dev setup.
- Name the files that matter most and the order to read them in.
- Surface every known trade-off in `Open questions`; an unstated doubt will not be discovered, it will ship.

This is the author-side of the fresh-context review discipline in `doubt-driven-development`: the more completely the PR states its own reasoning, the sharper the adversarial review it invites.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The diff is self-explanatory." | The diff shows *what*, never *why*. The reviewer can't see the alternatives you rejected or the constraint that forced this shape. |
| "I'll explain it in the review call." | Async and cross-session review has no call. Anything not in the PR body is invisible to the reviewer. |
| "The ticket has all the context." | Reviewers review the diff, not the ticket backlog. Link it, but summarize the *why* in the PR. |
| "Tests pass, so it works." | "Tests pass" without the output is an assertion, not evidence. Paste the run and say what it exercised. |
| "It's a small change, skip the template." | Small diffs still hide intent. Two sentences of *why* cost you nothing and save the reviewer a round-trip. |
| "I'll list open questions if they ask." | An unstated doubt is never discovered — it ships. State it now, while it's cheap. |

## Red Flags

- The PR description restates the diff line-by-line instead of explaining intent.
- "Why" is missing, or is just the ticket number with no summary.
- No verification steps, or verification says "tested locally" with no output.
- A visible/UI change with no screenshots.
- Known trade-offs or doubts live in chat, not in the PR body.
- The reviewer's first response is a question you could have answered in the description.
- The diff mixes refactor + feature, or exceeds ~1000 lines with no split rationale.
- The branch is still named with an auto-generated slug instead of the change.

## Verification

Before opening the PR / handing off, confirm:
- [ ] The change is scoped to one concern; oversized diffs are split (`git-workflow-and-versioning`).
- [ ] The branch name describes the change, not an auto-generated slug.
- [ ] `Why` states the problem and who it affects, with a ticket link.
- [ ] `What changed` explains the approach and key decisions, not just the diff.
- [ ] `How to verify` lists exact, copy-pasteable steps with real output attached.
- [ ] Visible changes include before/after screenshots.
- [ ] `Not touched` and `Risk & rollback` are filled (or explicitly "None").
- [ ] Every open question or known trade-off is written in the PR body, not left in chat.
- [ ] You have re-read the full diff as the reviewer will, and fixed every spot that made you pause.
