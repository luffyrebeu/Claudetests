# CLAUDE.md

This file provides guidance to AI assistants (Claude Code and similar tools) working in this repository.

---

## Repository Overview

**Repository:** `luffyrebeu/Claudetests`
**Status:** Newly initialized — no source code has been committed yet.
**Remote:** Connected via local git proxy.

This repository is in its initial state. When source code is added, update this file to reflect the actual project structure, stack, and conventions.

---

## Current State

The repository currently contains only this `CLAUDE.md` file. There are no:
- Source files or directories
- Configuration files (package.json, pyproject.toml, Makefile, etc.)
- Tests or test infrastructure
- CI/CD pipelines
- Build or deployment configuration

---

## Git Workflow

### Branch Strategy
- Development branch for AI-generated documentation work: `claude/add-claude-documentation-BbWsR`
- Never push directly to `main` or `master` without explicit permission.
- Create feature branches from the designated development branch.

### Commit Conventions
- Write clear, descriptive commit messages in the imperative mood (e.g., "Add user authentication module").
- Keep commits focused — one logical change per commit.
- Reference issue numbers when applicable (e.g., `Fix login bug (#42)`).

### Push Procedure
```bash
git push -u origin <branch-name>
```
Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s) on network failures.

---

## AI Assistant Guidelines

### General Principles
- **Read before editing.** Always read a file before modifying it.
- **Minimal changes.** Only change what is necessary to complete the task. Do not refactor surrounding code, add docstrings, or clean up unrelated areas unless explicitly asked.
- **No speculative abstractions.** Do not introduce helpers, utilities, or abstractions for one-time operations. Three similar lines of code is better than a premature abstraction.
- **No backwards-compatibility hacks.** If something is confirmed unused, delete it outright.
- **Security first.** Never introduce command injection, XSS, SQL injection, or other OWASP Top 10 vulnerabilities. Fix insecure code immediately if spotted.

### File Operations
- Prefer `Edit` over `Write` when modifying existing files (sends only the diff).
- Use `Glob` to find files by pattern; use `Grep` to search file contents.
- Do not create new files unless absolutely required by the task.

### Communication Style
- Be concise. Lead with the answer or action, not the reasoning.
- Use `file_path:line_number` references when pointing to code locations.
- Do not use emojis unless the user explicitly requests them.
- Write in plain, clear language.
- Ask clarifying questions before making assumptions.
- When unsure, say so.

---

## Development Setup

> **TODO:** Fill in once a project stack is chosen.

Typical sections to add here:
- Prerequisites (Node.js version, Python version, etc.)
- Installation steps (`npm install`, `pip install -e .`, etc.)
- Environment variables and secrets management
- How to run the development server

---

## Testing

> **TODO:** Fill in once a test framework is set up.

Typical sections to add here:
- Test runner command (e.g., `npm test`, `pytest`, `cargo test`)
- How to run a single test file or test case
- Coverage requirements or thresholds

---

## Build & Deployment

> **TODO:** Fill in once a build system is configured.

Typical sections to add here:
- Build command (e.g., `npm run build`, `make`)
- How to run production vs. development builds
- Deployment targets and procedures
- CI/CD pipeline overview

---

## Code Conventions

> **TODO:** Fill in once source code is added and conventions are established.

Typical sections to add here:
- Language and framework versions
- Linting and formatting tools (ESLint, Prettier, Black, Ruff, etc.) and how to run them
- Naming conventions (files, functions, variables, classes)
- Module/package structure and import conventions
- Error handling patterns
- Logging standards

---

## Updating This File

Keep this file accurate and current. When making significant changes to the project — adding a new framework, changing the test runner, establishing new conventions — update this CLAUDE.md as part of that same commit or PR. AI assistants should treat stale documentation as a bug.
