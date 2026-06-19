# Implementation Plan: Rename to Lucas Harness

## Overview
Rename the plugin from `agent-skills` to `lucas-harness` across the entire codebase, updating configuration files, command definitions, documentation, hook scripts, and repository URLs.

## Architecture Decisions
- A clean, breaking change will be executed as requested.
- Namespace prefix in commands and docs will be updated from `agent-skills:` to `lucas-harness:`.
- Repository URLs will be updated to point to `tinyc0der/lucas-harness`.

## Task List

### Phase 1: Metadata & Setup
- [x] **Task 1: Update plugin and marketplace metadata**
  - **Description:** Update the plugin name and links in plugin and marketplace configurations.
  - **Acceptance criteria:**
    - `plugin.json` name updated to `"lucas-harness"`.
    - `.claude-plugin/plugin.json` name, repository, and homepage updated.
    - `.claude-plugin/marketplace.json` name, repo, and homepage updated.
  - **Verification:**
    - Inspect files using `view_file` to confirm metadata modifications.
  - **Dependencies:** None.
  - **Files likely touched:**
    - `plugin.json`
    - `.claude-plugin/plugin.json`
    - `.claude-plugin/marketplace.json`
  - **Estimated scope:** XS (3 files)

- [x] **Task 2: Rename meta-skill directory and update content**
  - **Description:** Rename the directory `skills/using-agent-skills/` to `skills/using-lucas-harness/` and update its content.
  - **Acceptance criteria:**
    - Folder renamed to `using-lucas-harness`.
    - `skills/using-lucas-harness/SKILL.md` name changed to `using-lucas-harness`.
  - **Verification:**
    - Verify file path exists and contents reflect the new name.
  - **Dependencies:** None.
  - **Files likely touched:**
    - `skills/using-agent-skills/SKILL.md` -> `skills/using-lucas-harness/SKILL.md`
  - **Estimated scope:** XS (1 folder/file renamed)

### Checkpoint: Metadata & Setup
- [x] Plugin files updated and meta-skill directory renamed successfully.

### Phase 2: Refactoring Scripts & Commands
- [x] **Task 3: Update hook scripts and regression tests**
  - **Description:** Update references to the meta-skill path and name in hooks, tests, and validator scripts.
  - **Acceptance criteria:**
    - `hooks/session-start.sh` references `using-lucas-harness`.
    - `hooks/session-start-test.sh` checks for `using-lucas-harness` instead of `using-agent-skills`.
    - `scripts/validate-skills.js` references `using-lucas-harness`.
  - **Verification:**
    - Run the validation and regression test scripts to verify correct execution.
  - **Dependencies:** Task 2.
  - **Files likely touched:**
    - `hooks/session-start.sh`
    - `hooks/session-start-test.sh`
    - `scripts/validate-skills.js`
  - **Estimated scope:** S (3 files)

- [x] **Task 4: Update Claude command definitions and AGENTS.md**
  - **Description:** Update prefix and namespace definitions for all commands and agent configurations.
  - **Acceptance criteria:**
    - All occurrences of `agent-skills:` replaced with `lucas-harness:`.
    - `AGENTS.md` rules and mappings updated to the new prefix.
  - **Verification:**
    - Grep for `agent-skills:` to verify zero occurrences remain.
  - **Dependencies:** None.
  - **Files likely touched:**
    - `.claude/commands/build.md`
    - `.claude/commands/code-simplify.md`
    - `.claude/commands/plan.md`
    - `.claude/commands/review.md`
    - `.claude/commands/ship.md`
    - `.claude/commands/spec.md`
    - `.claude/commands/test.md`
    - `AGENTS.md`
  - **Estimated scope:** M (8 files)

### Checkpoint: Refactoring
- [x] Regression tests run and all command prefixes updated.

### Phase 3: Documentation & Actions
- [x] **Task 5: Update documentation and GitHub workflows**
  - **Description:** Rename all markdown documentation references and GitHub integration actions to use the new name and URLs.
  - **Acceptance criteria:**
    - Replace references to `addyosmani/agent-skills` and `agent-skills` with `tinyc0der/lucas-harness` and `lucas-harness`.
    - Update installation command lines in docs.
  - **Verification:**
    - Run grep to search for any remaining references to `agent-skills`.
  - **Dependencies:** None.
  - **Files likely touched:**
    - `README.md`
    - `CLAUDE.md`
    - `CONTRIBUTING.md`
    - `.github/workflows/test-plugin-install.yml`
    - `docs/agents.md`
    - `docs/antigravity-setup.md`
    - `docs/copilot-setup.md`
    - `docs/cursor-setup.md`
    - `docs/gemini-cli-setup.md`
    - `docs/getting-started.md`
    - `docs/opencode-setup.md`
    - `docs/skill-anatomy.md`
    - `docs/windsurf-setup.md`
  - **Estimated scope:** L (13 files)

### Checkpoint: Complete
- [x] No occurrences of `agent-skills` (except potentially in historical changelogs if any, but clean break preferred) remain.
- [x] All installation commands, repos, and paths renamed to `lucas-harness`.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Hook tests fail due to directory structure shift | Med | Ensure `hooks/session-start.sh` paths are resolved correctly relative to the new workspace layout |
| Missed occurrences of name in workflows or docs | Low | Use comprehensive case-insensitive grep checks |

## Open Questions
- None.
