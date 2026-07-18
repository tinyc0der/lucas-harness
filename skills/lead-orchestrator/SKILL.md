---
name: lead-orchestrator
description: Lead multi-agent engineering work by composing Lucas Harness lifecycle routing with Orca CLI worktree/terminal control and Orca orchestration task provenance. Use when Codex must remain accountable while controlled child agents execute bounded subtasks, return results, participate in a dependency DAG, ask questions, or provide independent reviews. Trigger for requests to act as a lead orchestrator, run a Lucas workflow through agents, fire a child and wait for its result, supervise or monitor agents, coordinate parallel workers, manage decision gates, or synthesize returned work. Distinguish local execution, awaited delegation, supervised orchestration, and full ownership handoff.
---

# Lead Orchestrator

Remain the single accountable lead for the parent request. Use Lucas Harness to choose the required engineering lifecycle, Orca CLI to place workers, and Orca orchestration to establish controlled task ownership and completion provenance.

## Load the composing skills

Load and follow these skills rather than copying or re-deriving their detailed procedures:

1. Load `using-lucas-harness` to triage the request, classify whole-ticket work, choose lifecycle skills, and preserve every human gate.
2. Load `orca-cli` before operating Orca runtime state, worktrees, or terminals.
3. Load `orchestration` when coordination state, returned results, a DAG, ask/reply, gates, or completion tracking matters.
4. Load any lifecycle skill selected by Lucas Harness for the work being performed.

Treat this skill as the authority and coordination layer. Let the composing skills own exact CLI syntax and engineering procedures. If a required skill or Orca runtime is unavailable, state the limitation; do not imitate Orca provenance with generic agents or plain terminal prompts.

## Preserve the authority model

- Own the user's intent, parent scope, Lucas classification, task graph, priorities, user-facing questions, human gates, integration decisions, acceptance, and final response.
- Tell each dispatched agent explicitly that it is a child worker controlled by the lead for the lifetime of the active dispatch. Capability remains peer-level; authority does not.
- Give children authority only over their assigned objective, paths, and verification. Do not let them redefine the parent goal, approve the overall result, contact the user, reset orchestration, reassign tasks, or spawn descendants unless the lead explicitly delegates that authority.
- Keep final synthesis and parent acceptance with the lead. A child's completion report is evidence, not self-approval.
- Treat `taskId` plus `dispatchId`, validated by Orca from the dispatched pane, as lifecycle authority. Treat terminal handles only as routing metadata.
- Follow the user and active repository rules over this skill. If those rules do not permit child agents, execute locally.

## Select the execution mode for each Lucas step

Choose the mode after Lucas Harness determines which lifecycle step must run:

| Mode | Signal | Action |
| --- | --- | --- |
| Local execution | Delegation adds no meaningful parallelism, isolation, or independent judgment | Execute the Lucas step in the lead session |
| Full handoff | Another agent takes ownership of the remaining workflow and no result must return to this lead | Use `orca-cli`, deliver the brief, create no orchestration task, and stop monitoring |
| Awaited delegation | A bounded step has settled inputs and acceptance, its result must return, and no intermediate coordination is expected | Create a task, inject the dispatch, block on orchestration events, then validate `worker_done` evidence |
| Supervised orchestration | The step has ambiguity, dependencies, risk, multiple workers, likely questions, gates, integration, or remediation | Create tracked tasks and actively coordinate the event-driven workflow |

Treat awaited delegation as a low-touch operating submode of Orca supervised orchestration, not as a new Orca lifecycle. It still requires task/dispatch provenance and a valid `worker_done`; it removes routine monitoring.

Do not use full handoff for a required internal Lucas step when the parent workflow needs its result. Full handoff transfers the remaining Lucas responsibility to the new owner. Do not call plain terminal delegation "orchestrated."

Read [lucas-mode-map.md](references/lucas-mode-map.md) when routing a whole ticket or deciding how to execute a Lucas phase. Upgrade awaited delegation to supervised orchestration when a child asks a question, escalates, discovers broader scope, or requires remediation.

## Run the lead workflow

### 1. Establish context and route the parent request

- Read the repository rules pointer, durable memory, and relevant package guidance.
- Apply Lucas Harness intake and classification to the parent request. State one overridable classification when routing a whole ticket.
- Surface assumptions that materially affect scope or architecture.
- Keep all Lucas human gates at the parent level. Never delegate a gate to a child or use parallel work to bypass it.
- Resolve the Orca executable once and confirm runtime status before any Orca operation. Inspect existing tasks and dispatches when inheriting coordination state.

### 2. Decide whether delegation earns its cost

Create children only when at least one condition holds:

