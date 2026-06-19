# Rename to Lucas Harness

## Problem Statement
How might we rename `agent-skills` to `lucas-harness` across the entire project (metadata, commands, workflows, folders, scripts, and documentation) to establish a clean and consistent brand identity?

## Recommended Direction
Execute a complete, breaking rename. This includes:
1.  **Metadata/JSON Updates:** Update `plugin.json` and `.claude-plugin/` files to name: `lucas-harness`.
2.  **Folder Renaming:** Rename `skills/using-agent-skills` to `skills/using-lucas-harness`.
3.  **Command Prefixes:** Update all references to `agent-skills:` to `lucas-harness:` in `.claude/commands/*.md`, `AGENTS.md`, and skills.
4.  **URLs & Setup Instructions:** Replace `https://github.com/addyosmani/agent-skills` and related git/installation URLs with `https://github.com/tinyc0der/lucas-harness`.
5.  **Hooks & Scripts:** Update paths, messages, and validation keys in `hooks/session-start.sh`, `hooks/session-start-test.sh`, and `scripts/validate-skills.js`.

## Key Assumptions to Validate
- [ ] Runtimes using this repository load it as `lucas-harness` without issues.
- [ ] No hardcoded dependencies on the name `agent-skills` remain in scripts or tests.
- [ ] Renaming `skills/using-agent-skills/` to `skills/using-lucas-harness/` does not break any local CLI path resolution.

## MVP Scope
- All text references updated.
- `using-agent-skills` folder renamed to `using-lucas-harness`.
- `using-agent-skills/SKILL.md` updated to name `using-lucas-harness`.
- All tests and validation scripts pass using the new name `lucas-harness`.

## Not Doing (and Why)
- Maintaining alias/fallback support for installing the plugin as `agent-skills` (as the user agreed a complete breaking rename is acceptable).

## Open Questions
- None.
