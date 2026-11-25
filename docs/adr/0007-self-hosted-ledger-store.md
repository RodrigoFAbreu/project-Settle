# ADR 0007 — A self-hosted ledger store: PostgreSQL behind a small API

- **Status:** Accepted by the merge of this pull request. Under the
  autonomous gate policy the Controller merges the accepted commit, so the
  merge is the owner's acceptance and no later slice has to flip this line.
- **Date:** 2026-11-24
- **Milestone:** M5.5 — Self-hosted central storage
  (`docs/items/milestone-5-5.md`; slices `ss-01` to `ss-14`)
- **Builds on:** ADR 0001 (the web app, the CSP, the SPA fallback), ADR 0005
  (the ledger's records and write contract), ADR 0006 (balances and
  settlement).

## Context

ADR 0005 keeps the household ledger in the browser's IndexedDB. A second
device, or a second browser on the same computer, starts empty. For one
person with several devices, or roommates sharing a household, that is the
main limit of the local-first product.

M5.5 lets a self-hosted deployment keep the ledger in a database on the
server, so every browser shows the same data. The static, local-first build
must keep working unchanged. This ADR is the one place that says how the
server, the API and the app fit together; each slice below builds to it.

Decisions 1 to 4 were made by the owner on 2026-11-23 and are recorded as
given. Decisions 5 to 11 are **proposals** with reasons; the owner reviews
them in this pull request, and merging it accepts them.

## Decisions

### 1. PostgreSQL, on the cluster (owner)

The ledger lives in PostgreSQL, deployed as its own workload on the homelab
cluster, using the `postgresql` and `local-storage` charts and the
existing backup and restore tooling. Built by `ss-06` (schema and migration
runner) and deployed by `ss-14`.

### 2. A TypeScript server on Node, sharing the app's code (owner)

The server is TypeScript on Node. It imports the app's record types,
validators and money module from one shared package, so a record is
validated the same way on both sides and money stays exact (M1's
`allocate`). Built by `ss-03` (shared package) and `ss-04` (server
skeleton with a health endpoint).

### 3. One image, one origin (owner)

One server image serves the built site and the API on the same origin, so
the app's strict same-origin Content-Security-Policy (ADR 0001) stays
unchanged. PostgreSQL is its own workload. The static nginx image stays for
local-first deployments. Built by `ss-05`.

### 4. Online-only in server mode (owner)

Every record carries a version, a write with a stale version is rejected
with HTTP 409, and the app reloads the record. There is no offline queue in
the first version: an unreachable server shows a clear error. The
local-first build is unchanged. The app side is built by `ss-10`.

### 5. The API: JSON under `/api/v1` (proposal)

Resources nest under their household: `/households`, `/households/{id}`,
`.../members`, `.../expenses`, `.../settlements`. A record is read with
`GET`, written with `PUT` (create or replace) and removed with `DELETE`.
Errors use `application/problem+json` with a stable `code`, so the app
shows its own translated message and never the server's text.

*Why:* nesting mirrors ADR 0005's `byHousehold` indexes and makes "this
member belongs to this household" a property of the URL. `PUT` with a
client id is idempotent. A stable `code` keeps wording in the app, where
the languages live (ADR 0004). Reads are built by `ss-07`, household and
member writes by `ss-08`, expense and settlement writes by `ss-09`.

### 6. Ids are client-generated; versions are server-owned (proposal)

Ids stay client-generated, as today, so a `PUT` of the same record twice,
and a later import, change nothing the second time.

Each record carries a server-owned integer `rev`, separate from the
record's own format version `v` (ADR 0005). It travels as the `ETag` of a
read and as `If-Match` on `PUT` and `DELETE`; `If-None-Match: *` means
"create only". A stale or already-existing write answers 409 with the
current record, and the app reloads it. A write with no precondition
answers 428. A 409 whose current record equals the record sent counts as
success for the import, so a re-run import reports no conflicts for records
it already wrote (`ss-12`).

*Why:* keeping `rev` apart from `v` means a format upgrade never looks like
an edit, and an edit never looks like a format change. Standard HTTP
preconditions need no custom protocol.

### 7. The server keeps ADR 0005's write contract (proposal)

References (the household exists, both members belong to it) are re-checked
inside the write's own database transaction, and a member named by any
expense or payment can't be deleted (409 with a `code`). A body that fails
validation answers 422 with a `code`. `ss-08` and `ss-09` build to this.

*Why:* PostgreSQL could enforce part of this with foreign keys, but the
contract is the same one the browser store honours, so both stores can be
tested against the same cases (`ss-02`).

