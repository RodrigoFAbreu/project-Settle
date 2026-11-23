# ss-02-store-interface

Put the ledger behind a store interface

**Complexity:** medium. 3 checkpoint(s) at most, one milestone, one squash-merged pull request, releasable alone. Part of M5.5 (`docs/items/milestone-5-5.md`).

## What is wrong

`app/src/data/repository.ts` is the ledger's IndexedDB code, and 14 files import it directly (the household
pages, dialogs and forms under `app/src/pages/` and `app/src/features/household/`). A second store cannot be
added without touching every one of them.

## What to do

Extract the seam, with **no change in behaviour**:
- Define a `LedgerStore` interface for the operations `repository.ts` exports today: households, members,
  expenses (including `expensesWithReceiptKey`) and settlements, with the same typed errors
  (`MemberInUseError` and the others).
- Keep the IndexedDB code as one implementation of it (keep `db.ts`, `records.ts` and the migration runner as
  they are).
- Add one place (a small module) that the app imports to get the active store, defaulting to IndexedDB, and
  switch the 14 consumers to it. The import change is mechanical.

## Rules

- Behaviour, UI and stored data do not change; the existing tests (`repository.test.ts`,
  `settlements.test.ts`, `completion.test.ts`, `db.test.ts` and the v1/v2 fixtures) pass unchanged except for
  import paths.
- Do not add a second implementation here, and do not touch the server or any config.

Plans carry the rules in `CLAUDE.md` ("Running under the Controller"). Authentication is out of scope until a later item: nothing trusts an identity yet and the deployment stays on a private network. Real receipts never enter Git.

The plan's header must carry exactly one line of this form, with nothing after the closing backtick: ``Pull request title: `refactor: put the ledger behind a store interface` ``.
