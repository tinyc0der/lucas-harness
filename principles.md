# Principles for a Good Agent Harness

A good harness helps agents work together across sessions while keeping the user in control. It should optimize for three outcomes:

- **Quality:** build the right thing and show that it works.
- **Speed:** keep work moving without losing the ability to recover.
- **Trust:** make the work easy to inspect, understand, and believe.

Agents run in separate sessions and do not share memory by default. The harness must therefore treat agents as mostly stateless specialists and treat the workflow as the durable source of truth.

## Core Model

The harness separates three kinds of knowledge:

```text
Project memory = durable knowledge reused across many workflows.
Workflow state = task-specific execution state for one workflow.
Session memory = temporary context inside one agent run.
```

Project memory answers: **What should future sessions already know about this project?**

Workflow state answers: **What is happening now?**

Session memory answers: **What does this agent currently have in context?**

The harness should promote knowledge from session memory to workflow state, and from workflow state to project memory, only when it is useful, scoped, evidence-backed, and reviewable.

## Quality

### Build the right thing

Confirm the goal, success criteria, constraints, non-goals, risks, and approval gates before agents begin serious work.

Clear intent should capture:

- Goal
- Success criteria
- Constraints
- Non-goals
- Risk boundaries
- When user approval is required

The output should be concrete enough that an Orchestrator can plan work without silently inventing requirements.

### Make work easy to finish

Split work into units that are ready to dispatch to a session.

A work unit is ready to dispatch when it has:

- One owner role
- One objective
- Clear scope boundaries
- Known dependencies
- Acceptance criteria
- Required evidence
- A question or escalation path

Small work units are easier to implement, review, retry, reassign, and run in parallel. If a unit cannot be handed to one session with a clear completion report, it is too large or too vague.

### Work iterates against evidence, not in one pass

A phase is not a single attempt. It repeats until its acceptance criteria are met by evidence, or until a stop-trigger fires.

The standard inner loop is:

1. Attempt the work unit.
2. Run the acceptance check (test, build, runtime observation, or other required evidence).
3. If the check fails and the cause is diagnosable, adjust and return to step 1.
4. If the check passes, the phase is done — advance.
5. If the check fails and a stop-trigger applies (repeated failure, scope change, irreversible error, missing authority), stop and escalate rather than continuing to loop.

The loop has a bound. Unbounded retry is not persistence — it is a failure to recognize a stop-trigger. If an agent cannot pass the acceptance check within a reasonable number of attempts, it should surface the failure rather than silently continuing.

### Prove it works

A workflow is complete only when the original intent is satisfied and there is evidence that the result works.

Evidence should match the kind of work. It can include:

- Test output
- Build output
- Runtime screenshots
- Diff summary
- Files changed
- Commit IDs
- Reproducible commands
- Known remaining risks

"Looks good" is not enough. The final state should let a future session understand why the workflow was considered complete.

## Speed

### Route work automatically

Classify user input and choose the right workflow, skill, or role without requiring the user to know the harness internals.

The harness should recognize common task shapes:

- Vague idea or intent
- Feature request
- Bug
- Incident
- Refactor or cleanup
- Test request
- Review request
- Documentation request
- Deployment or launch task

It should ask the user only when classification is ambiguous or when different workflows would lead to meaningfully different outcomes. Good routing increases speed and lowers the user's focus cost.

### Resume without rediscovery

Persist enough workflow state that a new session can continue without re-reading the whole conversation.

A workflow is resumable when a new session can answer:

- What is the approved intent?
- What phase is the workflow in?
- What can run next?
- What is blocked?
- What decisions changed the plan?
- What evidence already exists?
- Which sessions, branches, or worktrees own active work?

Resuming work should be normal, not detective work.

### Keep moving safely

Continue automatically when the next action is clear, safe, within scope, and reversible.

The harness should checkpoint before meaningful changes, then continue without asking the user for routine approval. If the user later rejects an assumption or direction, the harness records the correction and rolls back or adjusts from the nearest safe checkpoint.

The harness should stop when continuing would require user judgment:

- Ambiguous intent
- Scope change
- Missing authority
- Irreversible operation
- Security or privacy risk
- Cost or time budget breach
- Public API, schema, or dependency decision
- Deployment or release approval
- Repeated verification failure

### Give each project its own memory

A project should become more efficient over time. Each session, feature, bug fix, review, and failure should leave behind reusable project knowledge.

Project memory should capture durable facts such as:

- Project goals and product direction
- Architecture and important design decisions
- Coding conventions
- Testing and verification commands
- Known risks and fragile areas
- Common failure modes
- Useful implementation patterns
- Rejected approaches and why they were rejected
- Release, deployment, or review requirements
- User or team preferences that apply to this project

This memory should be separate from temporary workflow state.

Workflow state answers: “What is happening now?”

Project memory answers: “What should future sessions already know about this project?”

Project memory must be explicit, reviewable, and evidence-backed. The harness should not silently learn from one-off behavior or unverified assumptions. New memories should come from completed workflows, accepted decisions, verified failures, or user-approved preferences.

## Trust

### Make ownership obvious

Give each role one job so responsibility is visible and agents do not silently take over decisions or work that belongs elsewhere.

At minimum:

- One role owns user intent and approval.
- One role owns dispatch, task graph, assignments, and synthesis.
- Implementation roles own code changes and local verification.
- Review, criticism, and audit roles independently check the result.

When a role needs something outside its authority, it should ask through the workflow rather than taking over.

### Make handoffs explicit

Coordinate isolated sessions through explicit context, questions, decisions, and completion reports instead of hidden chat memory.

At the principle level, this means:

