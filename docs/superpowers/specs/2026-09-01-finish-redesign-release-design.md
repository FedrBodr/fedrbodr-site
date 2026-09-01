# Finish Redesign Release

## Goal

Complete the already deployed redesign release by publishing the local redesign commit to `origin/main` and verifying that the repository and production site describe the same release.

## Scope

- Preserve the existing `index.html` without content or visual changes.
- Keep the Russian Lineup references in the story and `0-to-prod` episode as historical context.
- Publish redesign commit `fd43eab` to `origin/main` using a fast-forward update only.
- Do not touch the untracked `.idea` files in the primary checkout.
- Do not create or register the missing Control Hub project automatically.

## Release Flow

1. Run the complete Node test suite and `git diff --check` in the isolated worktree.
2. Confirm that the release branch contains the expected redesign commit and no unintended product changes.
3. Fast-forward `origin/main` to the reviewed release branch.
4. Read `origin/main` back from the remote and verify its SHA.
5. Download `https://fedrbodr.com/` and compare its HTML byte-for-byte with the released `index.html`.

## Failure Handling

- If tests or whitespace checks fail, stop before pushing.
- If the remote branch moved, stop instead of forcing the push.
- If production differs after the push, report the deployment mismatch; do not trigger an extra manual deployment without explicit approval.

## Success Criteria

- All existing tests pass.
- `origin/main` contains the redesign release.
- The production HTML matches the released `index.html`.
- The primary checkout's untracked `.idea` files remain untouched.
