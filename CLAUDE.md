## Commits

Only the repository owner commits. Never run `git commit`, `git commit --amend`, `git rebase`, `git merge`, or `git push`, even when the work looks finished and the tests pass. Leave your changes in the working tree, summarize them, and let the owner review and commit them. This applies to every change in the repository, `.shipbench/` included.

## Project Conventions

- **Path aliases:** `#/*` and `@/*` both resolve to `src/*`
- **Formatting/linting:** Biome — run `pnpm check` before committing
- **Type checking:** `pnpm typecheck`
- **Auth:** All authenticated routes live under `/_authenticated`. Server functions touching user data must call `requireAuth()` / `getAuthUserId()` and use the returned `userId` — never trust client-supplied user IDs
- **DB access:** Use `getDb()` from `src/db/client.ts` inside server functions only
- **Migrations:** After schema changes run `pnpm db:generate`, then `pnpm migrate:local` to apply locally
- **Queries pre-warmed by router loaders.** Read queries on data-driven routes are pre-warmed via `queryClient.ensureQueryData` in the route loader, using `*QueryOptions(...)` factories from the feature's `*-queries.ts`. Components keep their `useQuery` calls; loader-backed routes don't render `isLoading` branches because the data is already in cache on first render.

### Component Structure

- **`src/components/ui/`** — Radix UI primitives wrapped and styled with Tailwind. Reusable base components only (e.g. Button, Dialog, Checkbox, etc.)
- **`src/components/`** — App-level shared components (layouts, nav, global drawers)
- **`src/features/`** — Feature modules. Pattern per feature:
  - `[feature]-service.ts` — server functions
  - `[feature]-queries.ts` — TanStack Query hooks + `*QueryOptions` factories
  - `[feature]-model.ts` — types + Zod schemas
  - `[feature]-helpers.ts` — pure utility functions (state derivation, date math, etc.)
  - `[feature]-constants.ts` — constants (only when needed)

## ShipBench task board

This project tracks work on a ShipBench board in `.shipbench/`. Read `.shipbench/AGENTS.md` for the frontmatter schema, dependency semantics, and board ordering rules. That file is the authority on those topics, so this section does not repeat them.

**One caveat on that file**: `init` writes `AGENTS.md` once and an upgrade never refreshes it (`init` does not change an existing project), so it falls behind the installed CLI. It was last hand-synced to 0.5.0 on 2026-09-28, and its version banner says so. If the banner shows an older version than `shipbench --version`, trust `shipbench <cmd> --help` over the file, and re-sync the file.

To re-sync, run `shipbench init --name marching-orders` in a scratch git repo to get the current template, then diff it against ours. Copy over anything the template has that ours lacks. Keep our additions: the version banner, the `review` column in the status rule (the template hardcodes the default columns), the "Send finished work to review" operation (the template's "Complete a task" moves to `done`), and any flag that `--help` lists but the template leaves out.

Columns: `todo` -> `in-progress` -> `review` -> `done`.

### Working loop

```bash
shipbench task list --available --json   # ranked candidates, deps satisfied
shipbench task get <slug>                # full description before starting
shipbench task move <slug> --to=in-progress
# ... do the work ...
shipbench task comment <slug> "What changed and why."
shipbench task move <slug> --to=review
```

`--available` ranks tasks by priority, then by age. Treat the first result as a suggestion, not an assignment. `depends_on` is the authoritative dependency signal. Prose sections such as `## Depends on` in a task body are only commentary.

### Writing task bodies

`task create`, `task edit`, and `task comment` each take `--body <text>` or `--body-file <path>` (`-` reads stdin). Never hand-edit a description into the `.md` file. The CLI owns slug generation, validation, and the `updated` timestamp. `task edit` replaces the description and leaves the `## Task Updates` section alone.

**Use `--body-file` for anything longer than one line.** ShipBench reads the file as UTF-8, so the text never goes through shell quoting. Multi-line prose that contains backticks, em dashes, or apostrophes will eventually break a heredoc on Windows. A temp file will not.

```bash
shipbench task create "Title here" --status=todo --priority=high \
  --tags=security,bug --body-file=/path/to/body.md
shipbench task edit <slug> --body-file=/path/to/body.md    # replaces description whole
```

### Agent work ends at review

**Never move a task to `done`.** `review` is the column for human review, and agent work stops there. To report a task as finished, move it to `review`, say so in your response, and leave it there. Only a human promotes a task from `review` to `done`, because only a human has reviewed it.

This rule holds even when the work looks clearly complete, the tests pass, and nothing is left to do. Passing tests do not count as review.

### Board rules

- Reorder tasks only when asked to. Never reorder as a side effect of other board work.
- Do not read `layout.json` as the visible order, and never hand-edit it. The CLI owns it.
- Do not modify `config.json` unless asked.
- Do not touch `tasks/archive/` unless asked about archived work.
- Use `shipbench task comment` for facts tied to a point in time: a decision, a change of direction, a blocker hit partway through a task. Use `shipbench task edit` for facts that stay true no matter when they were learned. `task edit` rewrites the description and leaves the Updates section unchanged.
