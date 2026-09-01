# Finish Redesign Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the already deployed redesign to `origin/main` and prove that the remote repository and production site contain the reviewed release.

**Architecture:** This is a release-only change. The isolated branch preserves `index.html`, adds only the approved release documentation, and updates `origin/main` through a non-forced fast-forward push before reading both remote Git state and production HTML back for verification.

**Tech Stack:** Git, Node.js built-in test runner, curl, static HTML

## Global Constraints

- Preserve `index.html` without content or visual changes.
- Keep Russian Lineup references as historical context.
- Never force-push `origin/main`.
- Do not modify the primary checkout's untracked `.idea` files.
- Do not manually deploy or register the missing Control Hub project.

---

### Task 1: Release preflight

**Files:**
- Verify: `index.html`
- Verify: `tests/*.test.mjs`
- Verify: `docs/superpowers/specs/2026-09-01-finish-redesign-release-design.md`
- Verify: `docs/superpowers/plans/2026-09-01-finish-redesign-release.md`

**Interfaces:**
- Consumes: release branch based on redesign commit `fd43eab`
- Produces: a tested, whitespace-clean branch whose product diff against `fd43eab` is empty

- [ ] **Step 1: Run the complete test suite**

  Run: `rtk node --test`

  Expected: 18 tests pass, 0 fail.

- [ ] **Step 2: Check patch formatting**

  Run: `rtk git diff --check fd43eab..HEAD`

  Expected: exit 0 with no output.

- [ ] **Step 3: Prove product HTML is unchanged**

  Run: `rtk git diff --exit-code fd43eab..HEAD -- index.html`

  Expected: exit 0 with no output.

- [ ] **Step 4: Confirm the branch contains only the redesign and approved release documentation after `origin/main`**

  Run: `rtk git log --oneline origin/main..HEAD`

  Expected: the redesign commit plus the release design and plan commits; no unrelated product commit.

### Task 2: Fast-forward publish and verification

**Files:**
- Read: `index.html`
- Download temporarily: `/private/tmp/fedrbodr-production-index-release.html`

**Interfaces:**
- Consumes: the verified release branch from Task 1
- Produces: `origin/main` at the release SHA and production HTML identical to `index.html`

- [ ] **Step 1: Read the remote branch immediately before publishing**

  Run: `rtk git fetch origin main`

  Expected: `origin/main` refreshes successfully; the next step must remain a fast-forward.

- [ ] **Step 2: Confirm fast-forward ancestry**

  Run: `rtk git merge-base --is-ancestor origin/main HEAD`

  Expected: exit 0.

- [ ] **Step 3: Push the reviewed branch to `main` without force**

  Run: `rtk git push origin HEAD:main`

  Expected: successful update of `refs/heads/main`.

- [ ] **Step 4: Verify the remote SHA equals the release SHA**

  Run: `rtk git ls-remote origin refs/heads/main`

  Expected: returned SHA equals `rtk git rev-parse HEAD`.

- [ ] **Step 5: Download and compare production HTML**

  Run: `rtk curl -fsSL --max-time 20 -o /private/tmp/fedrbodr-production-index-release.html https://fedrbodr.com/`

  Then run: `rtk diff -q index.html /private/tmp/fedrbodr-production-index-release.html`

  Expected: both commands exit 0 and the diff produces no output.

- [ ] **Step 6: Re-run the complete test suite and inspect final Git state**

  Run: `rtk node --test`

  Expected: 18 tests pass, 0 fail.

  Run: `rtk git status --short --branch`

  Expected: the release worktree is clean and its branch is ahead of no tracked local changes.
