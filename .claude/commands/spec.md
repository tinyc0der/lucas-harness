---
description: Start spec-driven development — write a structured specification before writing code
---

Invoke the lucas-harness:spec-driven-development skill.

Begin by understanding what the user wants to build. Ask clarifying questions about:
1. The objective and target users
2. Core features and acceptance criteria
3. Tech stack preferences and constraints
4. Known boundaries (what to always do, ask first about, and never do)

Then generate a structured spec covering all six core areas: objective, commands, project structure, code style, testing strategy, and boundaries.

Save the spec to `docs/specs/<slug>/spec.md`, where `<slug>` is the current git branch name (see the Workflow Artifacts map in the `context-engineering` skill for the slug-resolution rule). If you're on the default branch (`main`/`master`), create a feature branch first — don't write feature artifacts onto the trunk. Create the `docs/specs/<slug>/` directory if it doesn't exist, then confirm with the user before proceeding.
