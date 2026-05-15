# Git history and merge requests

## Branches

- `main` — stable branch for the final project.
- `feature/worktime-manager` — base application implementation.
- `feature/auth-validation` — registration validation, password recovery improvements and final reporting polish.

Branch names do not use the word `codex`.

## Merge request chain

1. `feature/auth-validation` into `feature/worktime-manager`
   - Pull request: https://github.com/maraolk/WorkTime-Manager/pull/1
   - Compare link: https://github.com/maraolk/WorkTime-Manager/compare/feature/worktime-manager...feature/auth-validation?quick_pull=1
   - Scope: auth validation, forgot password UX, delete confirmations, report statuses, weekly dashboard metric, updated tests and docs.

2. `feature/worktime-manager` into `main`
   - Pull request: https://github.com/maraolk/WorkTime-Manager/pull/2
   - Compare link: https://github.com/maraolk/WorkTime-Manager/compare/main...feature/worktime-manager?quick_pull=1
   - Scope: main Angular application, mock API, auth flow, Signal Store, CRUD, reports, CI/CD and deployment docs.

## Conventional Commits examples

- `feat: initialize angular worktime app`
- `feat: add protected worktime dashboard`
- `feat: add reports and csv export`
- `fix: load taiga ui theme styles`
- `feat: strengthen auth validation`
- `feat: polish reporting workflows`
- `docs: refresh lighthouse report`

## Notes for defense

The history is intentionally split into small commits by topic. During the defense, show `git log --oneline --decorate` and the pull request links above to explain how the work can be reviewed as merge requests.
