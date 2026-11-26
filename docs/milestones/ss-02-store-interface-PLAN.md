# Put the ledger behind a store interface: execution plan (Revision 1)

Pull request title: `refactor: put the ledger behind a store interface`

- **Work item:** `ss-02-store-interface` (product, three checkpoints).
- **Plan revision:** 1.
- **Base commit:** `f0bccadd4f6418ad60c7d939af9ada0f520d1e09` (`main`).
- **Backlog page:** `docs/items/ss-02-store-interface.md`.
- **Registry:** `docs/ai-workflow/registry/ss-02-store-interface-registry.json`
- **Requirement mapping:** `docs/ai-workflow/requirements/ss-02-store-interface-mapping.json`
- **Artifact declarations:** `docs/ai-workflow/registry/ss-02-store-interface-artifacts.json`

## Checkpoints

| id | name | depends_on | complexity | session_target |
| --- | --- | --- | --- | --- |
| CP1 | the LedgerStore interface and its IndexedDB implementation | - | 2 | 1 |
| CP2 | the active-store module and the provider | CP1 | 1 | 1 |
| CP3 | switch the 14 consumers and guard the seam | CP2 | 3 | 1 |

## Goal

ADR 0007 (decision 8) gives the app one store interface with two
implementations, the browser's and, later, the server's. Today
`app/src/data/repository.ts` is the browser's implementation and 14 files
import it directly, each passing an `IDBDatabase` as the first argument.
Introduce the seam so a second store is added without touching those files.

**What the user sees:** nothing. No behaviour, UI or stored data changes.

**What does not change:** `db.ts`, `records.ts`, the migration runner, the
stored schema and the existing tests (`repository.test.ts`,
`settlements.test.ts`, `completion.test.ts`, `db.test.ts` and the v1/v2
fixtures), which pass unchanged. No migration: no stored data changes. No
second implementation, no server, no config.

## Decisions

- **One new mechanism: the store seam.** A `LedgerStore` interface, one
  implementation of it over IndexedDB, and one module that hands the app the
  active store.
- **The interface has no database argument.** Each method is the matching
  `repository.ts` function with its leading `db: IDBDatabase` parameter
  removed: `listHouseholds`, `getHousehold`, `createHousehold`,
  `renameHousehold`, `setHouseholdArchived`, `listMembers`, `addMember`,
  `renameMember`, `setMemberLeft`, `deleteMember`, `listExpenses`,
  `getExpense`, `saveExpense`, `deleteExpense`, `expensesWithReceiptKey`,
  `listSettlements`, `getSettlement`, `saveSettlement`, `deleteSettlement`.
  Same arguments, same return types, so a server store can implement it
  without IndexedDB leaking into callers.
- **The shared types and typed errors move to the seam, and are re-exported.**
  `Listed` and the error classes (`HouseholdNotFoundError`,
  `MemberNotFoundError`, `MissingReferenceError`, `MemberInUseError`,
  `ExpenseNotFoundError`, `SettlementNotFoundError`, `MemberLimitError`) are
  defined once in the interface module, because every implementation must
  throw the same classes. `repository.ts` re-exports them, so each existing
  test's `import ... from './repository.ts'` and every `instanceof` check
  keeps working.
- **`repository.ts` keeps its functions.** The IndexedDB code is not
  rewritten or moved; the IndexedDB store is a thin binding that calls those
  functions with its `db`. Existing tests keep calling them with a `db`.
- **The active store is chosen in one place.** A small module builds the
  store for the opened database and returns the IndexedDB one by default.
  `HouseholdDataProvider` still opens the database and owns status,
  revision and cross-tab refresh; its value gains `store: LedgerStore | null`
  (null until the database is ready, exactly as `db` is today) and the
  consumers stop reading `db`. Choosing a different store (ADR 0007
  decision 9) is `ss-11`, not here.
- **`useLoaded` takes the store (flipped in CP3, with its callers).** Its `load` callback becomes
  `(store: LedgerStore) => Promise<T>`; the call sites change
  `(db) => listX(db, ...)` to `(store) => store.listX(...)`. The mechanical
  import change is the 14 consumers, which stop importing `repository.ts`.
- **Guarding the seam without touching config.** A test scans `app/src`
  and fails if a file outside `app/src/data/` imports `repository.ts`
  (test files are exempt: they seed a real database through it). No lint
  rule is added, because the item forbids touching config.
- **No open decision is finalized silently.** `docs/TECHNICAL_DECISIONS.md`
  does not exist in this repository, so no "Open decision" row applies; the
  design follows ADR 0007 decision 8.

