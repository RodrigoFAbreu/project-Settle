# ss-03-shared-domain

Share the domain types and validators in one package

**Complexity:** medium. 3 checkpoint(s) at most, one milestone, one squash-merged pull request, releasable alone. Part of M5.5 (`docs/items/milestone-5-5.md`).

## What to do

The server must read and validate records exactly as the app does. Move what both need into one place that
the app and a later `server/` package can import, with **no change in behaviour**:
- the record types and their readers (`app/src/data/records.ts`) and the household/expense/settlement types
  they produce;
- the money module (`app/src/lib/money.ts`) and the validation and limits the ledger relies on (for example
  `LIMITS`).

Choose the least invasive packaging and justify it in the plan: npm workspaces at the repository root with
`app/`, `shared/` and later `server/`, or a plain `shared/` source folder consumed through path aliases.
Whatever is chosen must keep `npm ci`, `npm run build`, the CI jobs, the release build (`scripts/release/`)
and the container image build working.

## Rules

- No behaviour change: the app's tests pass unchanged except for import paths, and the built site is the
  same.
- Keep the change mechanical; do not refactor the code that moves.
- Update the CI and docs that mention paths (`.github/workflows/tests.yml`, `app/README.md`,
  `CLAUDE.md`'s testing line) and keep the release ZIP's contents identical.

Plans carry the rules in `CLAUDE.md` ("Running under the Controller"). Authentication is out of scope until a later item: nothing trusts an identity yet and the deployment stays on a private network. Real receipts never enter Git.

The plan's header must carry exactly one line of this form, with nothing after the closing backtick: ``Pull request title: `refactor: share the domain types and validators in a workspace package` ``.
