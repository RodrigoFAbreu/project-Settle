# Share the domain types and validators in one package: execution plan (Revision 5)

Pull request title: `refactor: move the domain types and validators into shared/`

- **Work item:** `ss-03-shared-domain` (product, three checkpoints).
- **Plan revision:** 5.
- **Base commit:** `559631680862076e8e7822ddb363ff1417384d0c` (`main`).
- **Backlog page:** `docs/items/ss-03-shared-domain.md`.
- **Registry:** `docs/ai-workflow/registry/ss-03-shared-domain-registry.json`
- **Requirement mapping:** `docs/ai-workflow/requirements/ss-03-shared-domain-mapping.json`
- **Artifact declarations:** `docs/ai-workflow/registry/ss-03-shared-domain-artifacts.json`

## Checkpoints

| id | name | depends_on | complexity | session_target |
| --- | --- | --- | --- | --- |
| CP1 | the shared/ folder, its wiring and the money module | - | 2 | 1 |
| CP2 | the bill model, the saved-bill reader, the household model and the readers | CP1 | 3 | 1 |
| CP3 | the purity guard, the docs and CI, and the build comparison | CP2 | 1 | 1 |
## Goal

ADR 0007 (decision 2) has the later `server/` read and validate records
exactly as the app does, from one shared package. Today the readers
(`app/src/data/records.ts`), the household, expense and settlement types and
validators (`features/household/model.ts`), the bill model and its `LIMITS`
(`features/split/model.ts`), the saved-bill reader (`features/split/draft.ts`)
and the money module (`lib/money.ts`) live inside `app/`. Move exactly those
five modules, and nothing else, into a `shared/` folder at the repository
root that `app/` imports by relative path and a `server/` can import later.

**What the user sees:** nothing. No behaviour, UI or stored data changes.

**What does not change:** the code that moves (the files are moved with
`git mv` and edited only where stated below), the app's tests (they stay in
`app/` and pass with changed import paths only), `db.ts`, the repository and
the stored schema, `app/package-lock.json`, the dependency set, the release
build (`scripts/release/`), the container image (`container/`) and the
release ZIP's contents. No migration: no stored data changes.

## Decisions

- **One new mechanism: a `shared/` source folder, imported by relative
  path.** An app file imports a moved module as, for example,
  `../../../../shared/src/money.ts` (the `.ts` extension stays, as in every
  import today). There is no alias, no `paths` entry and no resolver config.
  **Why not an alias (`@settle/shared`).** `compilerOptions.paths` and
  `resolve.alias` are read by `tsc`, Vite and Vitest only. Node ignores both,
  and four app scripts import app modules directly under Node
  (`scripts/check-requests.mjs` imports `accuracy.ts` and `expectedBill.ts`,
  which import `lib/money.ts` and `split/model.ts`; `measure-local.mjs`,
  `measure-quality.mjs` and `diag-lines.mjs` do the same through
  `accuracy.ts` and the `*.node.ts` modules). With an alias those imports fail
  with `ERR_MODULE_NOT_FOUND` before Chromium starts, and the CI browser smoke
  steps in `.github/workflows/tests.yml` (`node scripts/check-requests.mjs
  scan ...`) fail with them. A relative path resolves identically in `tsc`,
  Vite, Vitest, ESLint and Node (24 strips the types of a `.ts` file under
  `shared/`, which has no `package.json`; checked), so no script invocation,
  CI step or config changes. The cost is longer import specifiers.
- **Why not npm workspaces.** Workspaces hoist every dependency into a root
  `node_modules` and replace `app/package-lock.json` with a root lockfile.
  The app reads `node_modules` at fixed paths in `vite.config.ts`,
  `scripts/vendor-assets.mjs`, `scripts/vendor-paddle.mjs`,
  `scripts/browser.mjs`, and in several tests that call
  `path.resolve('node_modules')`, and the release and CI cache keys name `app/package-lock.json`. A lockfile
  regenerated from scratch can also move a dependency version, which would
  break "the built site is the same". A relative import changes no install step, no
  lockfile and no release script. The cost is that `shared/` has no
  `package.json` and no install of its own, so it is not yet a publishable
  package; `ss-04` gives `server/` its own install and may revisit this.
