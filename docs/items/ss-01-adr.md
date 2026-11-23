# ss-01-adr

Record the self-hosted storage decisions (ADR 0007)

**Complexity:** low. 1 checkpoint(s) at most, one milestone, one squash-merged pull request, releasable alone. Part of M5.5 (`docs/items/milestone-5-5.md`).

## What to do

Write `docs/adr/0007-self-hosted-ledger-store.md`, in the style of ADR 0005, so every later slice has one
place to read the design. Docs only: no code, no schema, no test.

**Decided by the owner on 2026-11-23 and these replace anything below that differs:**
- **Database:** PostgreSQL on the cluster (the homelab already has the `postgresql` and `local-storage`
  charts and SignalHub-style backup and restore).
- **Server:** TypeScript on Node, sharing the app's record types, validators and money module.
- **Deployment:** one server image that serves the built site and the API on the same host (same origin, so
  the app's strict Content-Security-Policy stays), with PostgreSQL as its own workload. The static nginx image
  stays for local-first deployments.
- **Editing and offline:** online-only in server mode. Every record carries a version; a write with a stale
  version is rejected (HTTP 409) and the app reloads the record. No offline queue in the first version: an
  unreachable server shows a clear error. The local-first build is unchanged.

**The ADR must also settle** (propose, with reasons; the owner reviews the PR):
- The API's shape: JSON under `/api/v1`, resources and verbs, error format, how ids are made (client-generated
  ids as today, so an import is idempotent), how the version travels (`ETag`/`If-Match` or a body field).
- What is shared across devices (households, members, expenses, settlements) and what stays per device (theme,
  language, region, the bill being edited, the receipt summary, the last-household pointer).
- How the app learns which store to use (a small config the server serves; the same release ZIP must run both
  ways).
- Room for authentication later: every request passes through one place that can attach an identity; nothing
  trusts one yet, so the deployment stays on a private network.
- The data-protection note for holding other people's financial data on a server, and how this relates to M6
  (export, import, backup) and M14 (accounts, sync).

Update `docs/ROADMAP.md`'s M5.5 section to point at the ADR instead of listing the settled decisions.

Plans carry the rules in `CLAUDE.md` ("Running under the Controller"). Authentication is out of scope until a later item: nothing trusts an identity yet and the deployment stays on a private network. Real receipts never enter Git.

The plan's header must carry exactly one line of this form, with nothing after the closing backtick: ``Pull request title: `docs: record the self-hosted storage decisions (ADR 0007)` ``.
