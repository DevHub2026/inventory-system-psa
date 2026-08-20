# Git and Branching (implementation-backed)

This document records observed repository practices and verified commands.

Observed commit/branch patterns

- Recent commit messages include Conventional-style prefixes (e.g., feat:, docs:, a11y:, ui:, fix:) but also include free-form messages. There is no single strictly enforced commit message convention evident in the last 30 commits.
- The default branch in this clone is `main`.

Verified Git commands

- Check current branch:
  - git branch --show-current

- View recent commits:
  - git log --oneline -20

- Check working tree status:
  - git status --short

- Create a branch:
  - git checkout -b feature/short-description

- Staging and committing (use local conventions):
  - git add -A
  - git commit -m "<subject>" -m "<body>"

Repository conventions (implementation-backed)

- No enforced branch naming convention was found in the repository configuration. Teams may choose to adopt conventions (e.g., feature/, fix/, docs/) but these are not enforced by repository config in .github or CI files.
- Commit messages in the history frequently use prefixes such as feat:, fix:, docs:, a11y:, so following Conventional Commit prefixes is consistent with project history but not mandatory per repo config.

Recommendations (clearly labeled)

- Recommended branch naming: feature/<short-description>, fix/<ticket>-short-description, docs/<topic>
- Recommended commit style: use Conventional Commit prefixes where applicable to make changelogs easier to generate.

Source references

- git log (repository history)
- .github/ (workflows — may reference branch protections in remote repository settings but none are present in this clone)