- **`shared/` stays pure.** It has no dependency of its own and imports
  nothing outside itself: no `app/` file, no npm package, no DOM (so the
  `localStorage` half of the saved-bill module stays in `app/`, see
  "Names"). Its own
  `shared/tsconfig.json` (`lib` ES2023 only, `types: []`) type-checks it
  standalone, so a stray `document`, `react` or `app/` import fails
  `typecheck`, and a guard test (CP3) checks the imports.
- **Names.** The moved files get flat, unambiguous names, because two files
  were both called `model.ts`: `lib/money.ts` to `shared/src/money.ts`,
  `features/split/model.ts` to `shared/src/bill.ts`,
  `features/split/draft.ts` to `shared/src/draft.ts`,
  `features/household/model.ts` to `shared/src/household.ts`,
  `data/records.ts` to `shared/src/records.ts`. Their contents are not
  edited, except the two permitted edits below. `features/split/draft.ts` is
  not moved whole: see the second edit.
- **The first content edit: `displayName`'s translator type.**
  `features/split/model.ts` imports the app's `Translate` type from `i18n/`
  for `displayName`, and `shared/` may not import `app/`. `displayName` keeps
  its body and its callers; its parameter type becomes the structural
  `(key: 'split.people.defaultName', params: { n: number }) => string`, which
  the app's `Translate` is assignable to. Nothing else moves for this.
- **The second content edit: the saved-bill module is split.**
  `features/split/draft.ts` mixes pure readers with two functions that call
  `window.localStorage`, and `shared/` has no DOM. The `git mv` target
  `shared/src/draft.ts` keeps `DRAFT_VERSION`, the private readers
  (`readRatio` to `readItem`) and `readBill`, plus `isObject`, which gains
  `export` because `loadDraft` needs it. `loadDraft`, `saveDraft` and
  `DRAFT_STORAGE_KEY` are cut out and stay in a new, smaller
  `app/src/features/split/draft.ts` that imports `readBill`, `isObject` and
  `DRAFT_VERSION` from `shared/src/draft.ts` and `validateBill` from
  `shared/src/bill.ts`, both by relative path. The `validateBill` import leaves `shared/src/draft.ts` (only
  `loadDraft` used it; `noUnusedLocals` would fail otherwise), and the private
  `type Json = unknown` that `loadDraft` declares is redeclared in the app
  file. Bodies are unchanged. `draft.test.ts` keeps testing through each
  function's new home (the readers from `shared/src/draft.ts`, `loadDraft`/`saveDraft`
  via `./draft.ts`). Importers of `readBill` or `DRAFT_VERSION` (for example
  `records.ts`) point at `shared/src/draft.ts`; importers of `loadDraft`, `saveDraft` or
  `DRAFT_STORAGE_KEY` keep their path.
- **Tests stay in `app/`.** `money.test.ts`, `model.test.ts`, `draft.test.ts`
  and every other test import the moved files by relative path and run
  unchanged otherwise.
  Tests need `vitest` and `jsdom`, resolved from `app/node_modules`, which a
  file under `shared/` cannot see without a hoisted install. The total
  number of tests is therefore the check that nothing was lost.
- **The checks cover `shared/` from `app/`.** `npm run typecheck` also runs
  `tsc -p ../shared`. ESLint 10 refuses files outside its base path when run
  from `app/` (it exits 2), so `lint` becomes
  `eslint . --max-warnings=0 && cd .. && eslint -c app/eslint.config.js --max-warnings=0 shared/src`:
  the second run starts at the repository root, where `shared/tsconfig.json`
  is the nearest project for the typed rules. `app/eslint.config.js` changes
  so the rules reach those files: the static-only block (no network globals,
  no `sendBeacon`) lists `files: ['src/**/*.{ts,tsx}',
  'shared/src/**/*.{ts,tsx}']`, one pattern per run's base path. `format`
  and `format:check` pass `../shared` with `--config .prettierrc.json`. CI
  keeps running `npm run` scripts in `app/`, so no job changes shape.
