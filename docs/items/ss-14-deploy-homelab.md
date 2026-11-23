# ss-14-deploy-homelab

Deploy the server and PostgreSQL on the homelab

This is **homelab-gitops work, not a Controller item**: it changes `RodrigoFAbreu/homelab-gitops`, not this
repository. Promote it to `next` only when someone (the homelab session) will run it.

## What to do

- A `settle-server` workload (the `backend-app` chart) and a PostgreSQL (the `postgresql` and `local-storage`
  charts) with retained local storage on `homelab-control`, health checks, resource limits and the node
  selector; the database URL as a private Secret created outside Git; a NetworkPolicy like SignalHub's.
- Switch `settle.home.arpa` from the static `settle` image to the server image, keeping the static
  deployment's values in Git as the rollback.
- Image Updater annotations for `ghcr.io/rodrigofabreu/settle-server` (digest tracking, linux/arm64).
- Backup and restore coverage for the database in the existing backup tooling, and a **restore drill**
  (a dump restored into a scratch database, row counts compared).
- Update the Settle service page in `homelab-docs` and the verification record.

## Verification

Two browsers on two machines see the same household; a redeploy of the app and a restart of the database
keep the data; a restore from backup brings it back; private HTTPS and the Tailscale path still work.
