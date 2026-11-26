# Active Milestone

## In progress: ss-03-shared-domain — Share the domain types and validators in one package

M5.5 slice 3. Behaviour-neutral move of five modules into `shared/` at the
repository root, imported by relative path. Three checkpoints. Plan:
`docs/milestones/ss-03-shared-domain-PLAN.md`.

- **CP1 (complete):** `shared/tsconfig.json`, `shared/README.md`, the wiring
  (`vite.config.ts` `server.fs.allow`, `eslint.config.js`, the four `package.json`
  scripts) and `lib/money.ts` moved to `shared/src/money.ts` (rename, 100%
  similar; 81 importers rewritten). `typecheck`, `lint`, `format:check` pass; `npm test`
  1694 passed, 1 skipped (baseline equal); `npm run build` file list and sizes
  identical to baseline. Node imports of `check-requests.mjs` and the
  `measure-quality` dependencies exit 0. Dev server answers 200 for
  `shared/src/money.ts` and for app modules. A `document` line fails `typecheck`, a `fetch` call fails
  `lint`, a badly formatted line fails `format:check` (each tried, reverted).
- **CP2, CP3:** not started.

## Last completed: ss-02-store-interface — Put the ledger behind a store interface

M5.5 slice 2. Behaviour-neutral refactor, three checkpoints: the ledger sits
behind `LedgerStore` (`app/src/data/ledgerStore.ts`, IndexedDB binding
`createIdbStore`, selected by `activeStore(db)`); the 14 consumers read `store`
from `useHouseholdData()`; `app/src/data/seam.test.ts` fails if a non-test file
outside `src/data/` imports `repository.ts`. Accepted on 2026-11-26.

- **Verification:** `typecheck`, `lint`, `format:check` pass; full `npm test`
  passes (99 files, 1694 tests, 1 skipped). Browser flows were not run by the
  implementer.
- **Optional findings:** five, all dropped with reasons (two plan wording, one
  cosmetic parameter name, two seam-guard hardenings no consumer needs yet). See
  `docs/milestones/completed/ss-02-store-interface-findings.md`.
- **Plan:** archived at `docs/milestones/completed/ss-02-store-interface-PLAN.md`.

## Previously completed: ss-01-adr — Record the self-hosted storage decisions

ADR 0007 (`docs/adr/0007-self-hosted-ledger-store.md`), the first slice of
**M5.5 Self-hosted central storage** (14 slices, `docs/items/milestone-5-5.md`).
Docs only, one checkpoint; `docs/ROADMAP.md`'s M5.5 section points at the ADR.
Accepted on 2026-11-25.

- **CP1:** the ADR written. `typecheck`, `lint`, `format:check` and `npm test`
  pass (1685 tests, 1 skipped).
- **Optional findings:** eighteen. Eight fixed in the ADR, four dropped with
  reasons, six follow-ups for ss-09 and ss-11 to settle. See
  `docs/milestones/completed/ss-01-adr-findings.md`.
- **Plan:** archived at `docs/milestones/completed/ss-01-adr-PLAN.md`.

## Earlier: lidl-layout-fixture — Lidl receipt layout as a text fixture

One invented whole-receipt text fixture of the Lidl layout
(`26-pt-lidl-desconto-sublinhado`), so the existing fixture test guards it.
No app code changes. Accepted on 2026-11-22.

- **CP1:** `.txt` and `.expected.json` added under
  `app/src/features/receipt/fixtures/text/`. The expected file is the parser's
  output, checked by hand: seven items summing to the total 34,66, no warnings.
  `typecheck`, `lint`, `format:check` and `npm test` pass (1681 tests); a
  changed price in the `.txt` makes the case fail, and reverting the v0.7.3
  parser fix makes only this case fail.
- **Optional findings:** four, all dropped with reasons. Two note that a text
  fixture cannot guard the v0.7.4 PDF text-layer fix or the v0.7.5 lost-name
  weighed-line fix (both have their own unit tests); two note that the
  invented tax table does not reconcile with the items (the parser ignores
  it). See `docs/milestones/completed/lidl-layout-fixture-findings.md`.
- **Plan:** archived at `docs/milestones/completed/lidl-layout-fixture-PLAN.md`.

## Next action

`/milestone-plan` takes the next backlog item: `ss-03-shared-domain` (share the
domain types and validators in one package). M5.5 is cut into slices (`ss-01` to
`ss-14`, `docs/items/milestone-5-5.md`); the Controller takes them in order, each
is one milestone and one squash PR. `ss-14-deploy-homelab` is homelab-gitops
work, not a Controller item.

## Before that: M5 — Balances and settling up

Settle tells a household who owes whom, exactly, and makes settling up
one press away. Balances are derived from the ledger each time and are
never stored.

- **CP1:** the chart notes and M4's follow-ups:
  - a kit tip shows a mark's value at once (hover, a tap, keyboard
    focus);
  - each bar chart is one Tab stop with roving focus, and the roles are
    fixed (L1-I2);
  - the month on screen isn't a link;
  - M4's O-12 to O-14 are done;
  - the literal-text guard is hardened (R2-O1).
- **CP2:** payments (`Settlement`) and the database's first real
  migration, version 2, which adds the `settlements` store and rewrites
  nothing. A failed upgrade has its own state (O-4). A member named by a
  payment can't be deleted. ADR 0005.
- **CP3:** the balances engine (`features/household/balances.ts`, pure):
  - balances in integer cents, as of a date or over every record, with
    `complete` (M-I-1);
  - the fewest payments, exact up to 16 non-zero balances and above
    that a fallback;
  - explanations, and the payment dialog's outcome;
  - ADR 0006.
