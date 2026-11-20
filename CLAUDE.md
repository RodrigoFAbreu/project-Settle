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
  milestone PR. Merging follows the milestone gates
  (`/approve-review implementation`, `/accept-milestone`); once the
  milestone is accepted and every check is green, Workflow Controller
  (`.workflow-controller/policy.json`: squash, `auto_merge`) merges the
  accepted commit itself, and a person may merge instead. PRs are
  **squash-merged**; merge commits and rebase merges are disabled. The
  per-checkpoint commits and their workflow trailers stay on the PR
  branch and in its history, but `main` gets one commit per PR.
- Never commit or push to `main` directly.
- Never force-push. Never rebase, amend or otherwise rewrite a commit
  that has been pushed.
- Don't touch unrelated working-tree changes.
