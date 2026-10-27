# Автоматизація тестування. Лабораторні роботи

- ЛР 1. Розгортання середовища автоматизації тестування, перший автоматизований тест
- ЛР 2. Модульне тестування бізнес-логіки засобами Vitest: матчери, параметризовані тести, покриття коду
- ЛР 3. Розроблення через тестування (TDD), цикл Red – Green – Refactor
- ЛР 4. Тестові дублери та перехоплення мережевих запитів: Vitest, підробки, підміна часу, MSW

## Використані інструменти

Node.js, TypeScript, Vitest, @vitest/coverage-v8, ESLint, Prettier.

## Структура проєкту

```
qa-automation/
├── src/
│   ├── temperature.ts
│   ├── distance.ts
│   ├── order.ts
│   ├── parking.ts
│   ├── delivery.ts
│   ├── order-service.ts
│   ├── retry.ts
│   ├── rate-provider.ts
│   ├── cancel-service.ts
│   └── payment-gateway.ts
├── tests/
│   ├── temperature.test.ts
│   ├── distance.test.ts
│   ├── order.test.ts
│   ├── loyalty.test.ts
│   ├── parking.test.ts
│   ├── delivery.test.ts
│   ├── order-service.test.ts
│   ├── retry.test.ts
│   ├── rate-provider.test.ts
│   ├── cancel-service.test.ts
│   ├── payment-gateway.test.ts
│   ├── setup.ts
│   ├── fakes/
│   └── msw/
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
- `src/parking.ts` – ЛР 3, показовий приклад: тарифікатор паркування
- `src/delivery.ts` – ЛР 3: тарифікатор доставки
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

## ЛР 3. Тарифікатор доставки (TDD)

`calcDeliveryFee(weightKg, { orderAmount, express })` – вартість доставки, розроблена за циклом Red – Green – Refactor. Кожен крок зафіксовано окремим комітом із префіксом `red`, `green` або `refactor`: `git log --oneline`.

Правила в порядку реалізації:

1. Вага має бути додатним скінченним числом, інакше `INVALID_WEIGHT`.
2. До 5 кг включно – 50 грн.
3. Кожен наступний розпочатий кілограм – 10 грн.
4. Максимум 300 грн.
5. Експрес – подвійний тариф (подвоюється вже обмежений тариф, тому максимум 600 грн).
6. Сума замовлення від 1000 грн – доставка безкоштовна, також і для експресу.
7. Сума замовлення не може бути від'ємною або нечисловою, інакше `INVALID_AMOUNT`.

## ЛР 4. Скасування замовлення з поверненням коштів

`CancelService` скасовує оплачене замовлення: повертає кошти через HTTP-шлюз платежів, змінює статус у сховищі й надсилає клієнту лист. Усі три залежності (`CancelOrderStore`, `PaymentGateway`, `Notifier`) описані інтерфейсами й передаються через конструктор.

- `HttpPaymentGateway` надсилає `POST /refunds` і відхиляє помилкові статуси (`REFUND_FAILED`) та некоректний формат відповіді (`INVALID_REFUND_FORMAT`).
- Якщо повернення коштів не вдалося, статус не змінюється і лист не надсилається.
- Помилки сервісу: `ORDER_NOT_FOUND`, `ALREADY_CANCELLED`.

Тести ізольовані від реальної мережі та часу: HTTP перехоплює MSW (`onUnhandledRequest: 'error'`, `resetHandlers` після кожного тесту), час підміняється через `vi.useFakeTimers`. Сервер MSW і початкове налаштування лежать у `tests/msw/` і `tests/setup.ts`, підробки сховищ – у `tests/fakes/`.
