import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, REFUND_URL } from './msw/server';
import { HttpPaymentGateway } from '../src/payment-gateway';

const gateway = new HttpPaymentGateway('https://payments.example.com');

describe('HttpPaymentGateway', () => {
  it('повертає ідентифікатор повернення з успішної відповіді', async () => {
    await expect(gateway.refund('A-1', 4100)).resolves.toEqual({
      refundId: 'R-1',
    });
  });

  it.each([402, 500, 503])(
    'відхиляє відповідь зі статусом %i',
    async (status) => {
      server.use(
        http.post(REFUND_URL, () => new HttpResponse(null, { status })),
      );

      await expect(gateway.refund('A-1', 4100)).rejects.toThrow(
        'REFUND_FAILED',
      );
    },
  );

  it.each([
    { name: 'число', body: { refundId: 123 } },
    { name: 'відсутнє поле', body: {} },
    { name: 'null', body: { refundId: null } },
  ])('відхиляє некоректний формат відповіді: $name', async ({ body }) => {
    server.use(http.post(REFUND_URL, () => HttpResponse.json(body)));

    await expect(gateway.refund('A-1', 4100)).rejects.toThrow(
      'INVALID_REFUND_FORMAT',
    );
  });

  it('надсилає номер замовлення й суму в тілі POST-запиту', async () => {
    const bodies: unknown[] = [];
    const types: (string | null)[] = [];
    server.use(
      http.post(REFUND_URL, async ({ request }) => {
        types.push(request.headers.get('Content-Type'));
        bodies.push(await request.json());
        return HttpResponse.json({ refundId: 'R-2' });
      }),
    );

    await gateway.refund('A-7', 250.5);

    expect(types).toEqual(['application/json']);
    expect(bodies).toEqual([{ orderId: 'A-7', amountUah: 250.5 }]);
  });

  it('опрацьовує мережеву помилку', async () => {
    server.use(http.post(REFUND_URL, () => HttpResponse.error()));

    await expect(gateway.refund('A-1', 4100)).rejects.toThrow();
  });
});
