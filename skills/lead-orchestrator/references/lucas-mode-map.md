# Lucas Harness Delegation Mode Map

Use Lucas Harness to choose the required lifecycle steps. Choose a delegation mode separately for each step.

## Lifecycle phases

| Lucas phase | Default mode | Boundary |
| --- | --- | --- |
| Intake and classification | Local | Keep user intent and classification with the lead |
| Interview and idea refinement | Local | Keep direct user interaction with the lead |
| Research supporting a spec | Awaited | Dispatch settled research questions; lead synthesizes |
| Spec creation | Interactive coordination | Keep product decisions and spec confirmation at the parent |
| Planning and decomposition | Interactive coordination | Coordinate dependencies, ownership, and plan approval |
| Bounded approved build task | Awaited | Use settled inputs, paths, acceptance, and no expected decisions |
| Ambiguous, risky, or multi-task build | Interactive coordination | Coordinate questions, dependencies, integration, and remediation |
| Tests and independent static review | Awaited | Let checks run autonomously and return evidence |
| Interactive or diagnostic verification | Interactive coordination | Coordinate runtime observation and follow-up decisions |
| Mechanical runtime verification | Awaited | Permit autonomous execution only with explicit evidence requirements |
| Ship review fan-out | Awaited | Collect independent findings; keep merged decision with the lead |
| GO/NO-GO, deploy, or destructive action | Interactive coordination | Preserve human gates, rollback ownership, and production safety |
| Memory closeout after GO | Local | Run sequentially after the merged ship decision |
| Entire remaining workflow transferred | Full handoff | New owner continues Lucas; original lead stops |

Do not use full handoff for a required internal step whose result the parent needs. Use awaited delegation or interactive coordination instead.

## Ticket defaults

| Lucas ticket type | Default orchestration |
| --- | --- |
| Epic | Interactive coordination overall; awaited research after the split-framing gate |
| Feature | Interactive coordination across the lifecycle; awaited approved leaf build tasks and review fan-out |
| Task | Local or awaited; interactive coordination when risky, ambiguous, or dependency-heavy |
| Bug | Interactive coordination through reproduction and localization; awaited only after the fix is fully bounded |
| Incident | Interactive coordination for mitigation, recovery, shipping, and postmortem decisions |
| Migration | Interactive coordination overall; awaited inventory, documentation, and review only |
| Improvement: refactor | Local or awaited; interactive coordination for cross-module or behavior risk |
| Improvement: performance | Interactive coordination for the optimization loop; awaited profiling and benchmark runs |
| Spike | Awaited parallel research after the framing gate; lead owns promote-or-drop |
| Chore | Local or awaited; interactive coordination for CI, secrets, deployment, auth, config, or data |

## Mode transitions

- Upgrade awaited delegation to interactive coordination when a child asks, escalates, expands scope, uncovers risk, or requires remediation.
- Return to awaited behavior after the lead resolves the decision and the remaining task is bounded again.
- Treat full handoff as an ownership transfer, not a temporary low-touch state. Reclaiming results requires a new explicit coordination contract.
