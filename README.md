# Лабораторна робота № 1

Розгортання середовища автоматизації тестування. Структура проєкту та перший автоматизований тест.

## Використані інструменти

Node.js, TypeScript, Vitest, @vitest/coverage-v8, ESLint, Prettier.

## Структура проєкту

```
qa-automation/
├── src/
│   ├── temperature.ts
│   └── distance.ts
├── tests/
│   ├── temperature.test.ts
│   └── distance.test.ts
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

- `src/temperature.ts` – модуль із показової частини (градуси Цельсія у Фаренгейти)
- `src/distance.ts` – перетворення кілометрів на милі та назад
- `tests/` – тести до модулів
- `vitest.config.ts` – налаштування раннера тестів і покриття
- `eslint.config.mjs`, `.prettierrc` – налаштування лінтера та форматування
- `tsconfig.json` – налаштування TypeScript

## Встановлення

```bash
git clone https://github.com/brahayarn/qa-automation.git
cd qa-automation
npm ci
```

## Запуск

| Команда              | Призначення                     |
| -------------------- | ------------------------------- |
| `npm test`           | одноразовий прогін усіх тестів  |
| `npm run test:watch` | режим спостереження             |
| `npm run coverage`   | прогін із вимірюванням покриття |
| `npm run lint`       | статичний аналіз коду           |
| `npm run format`     | форматування коду               |

Звіт про покриття зберігається в `coverage/index.html`.

## Модуль distance.ts

- `kmToMiles(km)` – перетворює кілометри на милі.
- `milesToKm(miles)` – перетворює милі на кілометри.

Використовується коефіцієнт 1 миля = 1.609344 км. Від'ємні та нечислові значення відхиляються з помилкою `INVALID_DISTANCE`.
