# WorkTime Manager

Angular 21 application for tracking working hours by projects and tasks. The project covers timer flow, manual time entries, project/task binding, reports, plan-vs-actual metrics, CSV export with period-aware filenames, authorization, protected routes and mock API integration.

## Stack

- Angular 21 + TypeScript
- Taiga UI 5
- NgRx Signal Store
- Mock API: json-server
- Unit tests: Jest
- Component/e2e tests: Playwright
- Quality: ESLint, Prettier, Stylelint

## Authentication

Users can create an account from the login page, sign in, log out and request a mock password recovery link. The mock server does not send real email; it validates that the account exists and shows a demo reset link in the UI. The app stores the current session token and user preferences in `localStorage`, while account creation and login go through the mock API.

## Run Locally

```bash
npm install
npm run dev
```

App: http://localhost:4200  
Mock API: http://localhost:3000

## Useful Scripts

```bash
npm start        # Angular dev server
npm run mock     # json-server mock API
npm run dev      # app + mock API
npm test         # Jest unit tests
npm run e2e      # Playwright scenarios
npm run lint     # ESLint + Stylelint
npm run build    # production build
```

## Structure

```text
src/app/core       auth, interceptors, models, API services, Signal Store
src/app/features   lazy-loaded pages: login, dashboard, entries, projects, reports, settings
src/app/shared     reusable UI components
mock-server        json-server seed data
docs               plan, UX concept, Figma prototype, git history notes
e2e                Playwright component scenarios
```

## Deployment

CI config is included for GitLab Pages in `.gitlab-ci.yml` and a generic GitHub CI workflow in `.github/workflows/ci.yml`. The current public deployment is published on Vercel.

Deploy URL: https://worktime-manager-brown.vercel.app

For GitHub Actions Vercel deploy, add repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

Lighthouse mobile report: [`docs/lighthouse.report.html`](docs/lighthouse.report.html)  
Lighthouse screenshot: [`docs/lighthouse-summary.png`](docs/lighthouse-summary.png)
Git history and merge request notes: [`docs/git-history.md`](docs/git-history.md)