- **The literal-text guard does not walk `shared/`.**
  `app/src/i18n/literalText.test.ts` walks only `app/src/`. The moved
  modules hold domain logic and no interface text (the one translated string,
  `displayName`'s, goes through the injected translator), and the guard is
  left unchanged: extending its walk and exclusion list is out of scope for a
  behaviour-neutral move. Stated here so the gap is deliberate.
- **Dev server.** Vite's dev server serves only files under its workspace
  root (`app/` here); the config sets `server.fs.allow` so `../shared` is
  served too, which `npm run dev` needs (`scripts/browser.mjs` runs
  `vite preview` over the built `dist/`, which ignores `server.fs.allow`). A
  user-set `server.fs.allow` *replaces* Vite's default rather than adding to
  it, so the list keeps the app root:
  `allow: [searchForWorkspaceRoot(process.cwd()), '../shared']` (Vite's
  documented way to extend the default). Without the first entry the app's
  own lazily loaded modules, workers and `?url`/`?raw` assets answer 403. The
  production build bundles the files and is unaffected.
- **Mechanical import rewriting.** One throwaway script (not committed)
  resolves every import specifier of a moved file to its new place and
  rewrites it to a relative path to the new place; the compiler is the proof that none was missed
  or wrong. Prettier then reflows any line the longer specifier pushed past
  the width. No other edit is made in those files.
- **No open decision is finalized silently.** `docs/TECHNICAL_DECISIONS.md`
  does not exist in this repository, so no "Open decision" row applies; the
  design follows ADR 0007 decision 2.

<!-- CP1 -->
## CP1: the `shared/` folder, its wiring and the money module

**Files:**
`shared/tsconfig.json`,
`shared/README.md`,
`shared/src/money.ts`,
`app/src/lib/money.ts`,
`app/src/`,
`app/vite.config.ts`,
`app/eslint.config.js`,
`app/package.json`

First record the baseline on the base commit, in the scratchpad: the file
list and sizes of `app/dist` after `npm run build`, and the test counts of
`npm test` (99 files, 1694 tests, 1 skipped at the last milestone).

Add `shared/tsconfig.json` and `shared/README.md` (what belongs here and
the three purity rules). Wire the checks: `app/vite.config.ts`
(`server.fs.allow` keeping the app root next to `../shared`, nothing else:
there is no alias for `shared/`), `app/eslint.config.js` (the static-only
block reaches `shared/src/**`) and the four `app/package.json` scripts named
above (`typecheck`, `lint`, `format`, `format:check`). Move `lib/money.ts`
with `git mv` and point its 81 importers in `app/src/` at `shared/src/money.ts`
by relative path. Money is the leaf, so this one module proves the whole
wiring (typecheck, Vite, Vitest, Node, ESLint, Prettier, the build) before the
larger move.

**Tests:** `money.test.ts` stays in `app/` and runs against the moved file.
`npm run typecheck`, `lint`, `format:check` and `npm test` pass with the
same counts as the baseline. `npm run build` passes. **The Node consumers still load:** from `app/`,
`node --input-type=module -e "await import('./scripts/check-requests.mjs')"`
exits 0 (it imports `accuracy.ts` and `expectedBill.ts` under Node, which need
`money.ts`; Vitest cannot detect a break here because Vite resolves the path
itself; its main is guarded, so the import runs no browser), and so does a
link-only import of the modules `measure-quality.mjs` loads: `node
--input-type=module -e "await import('./src/features/receipt/accuracy.ts');
await import('./src/features/receipt/localFixtures.node.ts'); await
import('./src/features/receipt/localReport.node.ts')"`. Importing
`measure-quality.mjs` itself is not a check: it has no entry-point guard, so it
needs a build, the private calibration set and Chromium. The dev server serves
`shared/src/money.ts` and still serves the app's own files: the check starts
`vite` and requests `/@fs/.../shared/src/money.ts`, an app module the HTML
entry does not import (a page module under `app/src/pages/`, plain and with
`?raw`), and each answers 200, not 403. Three
deliberate bad lines in `shared/src/money.ts`, each tried alone and then
reverted: a `document` reference makes `typecheck` fail; a `fetch(...)` call
makes `lint` fail on the no-restricted-globals rule, which proves the
static-only rule reaches `shared/`; and a badly formatted line makes
`format:check` fail. The unchanged test counts prove
Vitest resolves the moved file.

**Migration:** none.
<!-- /CP1 -->

<!-- CP2 -->
## CP2: the bill model, the saved-bill reader, the household model and the readers

**Files:**
`shared/src/bill.ts`,
`shared/src/draft.ts`,
`shared/src/household.ts`,
`shared/src/records.ts`,
`app/src/features/split/model.ts`,
`app/src/features/split/draft.ts`,
`app/src/features/household/model.ts`,
`app/src/data/records.ts`,
`app/src/`

Move the four files with `git mv` to the names above, keeping each file's
other imports pointing at its sibling files in `shared/src/`. Apply the
`displayName` type edit and the `draft.ts` split (second edit above): after
the move, recreate `app/src/features/split/draft.ts` with the cut-out
`loadDraft`, `saveDraft` and `DRAFT_STORAGE_KEY`. Rewrite the importers in `app/src/` (113 files
import the bill or household model, 13 the draft module, 2 the readers;
many import more than one; each draft importer goes to `shared/src/draft.ts` or
stays by the name it uses). `repository.ts`, `db.ts` and the migration runner
keep their code and only change import paths.

**Tests:** the existing suites pass with changed import paths only, with the
same counts as the baseline. The two Node imports of CP1 (the guarded `check-requests.mjs`
and the link-only import of the `measure-quality.mjs` dependencies) exit 0 again, now that `accuracy.ts` also reaches
`bill.ts`: `model.test.ts` (household), `draft.test.ts`,
`split.test.ts`, `billReducer.test.ts`, `repository.test.ts`,
`settlements.test.ts`, `completion.test.ts`, `db.test.ts` and the v1 and v2
fixtures. `git diff -M --stat` shows the four moves as renames with only
import, the one `displayName` change and the `draft.ts` cut inside.
`typecheck` (which now checks `shared/` standalone, so it proves `shared/`
imports nothing from `app/`), `lint`, `format:check` and `npm test` pass.
After the split, `tsc -p ../shared` passes; a `window.localStorage` line
added to `shared/src/draft.ts` makes it fail (tried once, then reverted), so
the no-DOM rule is shown on the one file that had DOM calls.

**Migration:** none; stored data and the migration runner are untouched.
<!-- /CP2 -->

<!-- CP3 -->
## CP3: the purity guard, the docs and CI, and the build comparison

**Files:**
`app/src/data/sharedBoundary.test.ts`,
`app/README.md`,
`CLAUDE.md`,
`.github/workflows/tests.yml`

Add `sharedBoundary.test.ts`: it reads every file under `shared/src/` and
fails on an import that is not a relative path inside `shared/src/` (so no
`app/` path, no `../` that leaves `shared/src/` and no npm package). Update
`app/README.md` (the folder layout, the money and records paths, and a short
section on `shared/` and how it is imported), the testing line in `CLAUDE.md` (the
checks in `app/` also cover `shared/`) and the comments in
`.github/workflows/tests.yml` that describe what the `app` job checks. The
job steps themselves do not change: the browser smoke steps keep running
`node scripts/check-requests.mjs scan ...` as they do today, and the Node
import check of CP1 and CP2 stands in for them where Chromium is missing.

Then compare with the baseline: `scripts/release/build.sh 0.0.0-local` and
`verify.sh` pass, the ZIP's file list equals the baseline's, and
`node scripts/check-build.mjs` passes. Any difference in the built files
beyond a content hash in a file name is reported, not hidden.

**Tests:** `sharedBoundary.test.ts` passes, and fails when a file in
`shared/src/` imports `react`, an `app/` path or a missing file (tried once,
then reverted). All four app checks pass. Browser flows are not run here: the
sandbox may lack Chromium, and the orchestrator records that evidence.

**Migration:** none.
<!-- /CP3 -->

## Out of scope

The `server/` package, the API, a second store, moving `ledgerStore.ts` or
`repository.ts`, the receipt reader and every other module not named above,
npm workspaces, an import alias, a package of its own with a `package.json` for `shared/`,
changes to the release scripts, the container image and the dependency set,
and any refactoring of the code that moves.

## Pull request

`refactor: move the domain types and validators into shared/`. A
behaviour-neutral change, so the release is a patch.