<!-- CP1 -->
## CP1: the `LedgerStore` interface and its IndexedDB implementation

**Files:**
`app/src/data/ledgerStore.ts`,
`app/src/data/idbStore.ts`,
`app/src/data/idbStore.test.ts`,
`app/src/data/repository.ts`

Add `ledgerStore.ts` with `LedgerStore`, `Listed` and the seven error
classes moved verbatim from `repository.ts`. In `repository.ts` replace the
definitions with `export { ... } from './ledgerStore.ts'` re-exports (and
import what the file itself still uses); no function body changes. Add
`idbStore.ts` exporting `createIdbStore(db): LedgerStore`, each method
delegating to the repository function of the same name.

**Tests:** `idbStore.test.ts` drives a real (fake-indexeddb) database through
the interface only: create a household with members, add and rename a member,
save, read, replace and delete an expense and a payment, query
`expensesWithReceiptKey`, archive and unarchive; and asserts the typed errors
are the same classes whether imported from `ledgerStore.ts` or
`repository.ts` (`MemberInUseError` on deleting a member an expense names,
`HouseholdNotFoundError`, `MissingReferenceError`). The existing data tests
run unchanged.

**Migration:** none.
<!-- /CP1 -->

<!-- CP2 -->
## CP2: the active-store module and the provider

**Files:**
`app/src/data/activeStore.ts`,
`app/src/data/activeStore.test.ts`,
`app/src/features/household/HouseholdDataProvider.tsx`,
`app/src/features/household/householdData.ts`

Add `activeStore.ts` exporting the one function the app uses to get the store
for an opened database (default: `createIdbStore`). `HouseholdDataProvider`
memoises `store` from `db` and adds it to its context value
(`HouseholdDataValue` in `householdData.ts` gains the field). This checkpoint
is additive: `db`, `useLoaded` and every consumer stay as they are, so the
build and all tests stay green; CP3 moves the consumers.

**Tests:** `activeStore.test.ts` checks the default is the IndexedDB store and
that two calls for one database agree on behaviour. The existing provider and
page tests pass.

**Migration:** none.
<!-- /CP2 -->

<!-- CP3 -->
## CP3: switch the consumers and guard the seam

**Files:**
`app/src/features/household/components/QuickExpenseForm.tsx`,
`app/src/features/household/components/SaveToHouseholdDialog.tsx`,
`app/src/features/household/components/SettlementForm.tsx`,
`app/src/pages/SplitPage.tsx`,
`app/src/pages/households/ExpenseDialog.tsx`,
`app/src/pages/households/ExpenseFormPage.tsx`,
`app/src/pages/households/ExpensesPage.tsx`,
`app/src/pages/households/HouseholdRedirect.tsx`,
`app/src/pages/households/HouseholdShell.tsx`,
`app/src/pages/households/HouseholdsPage.tsx`,
`app/src/pages/households/MembersPage.tsx`,
`app/src/pages/households/OverviewPage.tsx`,
`app/src/pages/households/SettlementDialog.tsx`,
`app/src/features/household/householdData.ts`,
`app/src/features/household/HouseholdDataProvider.tsx`,
`app/src/data/seam.test.ts`

In `householdData.ts`, change `useLoaded` and `useLedger` to the store and
stop importing `repository.ts`. Change each of the 14 consumers to read `store` from `useHouseholdData()` and
call `store.method(...)`, with `if (store === null) return` where it had
`db === null`; `HouseholdsPage` passes `store` instead of `db` to its dialog.
Drop `db` from the context value (and the provider) once nothing reads it. Error handling stays
as it is: `instanceof` checks now name the classes from `ledgerStore.ts` (or
the `repository.ts` re-export, which is the same class).

**Tests:** `seam.test.ts` fails if any non-test file under `app/src` outside
`app/src/data/` imports `repository.ts`. Run the four checks in `app/`
(`npm run typecheck`, `lint`, `format:check`, `npm test`); the existing
tests pass unchanged except import paths, and the household page tests
(`households`, `expenses`, `payments`, `balances`, `history`, `itemised`,
`expenseDialog`, `overviewCharts`) cover the switched consumers end to end.
Browser flows are not run here: the sandbox may lack Chromium, and the
orchestrator records that evidence.

**Migration:** none.
<!-- /CP3 -->

## Out of scope

A second store implementation, the server, the API, choosing the store at
runtime (`ss-11`), changes to `db.ts`, `records.ts`, the migration runner or
stored data, a lint rule, and any configuration or deployment file.

## Pull request

`refactor: put the ledger behind a store interface`. A behaviour-neutral
change, so the release is a patch.
