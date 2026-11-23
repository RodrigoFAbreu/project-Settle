# ss-04-server-skeleton

Add the server skeleton with a health endpoint

**Complexity:** low. 2 checkpoint(s) at most, one milestone, one squash-merged pull request, releasable alone. Part of M5.5 (`docs/items/milestone-5-5.md`).

## What to do

Add a `server/` TypeScript package for Node:
- `GET /api/health` returning status and the version; configuration from environment variables (`PORT`,
  `DATABASE_URL`, unused for now); structured logs; graceful shutdown.
- It imports the shared package from the previous slice (even if only for a type) to prove the wiring.
- Tests (vitest), `typecheck`, `lint` and `format:check` for the package, run by a new job in
  `.github/workflows/tests.yml` that `ci.yml`'s `CI passed` gate waits for.

## Rules

- No database, no ledger endpoint and no authentication in this slice.
- Few dependencies; justify any framework in the plan (the Node standard library may be enough).
- The server must not log record contents or any receipt data.

Plans carry the rules in `CLAUDE.md` ("Running under the Controller"). Authentication is out of scope until a later item: nothing trusts an identity yet and the deployment stays on a private network. Real receipts never enter Git.

The plan's header must carry exactly one line of this form, with nothing after the closing backtick: ``Pull request title: `feat: add the Settle server skeleton with a health endpoint` ``.