### 8. What is shared and what stays per device (proposal)

- **Shared:** households, members, expenses, settlements.
- **Per device:** theme, language, region, the bill being edited, the
  receipt summary and the last-household pointer.

*Why:* the second group describes one person's screen or one unsaved
draft, not the household's money. The app reaches the shared group through
a store interface with two implementations, the browser's and the
server's (`ss-02`, `ss-10`).

### 9. How the app learns which store to use (proposal)

The server serves a small `settle-config.json` at the site root
(`/settle-config.json`) naming the store (for example
`{"store":"server"}` plus a format version). The rule is stated by the
response, not by a status: **server mode applies only on a 200
`application/json` body that validates.** Local-first applies only to an
answer that proves there is no server: a 404, or a non-JSON body such as
the `index.html` the static image returns with 200 `text/html`
(`container/nginx.conf`'s `location /` has `try_files $uri /index.html`,
and ADR 0001 D11 requires the same SPA fallback on every static host).

Anything else means the app can't tell which deployment it is on, or knows
it is on a server one it can't use, so it shows the online-only or
configuration error and never falls back to an empty local ledger that
would diverge from the server. That covers a network error, a 5xx, and a
200 `application/json` body that fails validation, such as a config naming
a format version this copy of the app doesn't know (only the server image
answers with JSON).

One release ZIP therefore runs both ways, with the CSP unchanged. Built by
`ss-11`.

### 10. Room for sign-in later (proposal)

Every request passes through one function that returns an identity, which
handlers receive. Today it returns a fixed anonymous identity and nothing
trusts it, so the deployment stays on a private network. Adding
authentication later changes that one function, not the routes. The
function is introduced with the server skeleton (`ss-04`).

### 11. Data protection (proposal)

A server holds other people's financial data.

- **What is stored:** what the ledger records hold today (ADR 0005):
  household and member names, each member's joined and left dates, a
  household's archive date, the records' created and updated timestamps,
  each expense's description, category, date, payer and shares, and each
  payment's amount, date and note. An itemised expense also keeps its
  bill's line items, person names, tax, tip and discount, the receipt's
  shop name, shop tax number, date and total, and a duplicate-receipt key
  built from the shop's tax number and the fiscal document's id. No
  receipt images and no payment or customer data from the receipt: receipt
  reading stays in the browser and only that structured result is saved.
- **Access control** is the network, until accounts exist. Anyone who can
  reach the deployment can read and change all of it.
- **Backups** carry the same data and need the same care as the database.
- **Deleting a household** deletes it from the database too, with its
  members, expenses and settlements, not only from the app's view.

*Relation to other milestones:* M6's export, import and backup are the
portable copy of the data and a second way into the server. M14's accounts
and sync replace the private-network assumption. The one-time import of a
browser's existing data is built by `ss-12`.

## Slices

| Slice | Builds |
| --- | --- |
| `ss-02-store-interface` | the ledger behind a store interface (decision 8) |
| `ss-03-shared-domain` | the shared types, validators and money (decision 2) |
| `ss-04-server-skeleton` | the Node server, health endpoint, identity function (decisions 2, 10) |
| `ss-05-server-image` | the one image for site and API (decision 3) |
| `ss-06-db-schema` | PostgreSQL schema and migration runner (decision 1) |
| `ss-07-api-read` | read endpoints (decision 5) |
| `ss-08-api-write-households` | household and member writes (decisions 5 to 7) |
| `ss-09-api-write-ledger` | expense and settlement writes (decisions 5 to 7) |
| `ss-10-http-store` | the app's HTTP store (decisions 4, 6) |
| `ss-11-store-selection` | choosing the store from `settle-config.json` (decision 9) |
| `ss-12-import-local` | importing this device's data (decisions 6, 11) |
| `ss-13-two-browsers-e2e` | two browsers against one server |
| `ss-14-deploy-homelab` | deploying the server and PostgreSQL (decisions 1, 3) |

## Consequences

- The app gains a second store; the local-first build and its tests are
  unchanged, and a schema change in either store needs a migration step.
- A self-hosted deployment is online-only. A server outage stops edits; it
  does not corrupt the local-first build.
- Until accounts exist, the deployment must stay on a private network.
- Editing the same record from two browsers gives one winner and one
  reload, never a silent overwrite.

## What this ADR does not decide

- Authentication, accounts and sync (M14).
- The Settle file format for export and import (M6).
- Uploading receipt images. They stay in the browser.
- Offline editing or a write queue.
- The database's table layout, the server's internal structure and the
  homelab manifests, which `ss-06`, `ss-04` and `ss-14` decide.
