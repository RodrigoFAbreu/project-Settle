# Roadmap

<!-- Generated from docs/backlog.yaml by scripts/workflow_backlog.py. Do not edit by hand: edit the backlog file and run `python3 scripts/workflow_backlog.py generate`. -->

| Order | Item | Status | Size | Depends on |
| --- | --- | --- | --- | --- |
| 1 | Project foundation `milestone-0` | Done | - | - |
| 2 | Bill splitter (manual entry) `milestone-1` | Done | - | - |
| 3 | Receipt upload and built-in parsing `milestone-2` | Done | - | - |
| 4 | Accurate receipt reading `milestone-2-5` | Done | - | - |
| 5 | Design foundations `milestone-3` | Done | - | - |
| 6 | Households, members and the expense ledger `milestone-4` | Done | - | - |
| 7 | Balances and settling up `milestone-5` | Done | - | - |
| 8 | [Lidl receipt layout as a text fixture](items/lidl-layout-fixture.md) `lidl-layout-fixture` | Done | 1 | - |
| 9 | [Record the self-hosted storage decisions (ADR 0007)](items/ss-01-adr.md) `ss-01-adr` | Done | 1 | - |
| 10 | [Put the ledger behind a store interface](items/ss-02-store-interface.md) `ss-02-store-interface` | Next | 3 | ss-01-adr |
| 11 | [Share the domain types and validators in one package](items/ss-03-shared-domain.md) `ss-03-shared-domain` | Next | 3 | ss-02-store-interface |
| 12 | [Add the server skeleton with a health endpoint](items/ss-04-server-skeleton.md) `ss-04-server-skeleton` | Next | 2 | ss-03-shared-domain |
| 13 | [Publish the server image](items/ss-05-server-image.md) `ss-05-server-image` | Next | 2 | ss-04-server-skeleton |
| 14 | [Add the PostgreSQL schema and migration runner](items/ss-06-db-schema.md) `ss-06-db-schema` | Next | 3 | ss-04-server-skeleton |
| 15 | [Serve the ledger's read endpoints](items/ss-07-api-read.md) `ss-07-api-read` | Next | 2 | ss-06-db-schema, ss-03-shared-domain |
| 16 | [Add write endpoints for households and members](items/ss-08-api-write-households.md) `ss-08-api-write-households` | Next | 2 | ss-07-api-read |
| 17 | [Add write endpoints for expenses and settlements](items/ss-09-api-write-ledger.md) `ss-09-api-write-ledger` | Next | 3 | ss-08-api-write-households |
| 18 | [Add an HTTP ledger store to the app](items/ss-10-http-store.md) `ss-10-http-store` | Next | 3 | ss-02-store-interface, ss-09-api-write-ledger |
| 19 | [Let a self-hosted deployment choose the server store](items/ss-11-store-selection.md) `ss-11-store-selection` | Next | 2 | ss-10-http-store, ss-05-server-image |
| 20 | [Import this device's data into the server](items/ss-12-import-local.md) `ss-12-import-local` | Next | 3 | ss-11-store-selection, ss-09-api-write-ledger |
| 21 | [Drive two browsers against one server end to end](items/ss-13-two-browsers-e2e.md) `ss-13-two-browsers-e2e` | Next | 2 | ss-12-import-local |
| 22 | [Deploy the server and PostgreSQL on the homelab](items/ss-14-deploy-homelab.md) `ss-14-deploy-homelab` | Idea | - | ss-05-server-image, ss-13-two-browsers-e2e |
| 23 | M6 Export, import, backup and sharing `milestone-6` | Idea | - | - |
| 24 | M7 Installable PWA and public deployment `milestone-7` | Idea | - | - |
