# MenuCart

**English** | [Español](README.es.md)

[![CI](https://github.com/IvanJMartinezS/menucart/actions/workflows/ci.yml/badge.svg)](https://github.com/IvanJMartinezS/menucart/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

From your menus to your shopping list.

## The problem

Every two weeks, planning meals and writing the shopping list is done by hand, and the same menus end up
being repeated. MenuCart keeps your menus and groceries in one place: you pick the menus for the next two
weeks, check the groceries you need, and it builds the shopping list for you.

## How it works

1. **Save your menus** once, with their ingredients and quantities (for example, _Steak with salad and
   plantain_: 4 steaks, 2 plantains, 1 tomato, 1 onion, 1 lettuce).
2. **Pick the menus** for the next two weeks. A menu can be added more than once.
3. **Check the groceries** you need this time from your default list (pantry, deli…).
4. **Get the shopping list**, with matching ingredients added together and grouped by category: meat,
   vegetables, pantry and deli.

## Project status

🚧 **In development.** The project is built step by step, one small pull request at a time.

- [ ] **v0.1** — Menus, groceries, two-week planning and the combined shopping list. Spanish and English.
- [ ] **v1** — Shared household account, check items while shopping, share the list on WhatsApp, menu photos,
      history to avoid repeating menus, installable app (PWA) and public demo.
- [ ] **v2** — Real-time sync between phones, recipe import with AI and Telegram reminders.

## Tech stack

| Layer      | Technology                                    | Why                                                            |
| ---------- | --------------------------------------------- | -------------------------------------------------------------- |
| Frontend   | React, Vite, TypeScript, Tailwind CSS         | Fast development and a typed, component-based UI               |
| App        | PWA (`vite-plugin-pwa`)                       | Installable on the phone from a single codebase, no app stores |
| Data       | TanStack Query, React Hook Form               | Server state caching and forms with validation                 |
| i18n       | i18next                                       | Spanish and English from day one                               |
| API        | Hono on Cloudflare Workers                    | Lightweight, standards-based API running at the edge           |
| Database   | PostgreSQL with Drizzle ORM                   | Relational data with typed queries and versioned migrations    |
| Validation | Zod (shared package)                          | The same schemas validate data in the frontend and in the API  |
| Quality    | Vitest, oxlint, Prettier, TypeScript (strict) | Fast tests and linting, consistent formatting                  |
| CI         | GitHub Actions                                | Lint, typecheck, tests and build on every pull request         |

## Repository structure

This is a pnpm monorepo:

```text
menucart/
├── apps/
│   ├── web/        # React PWA
│   └── api/        # Hono API on Cloudflare Workers
└── packages/
    └── shared/     # Zod schemas, types and domain logic shared by web and api
```

## Getting started

**Requirements:** Node.js 22 or later (24 recommended, see `.nvmrc`) and pnpm 11.

```bash
pnpm install    # install dependencies
pnpm dev        # start the web app and the API
```

| Command          | Description                   |
| ---------------- | ----------------------------- |
| `pnpm dev`       | Start the web app and the API |
| `pnpm build`     | Build every package           |
| `pnpm test`      | Run the tests                 |
| `pnpm lint`      | Lint the code with oxlint     |
| `pnpm typecheck` | Check types in every package  |
| `pnpm format`    | Format the code with Prettier |

## Workflow

- **GitHub Flow:** `main` is always deployable and protected; every change goes through a short-lived branch
  (`feat/…`, `fix/…`, `docs/…`, `ci/…`, `chore/…`) and a pull request.
- **Conventional Commits:** small, focused commits such as `feat(api): add menu creation endpoint`.
- **Pull requests** must pass CI and are merged with rebase to keep a linear history.

## License

[MIT](LICENSE) © 2026 Ivan Martinez
