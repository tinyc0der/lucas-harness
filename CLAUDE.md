# lucas-harness

This is the lucas-harness project — a collection of production-grade engineering skills for AI coding agents.

## Project Structure

```
skills/       → Core skills (SKILL.md per directory)
agents/       → Reusable agent personas (code-reviewer, test-engineer, security-auditor, web-performance-auditor)
hooks/        → Session lifecycle hooks
.claude/commands/ → Slash commands (/spec, /plan, /build, /test, /review, /code-simplify, /ship; plus /webperf specialist audit)
references/   → Supplementary checklists (testing, performance, security, accessibility, observability)
docs/         → Setup guides for different tools
```

## Skills by Phase

**Define:** interview-me, idea-refine, spec-driven-development
**Plan:** planning-and-task-breakdown
**Build:** incremental-implementation, test-driven-development, context-engineering, source-driven-development, doubt-driven-development, frontend-ui-engineering, api-and-interface-design
**Verify:** browser-testing-with-devtools, debugging-and-error-recovery
**Review:** code-review-and-quality, code-simplification, security-and-hardening, performance-optimization
**Ship:** git-workflow-and-versioning, create-pull-request, ci-cd-and-automation, deprecation-and-migration, documentation-and-adrs, observability-and-instrumentation, shipping-and-launch, memory-management

**Route (meta):** using-lucas-harness — discovers the right skill for a single activity, and for a whole incoming ticket classifies its type and dispatches the calibrated flow across the phases above (see its "Routing an Incoming Ticket" section; activates by description, no slash command); lead-orchestrator — keeps parent accountability while controlled child agents execute Lucas steps through Orca

## Upstream Merge Guide

This repository is a renamed fork of the upstream repository [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills). 

When merging updates from upstream:
- **Folder Names:** Upstream `skills/using-agent-skills` maps to `skills/using-lucas-harness`.
- **Command Namespace:** Upstream prefix `agent-skills:` must be replaced with `lucas-harness:`.
- **Plugin Metadata:** Any references to `agent-skills` or `addy-agent-skills` in configuration files (e.g., `plugin.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`) must remain `lucas-harness`.
- **Documentation:** General occurrences of `Agent Skills` and upstream git URLs should be replaced with `Lucas Harness` and `tinyc0der/lucas-harness` respectively.

## Conventions

- Every skill lives in `skills/<name>/SKILL.md`
- YAML frontmatter with `name` and `description` fields
- Description starts with what the skill does (third person), followed by trigger conditions ("Use when...")
- Every skill has: Overview, When to Use, Process, Common Rationalizations, Red Flags, Verification
- References are in `references/`, not inside skill directories
- Supporting files only created when content exceeds 100 lines

## Commands

- `npm test` — Not applicable (this is a documentation project)
- Validate: Check that all SKILL.md files have valid YAML frontmatter with name and description

## Boundaries

- Always: Follow the skill-anatomy.md format for new skills
- Never: Add skills that are vague advice instead of actionable processes
- Never: Duplicate content between skills — reference other skills instead
