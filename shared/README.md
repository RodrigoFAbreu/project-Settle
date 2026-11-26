# shared/

The domain types, validators and readers that `app/` and the later `server/`
both use, so a record is read and validated the same way on both sides
(ADR 0007, decision 2).

Today it holds `src/money.ts`. Later modules move in one by one.

## Three purity rules

1. **No dependency of its own.** No npm package, no `package.json`.
2. **Imports nothing outside itself.** Only relative paths inside
   `shared/src/`; never a file in `app/`.
3. **No DOM and no Node.** `shared/tsconfig.json` has `lib` ES2023 only and
   `types: []`, so `document`, `window` or `localStorage` fail `typecheck`.

## How it is imported

By relative path, with the `.ts` extension, for example
`../../../../shared/src/money.ts`. There is no alias, so `tsc`, Vite, Vitest,
ESLint and Node all resolve it the same way.

## Checks

They run from `app/`: `npm run typecheck`, `lint` and `format:check` also cover
this folder. Tests stay in `app/` (they need `vitest`).