- **CP4:** the Balances tab, with Settle up and Mark as paid, Record a
  payment, and balances on a date. Also the payment dialog with its
  "After this…" line, each member's explanation, and the overview's
  balances card. With unreadable records the app fails closed.
- **CP5:** payments in the Expenses history and in their own dialog
  (edit, delete), and the settle-up text to copy or share.
- **CP6:** the completion scenario with payments across the real
  version-1 to version-2 upgrade, the screens check (20 screens), the
  design and privacy checks, the docs and the design canvas
  (version 31).
- **Review rounds:** the design canvas updates, the Portuguese 360 px
  pass, the "paga a" wording and the share-bar tip check (round 1);
  completed CI evidence (round 2's manual review).

Verification:
- `npm run check` passes: typecheck, lint, format and 96 test files
  (1703 passed, 1 skipped). `npm run build` and `check-build.mjs` pass.
- The screens check: 20 screens, 204 checks, 0 problems; evidence in
  `docs/milestones/milestone-5-evidence/`.
- `app`, `workflow-conformance` and `pr-title` are green on GitHub
  (PR #13).
- Implementation review: round 1, local REVISE, fixed. Round 2: local
  APPROVE, then manual REVISE, only for the CI evidence. Round 3, the
  same content: local and manual APPROVE. Technical approval `fc6f337`.
- Functional review: round 1 checklist `e63f550`; no findings were
  written; the user accepted the milestone on 2026-10-11.

Carried forward (not blockers):
- From M5's reviews:
  - check a payment's content in the repository, not only in the form,
    once M6's import writes records without the form;
  - keep the exact-versus-fallback wording accurate in product copy:
    the fewest payments up to 16 non-zero balances; above that, at most
    n − 1 payments.
- From M5's roadmap entry: "Mark a period as settled" (Useful, not
  built).
- From M4: the add-member form's "full" counts only today, while the
  repository refuses any day over 20 (O-6).
- Backup, export and sync, without which browser storage can be
  evicted: M6.

From M3 and earlier, still open:
- A Ctrl/⌘-click on a split step link leaves a harmless focus request
  pending (R3-O2); skip `onSelect` for modified clicks if it gains other
  uses.
- Recent splits and the running "so far" total appear on the design
  canvas for later milestones.
- **The M2.5 iPhone checks** (Lockdown Mode on and off for the site)
  are still not run; suggest them at the next real-phone testing (M7,
  the PWA and deployment).
- From M2.5: the 94 % reading aim (more real receipts, then perhaps the
  opt-in "enhanced reading"), remembering the user's corrections, and
  receipts from other countries.

## Current blockers

None.

## Active plan

None. The last plan, `ss-02-store-interface`'s, is archived at
`docs/milestones/completed/ss-02-store-interface-PLAN.md`.

## Functional review checklist

Item `ss-02-store-interface` (behaviour-neutral refactor: the ledger sits
behind `LedgerStore`; the user sees no change). Automated checks run offline in
`app/`; the browser flows need a build and Chromium, so a sandbox without them
reports those flows as not run.

**Setup:** branch `feature/ss-02-store-interface`, clean tree. In `app/`:
`npm ci` (once), then `npm run dev` (or `npm run build && npm run preview`)
for the browser flows. No feature flags.

**Test data:** a fresh browser profile (no data), and optionally a profile that
already holds a household with members, a few expenses and one settlement
(create them in flow 4; reuse them in flow 5 to prove nothing was lost).

**Flows**

1. **Automated checks.** In `app/`: `npm run typecheck`, `npm run lint`,
   `npm run format:check`, `npm test`. Expected: all pass (99 files, 1694
   tests, 1 skipped).
2. **The seam holds.** `npx vitest run src/data/seam.test.ts`. Expected: 2
   tests pass. Then add `import '../../data/repository'` to a non-test file
   under `src/pages/` and re-run: the test fails naming that file. Revert the
   change.
3. **The store is tested through the interface.** `npx vitest run
   src/data/idbStore.test.ts src/data/activeStore.test.ts`. Expected: pass;
   the tests call `LedgerStore` methods only, and `activeStore(db)` returns
   the IndexedDB binding.
4. **Household flows in the browser (no change from before).** Create a
   household, add two members, add an expense (quick expense and the full
   form), edit it, delete it, record a settlement, and view Overview balances.
   Expected: each step works as on `main`; balances are exact and settling up
   zeroes them.
5. **Data persists across reload.** Reload the page, then reopen the household
   from the list. Expected: members, expenses and settlement are all still
   there; a profile created on `main` before switching branches also loads.
6. **Split page and save-to-household.** On the Split page, split a bill and
   use "save to household". Expected: the expense appears in that household's
   Expenses.
7. **Scope.** `git diff f0bccad..HEAD --stat` outside `docs/ai-workflow` and
   `.ai-review` shows only `app/src/data/`, the provider, `householdData.ts`,
   the 14 consumers under `app/src/features/household` and `app/src/pages`,
   `docs/ACTIVE_MILESTONE.md` and the plan.

**Known limitations / out of scope:** no server, API, schema or deployment
change, and no store-selection config (later slices, `ss-03` onward). IndexedDB
stays the only store. No stored-data change, so no migration. The browser flows
(4-6) were not run by the implementer.

<!--
This file is `workflow_state.FUNCTIONAL_CHECKLIST_PATH`. It is
repository-local state: workflow-manager generates it once at bootstrap and
never overwrites it on update.
-->
