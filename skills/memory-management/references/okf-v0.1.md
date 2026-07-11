# Lucas Memory Profile for OKF v0.1

This profile applies the [Open Knowledge Format v0.1 draft](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) to Lucas Harness durable project memory. OKF remains the interoperability baseline; the requirements for a root index, project concept, and collection indexes are stricter Lucas profile rules for reliable progressive disclosure.

## Contents

- [Bundle boundary](#bundle-boundary)
- [Required profile](#required-profile)
- [Reserved files](#reserved-files)
- [Links and citations](#links-and-citations)
- [Legacy layout migration](#legacy-layout-migration)
- [Producer and consumer behavior](#producer-and-consumer-behavior)

## Bundle boundary

Use a dedicated bundle so general documentation and feature workflow state are not accidentally subject to OKF conformance:

```text
docs/knowledge/                         # repository-wide bundle
packages/<pkg>/docs/knowledge/          # optional package-owned bundle
```

Each directory is an independent knowledge bundle and unit of distribution. Its concept ID is the concept path relative to that bundle with `.md` removed. For example, `docs/knowledge/steering/auth.md` has concept ID `steering/auth` in the repository bundle.

Keep `docs/specs/<slug>/`, `docs/intent/`, `docs/ideas/`, `docs/migrations/`, and general documentation outside the bundle.

## Required profile

Every bundle contains:

```text
<bundle-root>/
  index.md
  project.md
  steering/index.md
  decisions/index.md
  runbooks/index.md
```

The bundle-root `index.md` declares the version. It is the only index allowed to have frontmatter, and that frontmatter contains only the version declaration:

```markdown
---
okf_version: "0.1"
---

# Project knowledge

* [Project](project.md) - Project contract, direction, and constraints.
* [Steering](steering/) - Conventions, risks, and lessons.
* [Decisions](decisions/) - Architecture decisions.
* [Runbooks](runbooks/) - Operational procedures.
```

Every non-reserved `.md` file is a UTF-8 OKF concept with parseable YAML frontmatter. `type` is required and non-empty; Lucas producers also provide `title` and a one-sentence `description` so indexes and previews remain useful.

For deterministic generation and validation, Lucas producers serialize a flat top-level YAML mapping whose values are scalars or inline scalar lists; quote values containing `#`, `:`, brackets, or other YAML punctuation. This canonical producer subset is still valid YAML. It does not restrict consumers: imported concepts may use any parseable YAML, and unknown or nested extension values must be preserved when round-tripping.

```yaml
---
type: Architecture Decision
title: Use transactional migrations
description: Run schema migrations atomically to prevent partial changes.
tags: [database, migrations]
timestamp: 2026-07-11T00:00:00Z
---
```

Use these descriptive producer defaults while tolerating any unknown type:

| Concept | Default `type` |
|---|---|
| `project.md` | `Project` |
| `steering/**/*.md` | `Project Guidance` |
| `decisions/NNNN-*.md` | `Architecture Decision` |
| `runbooks/**/*.md` | `Playbook` |
| a cross-bundle catalog such as `bundles.md` | `Bundle Catalog` |

`resource`, `tags`, and `timestamp` are optional. Use `resource` only for a canonical underlying asset URI. Use an ISO 8601 timestamp only when it communicates a meaningful content change; git remains the authoritative history.

## Reserved files

`index.md` and `log.md` are reserved at every hierarchy level and are never concept documents.

- A non-root `index.md` has no frontmatter. Organize it under headings and use relative Markdown links with the linked concept's description: `* [Title](path.md) - description`.
- The root `index.md` follows the same body format plus the `okf_version: "0.1"` exception above.
- `log.md` is optional, has no frontmatter, and groups flat bullet entries under newest-first `## YYYY-MM-DD` headings. Do not create it by default because reviewed git history already supplies chronology and attribution.
- An index inventories its own directory. Put links to independent package bundles in a typed `bundles.md` concept, not in a reserved collection index.

## Links and citations

Use standard Markdown links and describe the relationship in surrounding prose.

- Between concepts in the same bundle, prefer absolute bundle-relative links such as `[auth decision](/decisions/0004-auth.md)`.
- Inside an `index.md`, use directory-relative links as shown above.
- For workflow evidence under `docs/specs/`, another package bundle, or any source outside the bundle, use a durable repository or web URL under `# Citations` when portability matters. A checkout-relative `../../specs/...` link is acceptable only when the project deliberately accepts that it will break if the bundle is distributed alone.
- Never rewrite or reject a bundle merely because a cross-link is broken; flag it as drift and continue best-effort consumption.

## Legacy layout migration

Before bootstrap, inspect the active repository or package memory root for any legacy `project.md`, `steering/`, `decisions/`, or `runbooks/` home.

- If any legacy home and `knowledge/` both exist, stop and ask the user to reconcile ownership, even if one looks empty. Never infer that a scaffold is disposable.
- If only a partial or complete legacy layout exists, inventory every file and move the existing artifacts under `knowledge/` in one reviewable change. Derive any missing required project concept or collection index from verified codebase evidence; do not invent or discard content.
- If only `knowledge/` exists, do not migrate. If neither exists, bootstrap directly.

Preflight reserved-name collisions before moving. A legacy `index.md` that is already a directory map can keep that role; a legacy concept named `index.md` or `log.md` must be renamed with user approval and every inbound link rewritten. Treat ambiguous files as a stop condition.

Before reducing an existing rules file to bundle pointers, inventory its content. Promote unique durable facts to their canonical concepts, preserve tool-specific controls in the rules file, and remove only reviewed duplicates. Do not leave compatibility copies or symlinks: two paths would claim to be canonical. Keep feature workflow and general documentation outside the bundle.

## Producer and consumer behavior

Before claiming that a generated bundle conforms, verify recursively that every non-reserved Markdown file has parseable frontmatter and a non-empty `type`, and that every present `index.md` or `log.md` follows its reserved structure.

When reading, syncing, or migrating a bundle:

- tolerate unknown types;
- preserve unknown frontmatter fields or keys when round-tripping;
- tolerate missing optional fields, broken links, and missing optional indexes;
- warn on an unrecognized declared OKF version and attempt best-effort consumption instead of refusing the bundle;
- treat a missing Lucas profile index as a repair candidate, not as base-OKF nonconformance;
- never overwrite human-authored content to normalize formatting.

The permissive consumer contract is part of OKF interoperability. Lucas's required discovery indexes govern what its producers create, not what its consumers are allowed to read.
