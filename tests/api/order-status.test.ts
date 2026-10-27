import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/api/app';
import { login, createOrder } from './helpers';
import { expectSchema } from './schema';
import { orderSchema, errorSchema } from './schemas/order.schema';

describe('PATCH /orders/:id/status', () => {
  let app: ReturnType<typeof createApp>;
  let token: string;
  let orderId: string;

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const patch = (status: unknown) =>
    request(app)
      .patch(`/orders/${orderId}/status`)
      .set(auth())
      .send({ status });
  const currentStatus = async () =>
    (await request(app).get(`/orders/${orderId}`).set(auth())).body.status;

  beforeEach(async () => {
    app = createApp();
    token = await login(app, 'bob@example.com');
    orderId = (await createOrder(app, token)).id;
  });

  describe('допустимі переходи', () => {
    it('переводить замовлення з new в paid: 200, JSON, схема, значення', async () => {
      const before = (await request(app).get(`/orders/${orderId}`).set(auth()))
        .body;

      const res = await patch('paid');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expectSchema(res.body, orderSchema);
      expect(res.body).toEqual({ ...before, status: 'paid' });
    });

    it('зберігає новий статус: наступний GET повертає paid', async () => {
      await patch('paid');

      expect(await currentStatus()).toBe('paid');
    });

    it('переводить замовлення з paid в shipped і зберігає статус', async () => {
      await patch('paid');

      const res = await patch('shipped');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('shipped');
      expect(await currentStatus()).toBe('shipped');
    });

    it('новий статус видно в списку замовлень', async () => {
      await patch('paid');

      const list = await request(app).get('/orders').set(auth());

      expect(list.body.map((o: { status: string }) => o.status)).toEqual([
        'paid',
      ]);
    });
  });

  describe('недопустимі переходи', () => {
    it.each([
      {
        name: 'new → shipped (пропуск paid)',
        path: [],
        target: 'shipped',
        stays: 'new',
      },
      { name: 'new → new', path: [], target: 'new', stays: 'new' },
      { name: 'paid → paid', path: ['paid'], target: 'paid', stays: 'paid' },
      {
        name: 'paid → new (назад)',
        path: ['paid'],
        target: 'new',
        stays: 'paid',
      },
      {
        name: 'shipped → paid (назад)',
        path: ['paid', 'shipped'],
        target: 'paid',
        stays: 'shipped',
      },
      {
        name: 'shipped → new (назад)',
        path: ['paid', 'shipped'],
        target: 'new',
        stays: 'shipped',
      },
      {
        name: 'shipped → shipped',
        path: ['paid', 'shipped'],
        target: 'shipped',
        stays: 'shipped',
      },
    ])('$name → 409, статус не змінюється', async ({ path, target, stays }) => {
      for (const step of path) await patch(step);

      const res = await patch(target);

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ code: 'INVALID_TRANSITION' });
      expectSchema(res.body, errorSchema);
      expect(await currentStatus()).toBe(stays);
    });
  });

  describe('валідація значення статусу', () => {
    it.each([
      { name: 'невідомий статус', value: 'delivered' },
      { name: 'інший регістр', value: 'PAID' },
      { name: 'число', value: 1 },
      { name: 'null', value: null },
      { name: 'відсутнє поле', value: undefined },
    ])('відхиляє: $name → 400', async ({ value }) => {
      const res = await patch(value);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ code: 'INVALID_STATUS' });
      expect(await currentStatus()).toBe('new');
    });
  });

  describe('доступ', () => {
    it.each([
      { name: 'без токена', header: undefined },
      { name: 'підроблений токен', header: 'Bearer invalid-token' },
    ])('$name → 401, статус не змінюється', async ({ header }) => {
      const req = request(app).patch(`/orders/${orderId}/status`);
      if (header) req.set('Authorization', header);

      const res = await req.send({ status: 'paid' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ code: 'UNAUTHORIZED' });
      expect(await currentStatus()).toBe('new');
    });

    it('чуже замовлення → 404, а не 403; статус власника не змінюється', async () => {
      const alice = await login(app, 'alice@example.com');

      const res = await request(app)
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${alice}`)
        .send({ status: 'paid' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ code: 'NOT_FOUND' });
      expect(await currentStatus()).toBe('new');
    });

    it('неіснуюче замовлення → 404', async () => {
      const res = await request(app)
        .patch('/orders/does-not-exist/status')
        .set(auth())
        .send({ status: 'paid' });

      expect(res.status).toBe(404);
    });
  });

  describe('ізоляція', () => {
    it('статус замовлення в іншому застосунку не змінюється', async () => {
      const otherApp = createApp();
      const otherToken = await login(otherApp, 'bob@example.com');
      const other = await createOrder(otherApp, otherToken);

      await patch('paid');

      const res = await request(otherApp)
        .get(`/orders/${other.id}`)
        .set('Authorization', `Bearer ${otherToken}`);
      expect(res.body.status).toBe('new');
    });
  });
});
