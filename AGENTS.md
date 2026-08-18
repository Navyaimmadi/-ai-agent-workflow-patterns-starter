# Instructions for Codex

This repository is a beginner's Module 1 lab for the **AI Agentic Engineering & Forward Deployed Engineering (FDE)** course.

## Assignment constraints

- Implement exactly these five workflow patterns: Prompt Chaining, Routing, Parallelization, Orchestrator-Worker, and Evaluator-Optimizer.
- Use the AI SDK directly.
- Keep the workflow logic visible in TypeScript.
- Do not replace the implementations with `ToolLoopAgent`, an agent framework, LangChain, LangGraph, CrewAI, or another orchestration framework.
- Do not fabricate successful runs, logs, screenshots, challenges, lessons, or reflection content.
- Never read, print, commit, or expose the value in `.env`.

## How to work with the student

- The student is new to this code. Explain from the ground up.
- Work on one pattern at a time unless the student explicitly asks otherwise.
- Explain important syntax such as imports, variables, types, functions, parameters, braces, arrays, objects, `async`, `await`, `Promise.all`, loops, and return values.
- Connect each code section to the workflow diagram and the assignment definition.
- Run `npm run typecheck` before and after code changes.
- Make only necessary, verifiable fixes. Do not rewrite working code just to make it different.
- Ask before making a large design change.
- Preserve the recognizable from-scratch workflow logic.
- When a command fails, explain the exact error in simple language before fixing it.

## Completion rules

- A pattern is complete only after the student has run it successfully with a real API key.
- Keep real execution evidence in `logs/` or `screenshots/`.
- Help improve the student's real reflection, but do not invent it.
- Before GitHub submission, verify that `.env` is ignored and no API key appears in tracked files.
