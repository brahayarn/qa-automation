import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/api/app';
import { login, makeOrderPayload } from './helpers';
import { expectSchema } from './schema';
import {
  orderSchema,
  orderListSchema,
  errorSchema,
} from './schemas/order.schema';

describe('POST /orders', () => {
  let app: ReturnType<typeof createApp>;
  let token: string;

  beforeEach(async () => {
    app = createApp();
    token = await login(app, 'bob@example.com');
  });

  it('створює замовлення: 201, Location, розрахована сума, статус new', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(makeOrderPayload());

    expect(res.status).toBe(201);
    expect(res.body.total).toBeCloseTo(560, 2);
    expect(res.body.status).toBe('new');
    expect(res.headers.location).toBe(`/orders/${res.body.id}`);
  });

  it('створене замовлення доступне за GET', async () => {
    const created = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(makeOrderPayload());

    const fetched = await request(app)
      .get(`/orders/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(fetched.status).toBe(200);
    expect(fetched.body).toEqual(created.body);
  });

  it('відповідь POST /orders відповідає контракту', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(makeOrderPayload());

    expectSchema(res.body, orderSchema);
  });

  it.each([
    { name: 'порожній список', code: 'EMPTY_ORDER', items: [] },
    {
      name: 'від’ємна ціна',
      code: 'INVALID_PRICE',
      items: [{ sku: 'A', price: -1, qty: 1 }],
    },
    {
      name: 'ціна рядком',
      code: 'INVALID_PRICE',
      items: [{ sku: 'A', price: '10', qty: 1 }],
    },
    {
      name: 'нульова кількість',
      code: 'INVALID_QTY',
      items: [{ sku: 'A', price: 10, qty: 0 }],
    },
    {
      name: 'дробова кількість',
      code: 'INVALID_QTY',
      items: [{ sku: 'A', price: 10, qty: 1.5 }],
    },
  ])('відхиляє: $name → $code', async ({ items, code }) => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe(code);
    expectSchema(res.body, errorSchema);
  });
});

describe('Розрахунок суми замовлення', () => {
  it.each([
    { email: 'bob@example.com', price: 500, total: 560 },
    { email: 'alice@example.com', price: 1200, total: 1080 },
    { email: 'alice@example.com', price: 1050, total: 1005 },
    { email: 'bob@example.com', price: 2000, total: 1900 },
    { email: 'alice@example.com', price: 2000, total: 1700 },
  ])(
    '$email, ціна $price → до сплати $total',
    async ({ email, price, total }) => {
      const app = createApp();
      const token = await login(app, email);

      const res = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ sku: 'A', price, qty: 1 }] });

      expect(res.body.total).toBeCloseTo(total, 2);
    },
  );
});

describe('POST /auth/login', () => {
  it('видає токен за коректних облікових даних', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'bob@example.com', password: 'Secret123' });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe('string');
  });

  it.each([
    {
      name: 'хибний пароль',
      body: { email: 'bob@example.com', password: 'x' },
    },
    {
      name: 'невідомий email',
      body: { email: 'eve@example.com', password: 'Secret123' },
    },
    { name: 'порожнє тіло', body: {} },
  ])('відхиляє: $name → 401', async ({ body }) => {
    const app = createApp();

    const res = await request(app).post('/auth/login').send(body);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('Доступ до замовлень', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it.each([
    { name: 'без токена', header: undefined },
    { name: 'підроблений токен', header: 'Bearer invalid-token' },
    { name: 'без префікса Bearer', header: 'some-token' },
  ])('GET /orders $name → 401', async ({ header }) => {
    const req = request(app).get('/orders');
    if (header) req.set('Authorization', header);

    const res = await req;

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('чуже замовлення повертає 404, а не 403', async () => {
    const alice = await login(app, 'alice@example.com');
    const bob = await login(app, 'bob@example.com');
    const created = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${alice}`)
      .send(makeOrderPayload());

    const res = await request(app)
      .get(`/orders/${created.body.id}`)
      .set('Authorization', `Bearer ${bob}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: 'NOT_FOUND' });
  });

  it('список містить лише власні замовлення', async () => {
    const alice = await login(app, 'alice@example.com');
    const bob = await login(app, 'bob@example.com');
    await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${alice}`)
      .send(makeOrderPayload());
    await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${bob}`)
      .send(makeOrderPayload());

    const res = await request(app)
      .get('/orders')
      .set('Authorization', `Bearer ${bob}`);

    expect(res.body).toHaveLength(1);
    expectSchema(res.body, orderListSchema);
  });
});

describe('DELETE /orders/:id', () => {
  it('204, повторний — 404, а не 500; ресурсу більше немає', async () => {
    const app = createApp();
    const token = await login(app, 'bob@example.com');
    const auth = { Authorization: `Bearer ${token}` };
    const created = await request(app)
      .post('/orders')
      .set(auth)
      .send(makeOrderPayload());
    const url = `/orders/${created.body.id}`;

    const first = await request(app).delete(url).set(auth);
    expect(first.status).toBe(204);
    expect(first.text).toBe('');

    const second = await request(app).delete(url).set(auth);
    expect(second.status).toBe(404);

    const fetched = await request(app).get(url).set(auth);
    expect(fetched.status).toBe(404);
  });

  it('не видаляє чуже замовлення', async () => {
    const app = createApp();
    const alice = await login(app, 'alice@example.com');
    const bob = await login(app, 'bob@example.com');
    const created = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${alice}`)
      .send(makeOrderPayload());
    const url = `/orders/${created.body.id}`;

    const res = await request(app)
      .delete(url)
      .set('Authorization', `Bearer ${bob}`);

    expect(res.status).toBe(404);
    const stillThere = await request(app)
      .get(url)
      .set('Authorization', `Bearer ${alice}`);
    expect(stillThere.status).toBe(200);
  });
});
