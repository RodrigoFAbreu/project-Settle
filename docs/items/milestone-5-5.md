# milestone-5-5

M5.5 Self-hosted central storage, split into slices

The scope, why and completion criteria are in `docs/ROADMAP.md`, section "M5.5 — Self-hosted central storage".
This page is the overview of how it is cut. The backlog holds one item per slice (ids start with `ss-`); each
is one milestone, one squash PR and one release, and the Controller takes them in order because each lists what
it depends on.

**Decided by the owner on 2026-11-23:** PostgreSQL; a TypeScript server sharing the app's types; one server
image serving the site and `/api` on one origin with a separate database workload; online-only with a version
check per record. Authentication is deliberately out of scope. ADR 0007 (the first slice) records all of it.

1. `ss-01-adr`: Record the self-hosted storage decisions (ADR 0007)
2. `ss-02-store-interface`: Put the ledger behind a store interface
3. `ss-03-shared-domain`: Share the domain types and validators in one package
4. `ss-04-server-skeleton`: Add the server skeleton with a health endpoint
5. `ss-05-server-image`: Publish the server image
6. `ss-06-db-schema`: Add the PostgreSQL schema and migration runner
7. `ss-07-api-read`: Serve the ledger's read endpoints
8. `ss-08-api-write-households`: Add write endpoints for households and members
9. `ss-09-api-write-ledger`: Add write endpoints for expenses and settlements
10. `ss-10-http-store`: Add an HTTP ledger store to the app
11. `ss-11-store-selection`: Let a self-hosted deployment choose the server store
12. `ss-12-import-local`: Import this device's data into the server
13. `ss-13-two-browsers-e2e`: Drive two browsers against one server end to end
14. `ss-14-deploy-homelab`: Deploy the server and PostgreSQL on the homelab (homelab-gitops; not a Controller item)

**Rules for every slice:** one new mechanism at most; the local-first build keeps working unchanged; a
schema change needs a migration step and an upgrade check; receipt reading stays in the browser; real
receipts never enter Git.
