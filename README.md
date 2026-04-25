# WorkTime Manager

Angular 21 application for tracking working hours by projects and tasks. The project covers timer flow, manual time entries, project/task binding, reports, plan-vs-actual metrics, CSV export, authorization, protected routes and mock API integration.

## Stack

- Angular 21 + TypeScript
- Taiga UI 5
- NgRx Signal Store
- Mock API: json-server
- Unit tests: Jest
- Component/e2e tests: Playwright
- Quality: ESLint, Prettier, Stylelint

## Demo Accounts

| Email             | Password |
| ----------------- | -------- |
| arina@example.com | password |
| ivan@example.com  | password |

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
docs               plan, UX concept, prototype
e2e                Playwright component scenarios
```

## Deployment

CI config is included for GitLab Pages in `.gitlab-ci.yml` and a generic GitHub CI workflow in `.github/workflows/ci.yml`. The current public deployment is published on Vercel.

Deploy URL: https://worktime-manager-brown.vercel.app

Lighthouse mobile report: [`docs/lighthouse.report.html`](docs/lighthouse.report.html)  
Lighthouse screenshot: [`docs/lighthouse-summary.png`](docs/lighthouse-summary.png)
