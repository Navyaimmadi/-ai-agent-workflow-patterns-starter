# Five Agent Workflow Patterns with TypeScript

This repository is my Module 1 lab for the AI Agentic Engineering & Forward Deployed Engineering course. It implements five workflow patterns from scratch with the AI SDK and visible TypeScript logic. No agent framework is used.

## Patterns

| Pattern | How it works | Proof in the code |
|---|---|---|
| Prompt Chaining | The first model output becomes the second model input. | `outlineResult.text` is inserted into the next prompt. |
| Routing | A classifier selects `technical`, `creative`, or `general`; TypeScript chooses the matching specialist. | `specialistInstructions[decision.route]` performs the route. |
| Parallelization | Three independent workers analyze the same input at the same time. | `Promise.all()` waits for the summary, risk, and question workers. |
| Orchestrator-Worker | A planner creates 2–4 subtasks, workers complete them, and a final call merges the results. | `plan.subtasks.map(...)`, `Promise.all()`, and the merge call form the workflow. |
| Evaluator-Optimizer | A draft is scored and revised until it reaches the quality threshold or the evaluation limit. | A `for` loop, score check, revision call, and maximum of three evaluations control the cycle. |

The implementations are in `src/patterns/`:

```text
01-prompt-chaining.ts
02-routing.ts
03-parallelization.ts
04-orchestrator-worker.ts
05-evaluator-optimizer.ts
```

Shared model and logging helpers are in `src/lib/`. Successful runs are saved under `logs/`.

## Technology

- Node.js 22+
- TypeScript
- AI SDK
- Zod for structured-output validation
- SharedLLM with the `gpt-oss:20b` model

## Setup

Install the packages and create the private environment file:

```bash
npm install
cp .env.example .env
```

Add the SharedLLM key to `.env`:

```text
SHAREDLLM_API_KEY=replace_with_your_sharedllm_api_key
SHAREDLLM_BASE_URL=https://api.sharedllm.com/openai/v1
MODEL_NAME=gpt-oss:20b
```

`.env` is ignored by Git and must never be committed.

Check the TypeScript code without making an API call:

```bash
npm run typecheck
```

## Run the workflows

```bash
npm run chain
npm run route
npm run parallel
npm run orchestrate
npm run evaluate
```

Custom input can be passed after `--`:

```bash
npm run chain -- "Explain APIs to a beginner"
```

Each successful command prints its result and creates a timestamped log. `npm run all` runs every pattern, but individual commands are better for learning and use less credit while troubleshooting.

## What I fixed during testing

### SharedLLM authentication

The AI SDK normally adds a provider `Authorization` header. SharedLLM uses `X-SharedLLM-Key`, so `src/lib/ai.ts` removes the unused provider header while keeping the SharedLLM header.

### Structured output

`gpt-oss:20b` sometimes returned JSON in a format the provider adapter could not parse or validate. I kept the Zod schemas and added focused compatibility handling:

- Routing uses `extractJsonMiddleware()` and explicit `route` and `reason` fields.
- Orchestrator-Worker parses rejected JSON and validates it with `planSchema.safeParse()` before any worker runs.
- Evaluator-Optimizer applies the same strict fallback for `score`, `strengths`, and `improvements`.
- A missing `improvements` list becomes `[]` only when the score already meets the threshold; lower scores still require feedback.

The workflow continues only after Zod confirms that structured data is valid.

## Evidence and progress

- [x] Prompt Chaining ran successfully
- [x] Routing ran successfully
- [x] Parallelization ran successfully
- [x] Orchestrator-Worker ran successfully
- [x] Evaluator-Optimizer ran successfully
- [x] Real execution logs are saved in `logs/`
- [x] `npm run typecheck` passes
- [x] `.env` is ignored and the API key is not tracked
- [ ] `REFLECTION.md` is complete

## Repository

Public repository: [Navyaimmadi/-ai-agent-workflow-patterns-starter](https://github.com/Navyaimmadi/-ai-agent-workflow-patterns-starter)

## References

- [AI SDK documentation](https://ai-sdk.dev/docs/introduction)
- [AI SDK structured data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- [SharedLLM documentation](https://sharedllm.com/docs)