- Two or more workstreams are genuinely independent.
- A fresh-context review materially improves confidence.
- Work requires an isolated checkout, provider, tool surface, or long-running activity.
- A tracked returned-result contract is necessary for reliable completion.

Keep tiny, tightly coupled, user-interactive, human-gated, or integration-heavy work with the lead. Prefer a shallow graph with no more than three or four dependency levels.

### 3. Build bounded task packets

Give every child one independently verifiable deliverable. Define:

- objective and reason;
- required inputs and context;
- exact output or report;
- allowed write scope and explicit non-goals;
- dependencies and integration assumptions;
- acceptance checks and evidence to return;
- escalation path, messaging policy, and completion contract.

Assign non-overlapping write scopes. Use review-only tasks for independent critique and state whether the child may edit. Read [task-contracts.md](references/task-contracts.md) for reusable packets.

### 4. Place and dispatch controlled children

- Use a fresh terminal in the current worktree when the child needs current or uncommitted state.
- Use a separate worktree only for isolated work that can start from its selected Git base. Decide Orca lineage separately from Git base.
- Prefer Orca's agent-first worktree creation when ordinary agent startup is sufficient.
- Wait for agent TUI readiness with an explicit timeout when prompt delivery could race startup.
- Create an Orca task and use injected dispatch for every awaited or supervised child. Verify task and dispatch state before describing the worker as orchestrated.
- Address one live handle per child. Re-resolve a stale handle and continue with the replacement only.

### 5. Wait or supervise through orchestration events

- Use `orchestration check --wait` for `worker_done`, `escalation`, and `decision_gate`; use task and dispatch views for state.
- In awaited delegation, dispatch and block without routine polling, terminal reads, or requested heartbeats. Validate the returned evidence when `worker_done` arrives.
- In supervised orchestration, use the ready-task view as external memory, dispatch independent waves up to capacity, answer blocking `ask` messages through `reply`, and release dependents after authoritative completion.
- Allow children to send multiple meaningful `status` messages, requested dispatch-scoped heartbeats, sequential blocking `ask` messages, and rare escalations before completion.
- Require exactly one dispatch-scoped `worker_done` from the child's own pane on success or failure. After it, require the child to end its turn and send no further messages for that dispatch.
- Use orchestration `reply`, not `terminal send`, to answer a child's tracked question.
- Treat a wait timeout as a checkpoint, heartbeats and terminal activity as liveness, and only valid `worker_done` as dispatch completion.
- Inspect returned evidence and changed files independently. Lifecycle completion does not prove parent acceptance.

### 6. Integrate, challenge, and close

- Reconcile child results against the parent requirements and repository state.
- Run the tests, runtime verification, review, security, performance, ship, and memory steps required by the Lucas route.
- Separate review ownership from fix ownership. A review-only report does not authorize edits; dispatch fixes to the assigned owner or ask a decision gate when ownership is unclear.
- Resolve contradictions through evidence or a user decision. Do not silently average conflicting recommendations.
- Keep Lucas GO/NO-GO and memory closeout with the lead. Run memory closeout sequentially after GO, never inside review fan-out.
- Only declare completion after parent acceptance criteria and every reached human gate are satisfied.
- Report the outcome, verification evidence, material child provenance, remaining risks, and any work intentionally left undone.

## Use terminal output only for diagnosis

- Do not make `orca terminal read` part of the normal coordination loop.
- Use orchestration messages for communication, task/dispatch views for state, `terminal wait --for tui-idle` for readiness, and `worker_done` for completion authority.
- In full handoff, do not read the terminal after prompt delivery except to prevent losing the initial prompt.
- In awaited delegation, read the terminal only during timeout or delivery recovery.
- In supervised orchestration, read bounded terminal output only to diagnose startup failure, a crash, a stuck worker, a bare shell that cannot message, or an escalation requiring output evidence.
- Never accept terminal text such as "done" as completion. Never use `terminal send` in place of orchestration reply for tracked coordination.

## Recover without losing authority

- On `terminal_handle_stale`, list the target worktree and use only the replacement handle.
- After a wait timeout, inspect task state first, then terminal liveness only when needed. Do not duplicate, kill, or retry a worker that is still active.
- Honor Orca's circuit breaker after repeated dispatch failures; escalate rather than loop.
- Never reset runtime-global orchestration state while unrelated coordination may be active unless the user explicitly authorizes abandoning it.
- If work ran outside Orca orchestration, say so. Revalidate through a fresh injected dispatch before calling that work orchestrated.
- Never manufacture `worker_done` or heartbeat messages from the lead's pane. Lifecycle messages must come from the dispatched child.

## Keep the lead visible to the user

Provide concise progress updates during long work without forwarding raw worker chatter. Surface assumptions, meaningful phase changes, human gates, blockers, and evidence. The lead—not a child—speaks for the combined result.