- A session receives a task packet, not just a vague goal.
- A session asks questions through the workflow, not directly through side channels.
- A session returns a completion report with changed files, commands run, evidence, blockers, and risks.
- Decisions are recorded before dependent work resumes.

If a handoff cannot be understood without reading the previous chat, the handoff is incomplete.

### Match scrutiny to risk

Low-risk work may need basic checks. High-risk work needs independent review, criticism, and audit.

Risk should be judged by blast radius and reversibility. Riskier work includes:

- User-facing behavior changes
- Public API, schema, or dependency changes
- Security, privacy, or data handling changes
- Irreversible operations
- Deployments and releases
- Work with weak or missing tests

Verification should become stronger as risk increases, not as a fixed ritual for every task.

## Reference Role Model

One possible role model:

- **Sentinel:** captures user intent, asks user-facing questions, protects user attention, and reports final completion.
- **Orchestrator:** decomposes work, owns the task graph, dispatches sessions, tracks state, and synthesizes reports.
- **Explorer:** researches context, requirements, previous logs, and strategy; does not write production code.
- **Worker:** implements bounded tasks, runs checks, and returns evidence.
- **Reviewer:** checks design correctness, edge cases, maintainability, and interface contracts.
- **Critic:** stress-tests assumptions and looks for gaps, failures, and missing coverage.
- **Auditor:** verifies evidence, provenance, reproducibility, and scope compliance.

The Orchestrator dispatches work but does not implement it. The Sentinel communicates with the user but does not make technical changes.

## Minimal Project and Workflow State

A simple harness can start with durable project memory and retained per-feature workflow state:

```text
docs/
  project.md

  steering/
    index.md
    <domain>.md

  decisions/
    index.md
    0001-record-architecture-decisions.md
    0002-example-decision.md

  runbooks/
    index.md
    <procedure>.md

  intent/<topic>.md
  ideas/<idea>.md

  specs/<slug>/
    spec.md
    plan.md
    memory-delta.md
    review.md
    ship.md
```

Suggested responsibilities:

- `docs/project.md` stores the stable project contract, product direction, and project-level constraints.
- `docs/steering/index.md` maps domain-organized conventions, risks, lessons, commands, and preferences; leaf files load on demand.
- `docs/decisions/index.md` maps dated Architecture Decision Records and their current status.
- `docs/runbooks/index.md` maps repeatable operational procedures.
- `docs/specs/<slug>/memory-delta.md` stores candidate durable knowledge discovered during one feature. It is workflow state, not durable memory.
- On a GO ship decision, verified delta items route to `docs/project.md`, `docs/decisions/`, `docs/steering/`, or `docs/runbooks/` in one reviewable change. On NO-GO, they remain unpromoted.
- Shipped `docs/specs/<slug>/` folders stay in version control so durable entries can link to `review.md` and `ship.md` as provenance.

The exact leaf files can change. The principle should not: project memory, decisions, and workflow state must be explicit, indexed, reviewable, and readable by future sessions.

## Workflow Lifecycle

A typical workflow should move through these phases:

1. **Intake:** capture user intent, constraints, risks, and success criteria.
2. **Memory load:** read `docs/project.md` plus the steering, decisions, and runbooks indexes, then load relevant leaf files on demand.
3. **Specification:** convert intent into a clear spec or task contract.
4. **Planning:** decompose the work into dispatchable units.
5. **Execution:** assign bounded tasks to sessions with explicit handoff packets.
6. **Verification:** collect evidence that the result satisfies the intent.
7. **Review:** apply appropriate review, criticism, and audit based on risk.
8. **Synthesis and ship decision:** integrate reports into a GO/NO-GO result with a rollback plan.
9. **Memory closeout:** on GO, review the feature's single memory delta and route verified items to their canonical homes; on NO-GO, leave it unpromoted.
10. **Closeout:** record final status, evidence, unresolved risks, and next possible work.

These phases are sequential by default but iterative under failure: Verification, Review, and memory closeout can each return work to an earlier phase, and the workflow only advances when each phase's evidence holds. Closeout is the exception — reaching it means the loop has terminated.

The closeout should make the next workflow easier to start.

## Implementation Notes

- **Handoff packets:** A task handoff should include workflow ID, task ID, role, objective, artifacts, relevant files, relevant memory, relevant ADRs, constraints, allowed scope, acceptance criteria, verification commands, question protocol, and completion format.

- **Escalation:** Workers and specialists should not ask the user directly. Questions flow from specialist to Orchestrator to Sentinel to user, and every answer is written back to workflow state.

- **Safe parallelism:** Parallel sessions need isolation and ownership through worktrees, branches, file ownership, task locks, or an explicit merge protocol. Parallel work is not complete until integrated and verified as a whole.

- **Memory retrieval:** Sessions always receive `docs/project.md` plus the three compact indexes, then only the leaf memory relevant to the task.

- **Memory freshness:** Memory should include provenance, confidence, and review triggers when useful. Stale memory should be updated, superseded, or removed.

- **ADR hygiene:** ADRs should be indexed in `docs/decisions/index.md`, searchable, and linked to related feature evidence. Superseded ADRs should stay available, but future sessions should see their status clearly.

- **Conflict handling:** When project memory conflicts with an ADR, the accepted ADR should usually win until reviewed. When two ADRs conflict, the workflow should stop and escalate.

- **Auditability:** A future session should be able to reconstruct why the harness acted, what evidence it used, and what decisions constrained it.

## Summary

A good agent harness should make isolated agent sessions behave like a reliable project team.

It does this by making intent explicit, routing work to clear roles, preserving workflow state, starting from project memory, recording ADRs, proving outcomes with evidence, and improving itself through reviewable memory deltas.

The goal is not just to finish the current task. The goal is to make every future task on the project faster, safer, and easier to trust.
