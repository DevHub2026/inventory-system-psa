# Contribution workflow (implementation-backed recommendations)

This document provides a safe, recommended workflow for contributing to the repository. It is based on the repository layout and existing scripts but is presented as recommendations — the repository does not enforce a specific PR or review flow in its configuration files.

Verified starting point

- Pull latest changes from remote default branch (main):
  - git checkout main
  - git pull origin main

Recommended contribution steps

1. Create a focused branch
   - git checkout -b feature/short-description

2. Make minimal, focused changes
   - Keep PRs small and scoped to a single concern

3. Run relevant tests and quality checks locally
   - Backend: cd backend && php artisan test
   - Frontend: cd frontend && npm run lint && npm run build
   - Accessibility: cd frontend && npm run a11y:test (if UI changes)

4. Review changes
   - git diff
   - Ensure no secrets or generated artifacts are staged

5. Commit and push
   - git add -A
   - git commit -m "<subject>" -m "<body>"
   - git push -u origin feature/short-description

6. Open a Pull Request (if remote workflow used)
   - Include a clear description and testing instructions
   - Link any related issue or ticket

Repository enforcement

- The repository does not contain PR templates or branch protection rules within this clone. If organization-level rules exist on the remote (GitHub), follow those.

Source references

- backend/composer.json (scripts for running tests)
- frontend/package.json (scripts for lint, build, a11y)
- .github/workflows (CI workflows)
