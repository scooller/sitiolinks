# Agent Instructions & Project Guidelines (Link Persons / only-models)

This document establishes the mandatory operational instructions, standards, and engineering workflows for all AI coding agents working within this repository.

---

## 1. Skill & Workflow Adoption (Mandatory)

Agents must **actively discover and leverage project skills and workflows** before and during the execution of any task:

1. **Skill Discovery & Execution**:
   - Inspect and utilize skills located in `.agents/skills/`, `.github/skills/`, and system-available skills.
   - When a task involves UI, motion, or styling, consult:
     - `apple-design`: Apple Human Interface Guidelines, Liquid Glass materials, optical icon alignment, touch targets (≥ 44pt), and natural motion curves.
     - `react-best-practices`: Performance, component structure, hook guidelines, and React 18 patterns.
     - `web-design-guidelines`: Accessibility (WCAG AA), contrast ratios, responsive layouts.
     - `tailwindcss-development`: Tailwind utility conventions and theme consistency.
     - `ponytail` (`DietrichGebert/ponytail`): Minimalist engineering and YAGNI principle. Enforce the simplest, shortest solution that works, avoiding speculative abstractions, bloat, and redundant dependencies. Use `ponytail-review` or `ponytail-audit` to detect over-engineering.
     - `caveman` & `caveman-commit`: Ultra-compressed communication, terse code comments, and concise conventional commits.
   - Always read the relevant `SKILL.md` before starting work and apply its heuristics, techniques, and rules without taking shortcuts.

2. **Project Workflows**:
   - Follow and respect continuous integration workflows in `.github/workflows/` (e.g. `react-best-practices-ci.yml`). Ensure changes satisfy linting, type-checking, and build validation.

---

## 2. Codebase Understanding & Architecture Queries: Use Graphify

For all architectural queries, file relationship exploration, dependency mapping, and codebase discovery:

- **Always query Graphify first**: The persistent knowledge graph located in `graphify-out/` represents the god nodes, module interactions, and architectural boundaries of this codebase.
- Consult graphify outputs and query tools to trace call graphs, data flow, and cross-cutting dependencies before modifying core modules.
- Do not make blind assumptions about imports, architectural coupling, or dependencies.

---

## 3. Frontend Architecture: Always Use Redux Toolkit (RTK)

For frontend state management, global store interactions, and API query/cache management in `front-site/`:

1. **Redux Toolkit (RTK) Standard**:
   - Always use **Redux Toolkit (`@reduxjs/toolkit`)** and **RTK Query** for managing application state and data fetching/caching.
   - Avoid fragmented custom fetch patterns or uncoordinated ad-hoc state solutions when handling shared or server state.
2. **RTK Conventions**:
   - Place slices, store configuration, and RTK Query API definitions in standard directories (`src/store/` or `src/features/`).
   - Export typed hooks (`useAppDispatch`, `useAppSelector`) to ensure strict TypeScript safety across components.
   - Leverage RTK Query tags for efficient cache invalidation on mutations (e.g., creating, updating, or deleting galleries, cafes, tickets, or user data).

---

## 4. Versioning, CHANGELOG, and README Maintenance

Whenever code changes, refactors, bugfixes, or new features are introduced, the agent must perform the following documentation and lifecycle updates:

1. **Version Bumping (SemVer)**:
   - Increment the project version in `front-site/package.json` (and root `package.json` if backend/root packages are touched) according to [Semantic Versioning (SemVer)](https://semver.org/):
     - **PATCH** (`0.2.x` → `0.2.x+1`): Bug fixes, style adjustments, minor refactors.
     - **MINOR** (`0.x.0` → `0.x+1.0`): New features, new components, non-breaking architectural additions.
     - **MAJOR** (`x.0.0` → `x+1.0.0`): Breaking changes or significant application overhauls.

2. **Update `CHANGELOG.md`**:
   - Maintain the project root `CHANGELOG.md` following the [Keep a Changelog](https://keepachangelog.com/) standard.
   - Record the new version header with date (e.g., `## [0.2.1] - YYYY-MM-DD`).
   - Group entries into clear categories:
     - `### Added` for new features or components.
     - `### Changed` for changes in existing functionality or design.
     - `### Fixed` for bug fixes.
     - `### Removed` for removed legacy elements.
     - `### Security` for accessibility or vulnerability improvements.

3. **Update `README.md`**:
   - If the changes affect setup instructions, environment variables, dependencies, admin configurations, or user-facing behavior, update the relevant `README.md` (root `README.md` and/or `front-site/README.md`).

---

## 5. Design & Engineering Standards

1. **Apple Human Interface Guidelines (HIG)**:
   - Maintain minimum touch target sizes of 44 × 44 pt.
   - Ensure WCAG AA contrast (≥ 4.5:1 for standard text, ≥ 3.0:1 for large text / graphical badges).
   - Use Apple Liquid Glass two-layer principles: translucent materials with backdrops (`blur(24px) saturate(140%)`) reserved for floating chrome (navbars, popovers, offcanvas), while content stays legible and crisp.
   - Adhere to Apple canonical motion curves (`appleEase = [0.16, 1, 0.3, 1]`) and fluid durations (0.16s - 0.28s).
   - Tab navigation bars should follow canonical icon-stacked-above-label layout with single-word concise labels.

2. **Build Verification**:
   - After applying changes, execute the relevant build and test commands (e.g., `npm run build` in `front-site/`, `php artisan test` or `composer run test` for backend changes) to verify zero build errors before reporting completion.

---

## 6. Mandatory Caveman Mode (ALWAYS Active)

Agents must **strictly adhere to the `caveman` and `caveman-commit` skills across all interactions and tasks at all times**:

1. **Chat Responses (`caveman`)**:
   - **Terse and Direct**: Eliminate filler words, pleasantries ("Sure!", "Certainly!"), hedging, decorative formatting, and tool-call narration.
   - **Dense Technical Substance**: Preserve full technical accuracy, commands, code blocks, and paths while cutting fluff.
   - **Preserve User Language**: If user writes in Spanish, answer in Spanish caveman; if English, answer in English caveman. Keep technical terms, file paths, and code exact.
   - **Pattern**: `[thing] [action] [reason]. [next step].`

2. **Code Comments**:
   - **Terse & Intent-Focused**: Document only non-obvious *why*, never *what* (the code itself states what).
   - **Zero Boilerplate**: No restating function names, param types, or trivial logic.
   - Use compact `ponytail:` annotations when leaving deliberate trade-offs.

3. **Git Commits (`caveman-commit`)**:
   - **Conventional Commits**: Format strictly as `<type>(<scope>): <imperative summary>`.
   - **Imperative & Concise**: Imperative mood ("add", "fix", "remove"), subject line ≤ 50 chars (hard limit 72), no trailing period.
   - **No Fluff**: Never write "This commit does...", no AI attribution, no emoji unless specified. Body included only for non-obvious *why* or breaking changes.

