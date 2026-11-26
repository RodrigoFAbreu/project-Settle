# CLAUDE.md

Guidance for Claude Code (claude.ai/code) in this repository.

## Semi-autonomous workflow gates

Work follows the state machine in `docs/ai-workflow/MILESTONE_WORKFLOW.md`.
Claude works autonomously between gates but must stop and wait at every hard
gate that document names -- see its "Hard gates summary" for the current
count and list, which changes as the workflow evolves; do not hardcode a
count here.

Use the commands in `.claude/commands/` to drive each state. Do not skip a
gate because the diff looks small.

## Workflow documents

- Milestone state machine: `docs/ai-workflow/MILESTONE_WORKFLOW.md`
- Two-stage plan review: `docs/ai-workflow/PLAN_REVIEW_WORKFLOW.md`
- Bundle mechanics and feedback format: `docs/ai-workflow/REVIEW_PROTOCOL.md`
- Phase/command reference: `docs/ai-workflow/WORKFLOW_V2_1_OPERATOR_REFERENCE.md`
- Current work-item state: `docs/ai-workflow/WORKFLOW_STATE.json` (ground
  truth -- never inferred from plan text)
- Active work item narrative: `docs/ACTIVE_MILESTONE.md`

## Git restrictions

- Commits are normally prohibited. Only commit when a workflow command
  explicitly authorizes it after verification gates pass.
- Never push, merge, rebase, force-push, or open a pull request.
- Don't touch unrelated working-tree changes.

<!--
Sections above this marker are managed by workflow-manager and are replaced
on update. Add repository-specific guidance below it; it is never touched.
-->

<!-- workflow-manager:end -->

## Running under the Controller

Workflow Controller runs one milestone per item in `docs/backlog.yaml`
(`docs/BACKLOG.md` is its generated view; `docs/ROADMAP.md` stays the
hand-written scope). The usual workflow has **no human gates**:
`docs/ai-workflow/GATE_POLICY.json` is `human_approval: false`, so the
Workflow satisfies plan approval, technical approval and acceptance itself
from complete evidence (two distinct reviewer models, green CI), and the
Controller merges the accepted commit. A person acts only on product
decisions, on a run that stops for something only a person can decide, and
on the commands the Workflow reserves to the owner by design
(`/adopt-gate-policy`, `/request-plan-amendment`, `/release-checkpoint-start`,
`/resume-implementation`). Loosening a gate policy is only ever done by the
owner with `/adopt-gate-policy`. These rules apply to every job:

- **Plan header.** A plan carries exactly one header line of exactly this
  form, with nothing after the closing backtick:
  ``Pull request title: `fix: what changed` ``. Use `fix:` for a correction,
  `feat:` for something new, `test:` or `docs:` as they fit. The title becomes
  the squash commit's subject and decides the release; any other form declares
  no title.
- **Size.** One backlog item is one milestone, one squash PR and one release.
  Keep it small: one new mechanism at most, a few checkpoints. Split an item
  before its first review if it needs two mechanisms.
- **Review severity.** Blocking or Important means wrong code or a missed
  requirement. Citations, file lists, wording of the plan and similar
  bookkeeping are Optional, and an Optional finding is never a reason for
  another round. Say what the user would see go wrong.
- **Simple commands.** Run `gh` and scripts as separate simple commands.
- **Acceptance.** Don't check `gh` first (for example `gh auth status`):
  acceptance runs the Workflow's own GitHub query.
- **Findings.** Check each Optional finding against the code and give it a
  disposition before acceptance: `fixed` (only if code or tests changed),
  `dropped` with a reason, or `follow-up` with a link to a `docs/items/` page.
- **Real receipts stay out of Git unless the owner approves a redacted copy.**
  Fixtures are invented, and real receipts stay in the git-ignored
  `app/src/features/receipt/fixtures/local/`. A real receipt goes into the
  committed corpus only with the owner's explicit say-so, after the payment
  block and any customer data are removed (card digits and tokens,
  authorisation, terminal and establishment ids, customer tax and
  loyalty-card numbers), and the redacted file has been checked in its text
  layer and its internals, not only by eye.
