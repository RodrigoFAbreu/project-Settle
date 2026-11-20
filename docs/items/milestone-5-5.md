# milestone-5-5

M5.5 Self-hosted central storage

The scope, why and open decisions are in `docs/ROADMAP.md`, section "M5.5 — Self-hosted central storage". This page only exists so the backlog can point at it.

**Do not plan this as one milestone.** Split it into slices before the first plan, each releasable alone and one new mechanism at most, for example: a server skeleton with a health endpoint, its CI build and its image; then the schema with a migration test; then one read path; then one write path; then the app's switch-over from the browser store. Any schema change needs an upgrade check against a copy of real data, because a fresh install skips upgrades.

Authentication is deliberately out of scope until a later item. The deployment stays on a private network until then.

The plan's header must carry exactly one line of this form, with nothing after the closing backtick: ``Pull request title: `feat: what this slice adds` ``.
