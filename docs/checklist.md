# Чек-лист перед сдачей

| Требование                         | Статус | Где смотреть                                              |
| ---------------------------------- | ------ | --------------------------------------------------------- |
| `docs/plan.md` заполнен            | Готово | `docs/plan.md`                                            |
| `docs/ux.md` заполнен + прототип   | Готово | `docs/ux.md`, `docs/prototype.md`                         |
| Angular 21                         | Готово | `package.json`                                            |
| Taiga UI 5                         | Готово | `package.json`, компоненты в `src/app`                    |
| Авторизация login/register/logout  | Готово | `src/app/core/auth`, `/login`, mock password recovery     |
| Валидация email/password           | Готово | `src/app/core/auth/auth-validation.ts`, `/login`          |
| Разделение данных пользователей    | Готово | mock API фильтрует по `userId`                            |
| CRUD основных сущностей            | Готово | `/entries`, `/projects`                                   |
| Поиск, фильтрация, сортировка      | Готово | `/entries`, `/reports`                                    |
| State management                   | Готово | `src/app/core/services/time.store.ts`                     |
| Guards                             | Готово | `src/app/core/auth/auth.guard.ts`                         |
| Interceptor                        | Готово | `src/app/core/http/auth.interceptor.ts`                   |
| Jest 10-15 тестов                  | Готово | 18 тестов                                                 |
| Playwright 2-3 сценария            | Готово | 7 сценариев                                               |
| CI/CD pipeline                     | Готово | `.gitlab-ci.yml`, `.github/workflows/ci.yml`              |
| Публичный деплой                   | Готово | https://worktime-manager-brown.vercel.app                 |
| Lighthouse >= 80                   | Готово | SEO 82, Best Practices 100, `docs/lighthouse-summary.png` |
| README с инструкцией               | Готово | `README.md`                                               |
| История коммитов не одним коммитом | Готово | Conventional Commits в `git log`                          |

## Проверки

```bash
npm run lint
npm test -- --runInBand
npm run build
npm run e2e
```

Последний Lighthouse mobile отчёт сохранён в:

- `docs/lighthouse.report.html`
- `docs/lighthouse.report.json`
- `docs/lighthouse-summary.png`
