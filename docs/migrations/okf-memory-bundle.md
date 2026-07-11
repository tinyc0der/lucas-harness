# Migration: Durable Memory to an OKF Bundle

- **Status:** Required when adopting the OKF-enabled `memory-management` skill
- **Old layout:** Durable homes directly under `docs/` or `packages/<pkg>/docs/`
- **Replacement:** An [Open Knowledge Format v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) bundle under the corresponding `knowledge/` directory
- **Reason:** OKF conformance applies recursively to a bundle. A dedicated boundary keeps feature workflow and general documentation outside the knowledge schema.

## Path mapping

| Legacy path | OKF bundle path |
|---|---|
| `docs/project.md` | `docs/knowledge/project.md` |
| `docs/steering/` | `docs/knowledge/steering/` |
| `docs/decisions/` | `docs/knowledge/decisions/` |
| `docs/runbooks/` | `docs/knowledge/runbooks/` |
| `packages/<pkg>/docs/project.md` | `packages/<pkg>/docs/knowledge/project.md` |
| `packages/<pkg>/docs/{steering,decisions,runbooks}/` | `packages/<pkg>/docs/knowledge/{steering,decisions,runbooks}/` |

`docs/specs/`, `docs/intent/`, `docs/ideas/`, `docs/migrations/`, and general documentation do not move. They are not OKF concepts.

## Safety gate

Inspect each repository or package scope before changing files:

- If any legacy path and `knowledge/` both exist, **stop and reconcile ownership with the user**, even if one tree looks empty. Do not infer that a scaffold is disposable.
- If only a partial or complete legacy layout exists, inventory and migrate every existing artifact in one reviewable change; derive missing required profile files from verified codebase evidence.
- If only the OKF bundle exists, do not run this migration.
- If neither exists, bootstrap a new OKF bundle instead of creating legacy paths.

## Migration steps

1. Inventory the existing legacy homes and the active rules file. Record which profile files are absent; do not assume all four legacy homes exist.
2. Preflight reserved-name collisions. Keep an `index.md` that is already a directory map; rename any concept using `index.md` or `log.md` with user approval, then rewrite all inbound links. Stop when a file's role is ambiguous.
3. Move every existing legacy artifact under `<memory-root>/knowledge/` without changing its substantive content. Derive missing required profile files from verified codebase evidence.
4. Create `<memory-root>/knowledge/index.md` with only `okf_version: "0.1"` in its frontmatter, followed by heading-grouped links to `project.md`, `steering/`, `decisions/`, and `runbooks/`.
5. Add parseable YAML frontmatter to every non-reserved Markdown concept. Require a non-empty `type`; also add `title` and a one-sentence `description` used by indexes.
6. Remove frontmatter from collection `index.md` files. Keep their heading-grouped, directory-relative links and descriptions.
7. Rewrite concept-to-concept links as bundle-relative links such as `/decisions/0001-example.md`. Keep feature evidence outside the bundle as a durable repository/web citation, or explicitly accept a checkout-relative link that will not survive standalone bundle distribution.
8. Before reducing `AGENTS.md`, `CLAUDE.md`, or another rules file to bundle pointers, route its unique durable facts to canonical concepts and preserve its tool-specific controls. Remove only reviewed duplicates, then point to `<bundle-root>/index.md` and `<bundle-root>/project.md` for session-start loading.
9. Search for remaining producer or consumer references to the legacy paths and update them. Do not leave compatibility copies or symlinks; they create two canonical homes.

## Default concept types

| Home | `type` |
|---|---|
| `project.md` | `Project` |
| `steering/**/*.md` | `Project Guidance` |
| `decisions/NNNN-*.md` | `Architecture Decision` |
| `runbooks/**/*.md` | `Playbook` |

Preserve unknown producer-defined frontmatter keys. `resource`, `tags`, and `timestamp` remain optional.

## Verification

- Every repository or package bundle has its own root `index.md` and `okf_version: "0.1"` declaration.
- Every non-reserved `.md` file within each bundle has parseable frontmatter and a non-empty `type`.
- `index.md` and any `log.md` follow their reserved OKF structures.
- No legacy durable paths remain after a successful migration.
- Feature workflow paths still resolve under repository `docs/specs/<slug>/`.
- Rules-file pointers and index links open the new canonical locations.
- Unique durable rules-file facts were promoted and tool-specific controls were preserved before duplicate content was removed.
- The migration is a reviewable diff, and no human-authored content was silently discarded.