- **Schema changes.** A fresh install skips upgrades, so any change to stored
  data needs a migration step and an upgrade check against a copy of real data.
- **Testing.** The app's checks run in `app/` (`npm run typecheck`, `lint`,
  `format:check`, `npm test`) and also cover `shared/`. Browser flows need a build and Chromium, which
  a job's sandbox may not allow: say so, and the orchestrator records that
  evidence.

## Git and GitHub workflow (repository-specific)

This section overrides the managed "Git restrictions" above wherever they
conflict. The remote is `origin`, https://github.com/RodrigoFAbreu/project-Settle (a
fork of jfilipegm/project-Settle, kept as the `upstream` remote), and
`main` is protected.

### One branch and one PR per milestone

Workflow Controller creates and binds the milestone branch itself
(`feature/{work_item_id}`, so `feature/milestone-X`) and opens the Draft
PR; the steps below describe the same convention for work done by hand.

1. **Start from an up-to-date `main`.** Before planning milestone X,
   run `git switch main && git pull`, then
   `git switch -c feature/milestone-X`. X is the number of the milestone
   this branch works on: M1 is built on `feature/milestone-1`, M2 on
   `feature/milestone-2`, and so on. Do this only after the previous
   milestone's PR is merged into `main`.
2. **Open the PR after the first commit** on `feature/milestone-X`. Push
   the branch (`git push -u origin feature/milestone-X`), then
   `gh pr create --base main`. Give it a Conventional Commits title,
   such as `feat(m1): bill splitter`, and a short description of what the
   milestone delivers for the user.
3. **Commit and push freely** on that branch. Any commit the milestone
   workflow authorizes, or that the user asks for, can be made and pushed
   to the PR branch. Push after each commit so the PR and CI stay current.
   The trailer rules in the workflow commands still apply.
4. **Update the PR description** when the milestone's scope changes.
5. **After the user merges the PR,** go back to step 1 for the next
   milestone.

### What a PR to `main` must satisfy

- **All required checks pass.** `CI passed` (ci.yml: the app checks and the
  container image check, via tests.yml) and
  `workflow-conformance` are required. `Conventional Commit title`
  (pr-title.yml) is required too, once its workflow is on `main`. The
  branch must be up to date with `main`. Branch protection enforces this
  for admins too.
- **The PR adds something,** and its title states what, as a
  Conventional Commit: `feat:` (a feature), `fix:` (a bug fix), or
  `perf:`, `refactor:`, `docs:`, `test:`, `build:`, `ci:`, `chore:`,
  `style:`, `revert:`. An optional scope is allowed (`feat(m1): ...`).
  Add `!` after the type or scope for a breaking change (`feat!: ...`).
  The `Conventional Commit title` check enforces the format.
- **The title sets the release version.** PRs are squash-merged, so the
  PR title is the commit on `main`, and every release-bearing commit
  publishes a GitHub Release and its container image (build-and-publish.yml,
  called by ci.yml once CI passed). `!` → major, `feat` → minor, `ci` →
  no release, anything else → patch (`scripts/release/release.py`, which
  `.workflow-controller/policy.json` mirrors). Do not edit the squash
  message in GitHub's merge dialog: the title is what the release reads.

### Still never

- Never merge a PR by hand, and never press "Update branch" on a
  milestone PR. Once the milestone is accepted (automatically, from its
  evidence) and every check is green, Workflow Controller
  (`.workflow-controller/policy.json`: squash, `auto_merge`) merges the
  accepted commit itself, and a person may merge instead. PRs are
  **squash-merged**; merge commits and rebase merges are disabled. The
  per-checkpoint commits and their workflow trailers stay on the PR
  branch and in its history, but `main` gets one commit per PR.
- Never commit or push to `main` directly.
- Never force-push. Never rebase, amend or otherwise rewrite a commit
  that has been pushed.
- Don't touch unrelated working-tree changes.
