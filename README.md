# Автоматизація тестування. Лабораторні роботи

- ЛР 1. Розгортання середовища автоматизації тестування, перший автоматизований тест
- ЛР 2. Модульне тестування бізнес-логіки засобами Vitest: матчери, параметризовані тести, покриття коду

## Використані інструменти

Node.js, TypeScript, Vitest, @vitest/coverage-v8, ESLint, Prettier.

## Структура проєкту

```
qa-automation/
├── src/
│   ├── temperature.ts
│   ├── distance.ts
│   └── order.ts
├── tests/
│   ├── temperature.test.ts
│   ├── distance.test.ts
│   ├── order.test.ts
│   └── loyalty.test.ts
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

- `src/temperature.ts` – модуль із показової частини ЛР 1 (градуси Цельсія у Фаренгейти)
- `src/distance.ts` – ЛР 1: перетворення кілометрів на милі та назад
- `src/order.ts` – ЛР 2: розрахунок вартості замовлення і списання бонусних балів
- `tests/order.test.ts` – тести показової частини ЛР 2
- `tests/loyalty.test.ts` – ЛР 2: тести функції `applyLoyaltyPoints`
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

## ЛР 1. Перетворення відстаней

- `kmToMiles(km)` – перетворює кілометри на милі.
- `milesToKm(miles)` – перетворює милі на кілометри.

Використовується коефіцієнт 1 миля = 1.609344 км. Від'ємні та нечислові значення відхиляються з помилкою `INVALID_DISTANCE`.

## ЛР 2. Списання бонусних балів

`applyLoyaltyPoints(total, points)` – списання бонусних балів з оплати замовлення. 1 бал = 1 грн, але списати можна не більше ніж 30 % суми (ліміт округлюється вниз до цілої гривні). Функція повертає об'єкт `{ pointsUsed, toPay }` – скільки балів списано і скільки залишилось сплатити.

| Ситуація                    | Код помилки       |
| --------------------------- | ----------------- |
| від'ємна кількість балів    | `NEGATIVE_POINTS` |
| неціла кількість балів      | `INVALID_POINTS`  |
| від'ємна або нечислова сума | `INVALID_TOTAL`   |
