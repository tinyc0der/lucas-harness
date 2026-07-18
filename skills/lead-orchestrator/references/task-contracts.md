# Lead Orchestrator Task Contracts

Use these templates after loading the current `orchestration` and `orca-cli` skills. Let those skills supply exact commands and flags.

## Controlled child task packet

```text
ROLE
You are a child worker controlled by the lead orchestrator for this active
dispatch. The lead owns the parent request, user communication, task graph,
integration, acceptance, and final completion.

OBJECTIVE
<one bounded, independently verifiable outcome>

WHY THIS TASK EXISTS
<how the result supports the parent acceptance criteria>

INPUTS
- <required files, artifacts, decisions, or prior task results>

DELIVERABLE
- <exact code, report, findings, or artifact to return>

OWNERSHIP
- Allowed writes: <paths or "none; review only">
- Forbidden: <paths, destructive actions, scope expansion>
- Descendants: do not spawn or dispatch child agents unless the lead explicitly authorizes it

DEPENDENCIES
- <task IDs or "none">

ACCEPTANCE AND EVIDENCE
- <test, command, runtime observation, diff, or citations required>

COMMUNICATION
- Send meaningful status updates when they help the lead.
- Send heartbeat only when requested, with the live taskId and dispatchId.
- Use ask for each blocking question and wait for the lead's reply.
- Use escalation when scope, safety, ownership, or recovery requires lead intervention.
- Do not contact the user directly.

COMPLETION
Send exactly one worker_done from this dispatched pane using the live taskId,
dispatchId, and coordinator handle from the injected preamble, on success or
failure. Summarize what changed or was found, evidence, files modified, and what
remains. Then end your turn, send nothing else for this dispatch, and idle.
```

## Awaited-delegation addition

```text
This task uses awaited delegation. Work autonomously from the complete packet.
Do not send routine heartbeats. Ask or escalate only when genuinely blocked or
when the task can no longer be completed inside the stated scope.
```

## Review-only addition

```text
This task is review-only. Do not edit files. Rank findings by severity, cite
paths and lines, explain user impact, and distinguish confirmed defects from
questions. A clean review must name the dimensions checked and residual risk.
```

## Research addition

```text
Return primary evidence, conclusions, uncertainty, and a recommendation. Do not
implement the recommendation unless the task explicitly grants write ownership.
```

## Lead acceptance record

Use this structure internally before closing the parent request:

```text
Parent acceptance criterion: <criterion>
Evidence: <lead-observed test, runtime result, diff, source, or child report>
Child provenance: <taskId + dispatchId when material>
Lead decision: accepted | rejected | needs follow-up
Reason: <why the evidence is sufficient or insufficient>
```

## Scenario checks for the skill

Confirm the lead chooses the correct behavior in each scenario:

1. "Give this to another agent and stop" -> full handoff; no task or wait.
2. "Run this settled test suite and bring back the result" -> awaited delegation; no routine terminal reads.
3. "Use two agents, supervise them, and return the merged result" -> injected interactive-coordination dispatches and lead acceptance.
4. "Fix this one-line typo" -> local execution unless delegation is explicitly required.
5. "Have one agent review and another fix" -> separate review and write ownership; the reviewer cannot edit.
6. "The worker timed out but its terminal is active" -> inspect task state, use terminal output only if diagnosis is needed, and do not duplicate work.
7. "A child asks three blocking questions" -> answer each through orchestration reply; the child may ask repeatedly before worker_done.
8. "The terminal prints done but no worker_done arrives" -> keep the dispatch open; terminal output is not completion authority.
9. "A child wants to spawn its own team" -> deny by default; only the lead may expand delegation authority.
