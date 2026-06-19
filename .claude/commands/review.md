---
description: Conduct a five-axis code review — correctness, readability, architecture, security, performance
---

Invoke the lucas-harness:code-review-and-quality skill.

Review the current changes (staged or recent commits) across all five axes:

1. **Correctness** — Does it match the spec? Edge cases handled? Tests adequate?
2. **Readability** — Clear names? Straightforward logic? Well-organized?
3. **Architecture** — Follows existing patterns? Clean boundaries? Right abstraction level?
4. **Security** — Input validated? Secrets safe? Auth checked? (Use security-and-hardening skill)
5. **Performance** — No N+1 queries? No unbounded ops? (Use performance-optimization skill)

Categorize findings as Critical, Important, or Suggestion.
Output a structured review with specific file:line references and fix recommendations.

Persist the review to `docs/specs/<slug>/review.md` (resolve `<slug>` from the current git branch — see the Workflow Artifacts map in the `context-engineering` skill) so it survives the session, gives the feature an audit trail, and can be consumed by `/ship`. If no feature directory resolves (e.g. an ad-hoc review outside the workflow), report inline instead.
