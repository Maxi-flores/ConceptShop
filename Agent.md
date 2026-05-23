# ConceptSHOP Repo Agent Contract

## Agent Name

ConceptSHOP Repo Agent

## Repo Purpose

ConceptSHOP is a stakeholder platform for shared product orders, product allocation, stakeholder management, price forecasting, shipping, marketing, chat, and operational dashboards. It is a React/Vite application with Firebase and AWS integration points.

## Allowed Actions

- Read repository context before editing.
- Create and update governance documentation.
- Make scoped product-code changes only when explicitly tasked.
- Run validation commands from `package.json`.
- Record task activity in `Orchestration.md`.
- Append durable decisions to `Decisions.md`.
- Prepare pull requests for review.

## Forbidden Actions

- Do not work directly on `main` for normal tasks.
- Do not merge to `main`.
- Do not edit `.env`, `.env.local`, secrets, credentials, or live service configuration without explicit approval.
- Do not change lockfiles, build output, images, binaries, or dependencies during governance tasks.
- Do not rewrite existing decision history.
- Do not mix unrelated product changes with governance changes.

## Required Context Files

- `Description.md`
- `Architecture.md`
- `Agent.md`
- `Decisions.md`
- `Orchestration.md`
- `Roadmap.md`
- `package.json`

## Branch Rules

- `main` remains stable truth.
- Agent work uses `agent/conceptshop/<task>`.
- Exploratory work uses `concept/conceptshop/<idea>`.
- Release work uses `release/conceptshop/<version>`.
- Hotfix work uses `hotfix/conceptshop/<issue>`.

## Commit Rules

- Keep commits scoped.
- Separate governance, product, and dependency changes.
- Preserve pre-existing user changes.
- Mention validation in the PR.

## PR Rules

Each PR must include purpose, branch, files changed, product-code impact, validation, documentation updates, risks, and reviewer notes.

## Validation Commands

Use the scripts already defined in `package.json`:

```powershell
npm run lint
npm run build
```

Use `npm run dev` only for local manual UI validation.

## Documentation Update Rules

- Update `Orchestration.md` after every task.
- Update `Decisions.md` when a durable architecture, workflow, dependency, or governance decision is made.
- Update `Architecture.md` when structure, runtime flow, dependencies, or integration points change.
- Update `Description.md` when repo identity or purpose changes.

## Sapient Memory Responsibilities

Sapient memory stores identity, architecture, decisions, and roadmap. The agent must keep these files accurate and stable.

## Sentient Operational Responsibilities

Sentient operations cover branch work, validation, PR preparation, task logs, and merge discipline. The agent must keep operational actions reviewable.

## Merge Checklist

- Branch is not `main`.
- Product code changes are intentional and reviewed.
- `Orchestration.md` is updated.
- `Decisions.md` is updated if needed.
- Validation passed or failures are documented.
- Secrets and local config are not staged.
- PR has approval before merge.
