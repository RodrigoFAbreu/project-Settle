# Record the self-hosted storage decisions (ADR 0007): execution plan (Revision 2)

Pull request title: `docs: record the self-hosted storage decisions (ADR 0007)`

- **Work item:** `ss-01-adr` (product, one checkpoint, docs only).
- **Plan revision:** 2.
- **Base commit:** `286ba9c8419280ddf7e0b8b06304a8e40b85a93d` (`main`).
- **Backlog page:** `docs/items/ss-01-adr.md`.
- **Registry:** `docs/ai-workflow/registry/ss-01-adr-registry.json`
- **Requirement mapping:** `docs/ai-workflow/requirements/ss-01-adr-mapping.json`
- **Artifact declarations:** `docs/ai-workflow/registry/ss-01-adr-artifacts.json`

## Checkpoints

| id | name | depends_on | complexity | session_target |
| --- | --- | --- | --- | --- |
| CP1 | ADR 0007: the self-hosted ledger store, and the roadmap pointer | - | 1 | 1 |

## Goal

M5.5 (self-hosted central storage) is cut into fourteen slices. Every later
slice needs one place that says how the server, the API and the app fit
together. Write that place: ADR 0007, in the style of ADR 0005.

**What the user sees:** nothing changes in the app. The repository gains a
design record the owner reviews in this pull request before any server code
exists.

**What does not change:** all application code, the schema, every test, the
release image. No migration: no stored data changes.

## Decisions

- **The owner's four decisions are recorded as given (2026-11-23), not
  reopened:** PostgreSQL on the cluster; a TypeScript server on Node sharing
  the app's record types, validators and money module; one server image
  serving the built site and the API on one origin, PostgreSQL as its own
  workload, the static nginx image kept for local-first deployments;
  online-only in server mode, with a version on every record and HTTP 409 for
  a stale write, no offline queue.
- **The ADR proposes the rest, each with its reason.** The owner reviews the
  pull request; the proposals below are what the ADR will say, so a reviewer
  can disagree with them here first:
  - **API shape.** JSON under `/api/v1`. Resources nest under their
    household: `/households`, `/households/{id}`, `.../members`,
    `.../expenses`, `.../settlements`; a record is read with `GET`, written
    with `PUT` (create or replace) and removed with `DELETE`. Errors use
    `application/problem+json` with a stable `code`, so the app can show its
    own translated message.
  - **Ids and idempotency.** Ids stay client-generated, as today, so a `PUT`
    of the same record twice, and a later import (ss-12), change nothing the
    second time.
  - **Version.** Each record carries a server-owned integer `rev`, separate
    from the record's own format version `v` (ADR 0005). It travels as the
    `ETag` of a read and as `If-Match` on `PUT` and `DELETE`; `If-None-Match:
    *` means "create only". A stale or already-existing write answers 409
    with the current record, and the app reloads it. A write with no
    precondition answers 428. A 409 whose current record equals the record
    sent counts as success for the ss-12 import, so a re-run import reports
    no conflicts for records it already wrote.
  - **Write contract.** The server keeps ADR 0005's contract: references
    (the household exists, both members belong to it) are re-checked inside
    the write's own transaction, and a member named by any expense or
    payment can't be deleted (409 with a `code`). A body that fails
    validation answers 422 with a `code`. ss-08 and ss-09 build to this.
  - **Shared versus per device.** Shared: households, members, expenses,
    settlements. Per device: theme, language, region, the bill being edited,
    the receipt summary and the last-household pointer. Reason: the second
    group describes one person's screen or one unsaved draft, not the
    household's money.
  - **Which store.** The server serves a small `settle-config.json` naming
    the store (for example `{"store":"server"}` plus a format version). The
    rule is stated by the response, not by a status: server mode applies
    only on a 200 `application/json` body that validates. Every other
    answer means local-first: a 404, or the `index.html` the static image
    returns with 200 `text/html` (`container/nginx.conf`'s `location /` has
    `try_files $uri /index.html`, and ADR 0001 D11 requires the same SPA
    fallback on every static host), or any body that is not that JSON. If
    the request itself fails (network error, 5xx) the app can't tell which
    deployment it is on, so it shows the online-only error and never falls
    back to an empty local ledger that would diverge from the server. One
    release ZIP therefore runs both ways, with the same-origin
    Content-Security-Policy (ADR 0001) unchanged. ss-11 builds this rule.
  - **Room for sign-in.** Every request passes through one function that
    returns an identity, which handlers receive. Today it returns a fixed
    anonymous identity and nothing trusts it, so the deployment stays on a
    private network. Adding authentication later changes that one function,
    not the routes.
  - **Data protection.** A server holds other people's financial data. The
    ADR states what is stored (names, amounts, dates, no receipt images),
    that access control is the network until accounts exist, that backups
    carry the same data and need the same care, and that deleting a household
    must delete it from the database too. It relates the server to M6
    (export, import and backup are the portable copy and a second way in) and
    to M14 (accounts and sync replace the private-network assumption).
- **ROADMAP.** M5.5's "Decided" list is replaced by a link to the ADR. The
  "Settled by ADR 0007" paragraph is reworded as "Recorded in ADR 0007".
- **No open decision is finalized silently.** `docs/TECHNICAL_DECISIONS.md`
  does not exist in this repository, so no "Open decision" row applies; the
  proposals above are marked as proposals in the ADR's text, and its status
  becomes `Accepted` when this pull request merges.

<!-- CP1 -->
## CP1: ADR 0007 and the roadmap pointer

**Files:**
`docs/adr/0007-self-hosted-ledger-store.md`,
`docs/ROADMAP.md`

Write the ADR with the sections ADR 0005 uses: status (`Accepted by the
merge of this pull request`: under the autonomous gate policy the Controller
merges the accepted commit, so the merge is the owner's acceptance and no
later slice has to flip it), date, milestone, "Builds on" (ADR 0001, 0005,
0006), Context, Decisions (one subsection per decision above, a single
principle each), Consequences and what it does not decide. Name the slice that builds each
part (`ss-02` to `ss-14`) so a later slice can find its contract. Then edit
the M5.5 section of the roadmap as described under Decisions.

**Tests:** none to add. Check the ADR against the backlog page's list (every
required topic answered), check that each link and each slice id it names
exists, and run the app's four checks in `app/` (`npm run typecheck`, `lint`,
`format:check`, `npm test`) to show nothing else moved.

**Migration:** none.
<!-- /CP1 -->

## Out of scope

Any code, schema, endpoint or test; authentication; the server, its image and
its deployment (later slices); real receipt content.

## Pull request

`docs: record the self-hosted storage decisions (ADR 0007)`. It adds a
design record and updates the roadmap, so the release is a patch.
