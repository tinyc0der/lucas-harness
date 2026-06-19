---
description: Break work into small verifiable tasks with acceptance criteria and dependency ordering
---

Invoke the lucas-harness:planning-and-task-breakdown skill.

Read the existing spec for the active feature at `docs/specs/<slug>/spec.md` (resolve `<slug>` from the current git branch — see the Workflow Artifacts map in the `context-engineering` skill) and the relevant codebase sections. Then:

1. Enter plan mode — read only, no code changes
2. Identify the dependency graph between components
3. Slice work vertically (one complete path per task, not horizontal layers)
4. Write tasks with acceptance criteria and verification steps
5. Add checkpoints between phases
6. Present the plan for human review

Save the plan to `docs/specs/<slug>/plan.md` — a **single document** that holds both the tasks and their status. Each task is a `- [ ]` checkbox with its acceptance criteria and verification steps inline; `/build` flips it to `- [x]` as it completes. Do not split status into a separate file.
