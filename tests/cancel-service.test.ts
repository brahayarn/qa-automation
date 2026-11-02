import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { CancelService } from '../src/cancel-service';
import type { PaymentGateway } from '../src/cancel-service';
import type { Notifier } from '../src/order-service';
import { HttpPaymentGateway } from '../src/payment-gateway';
import { InMemoryOrderStore } from './fakes/in-memory-order-store';
import { server, REFUND_URL } from './msw/server';

const paidOrder = {
  id: 'A-1',
  email: 'client@e.com',
  amountUah: 4100,
  status: 'paid' as const,
};

describe('CancelService', () => {
  let store: InMemoryOrderStore;
  let gateway: PaymentGateway;
  let notifier: Notifier;
  let service: CancelService;

  beforeEach(() => {
    store = new InMemoryOrderStore([paidOrder]);
    gateway = { refund: vi.fn().mockResolvedValue({ refundId: 'R-1' }) };
    notifier = { send: vi.fn().mockResolvedValue(undefined) };
    service = new CancelService(store, gateway, notifier);
  });

  it('повертає підтвердження повернення коштів', async () => {
    await expect(service.cancelOrder('A-1')).resolves.toEqual({
      refundId: 'R-1',
    });
  });

  it('змінює статус замовлення у сховищі на скасований', async () => {
    await service.cancelOrder('A-1');

    const saved = await store.findById('A-1');
    expect(saved?.status).toBe('cancelled');
  });

  it('передає шлюзу номер замовлення та суму до повернення', async () => {
    await service.cancelOrder('A-1');

    expect(gateway.refund).toHaveBeenCalledTimes(1);
    expect(gateway.refund).toHaveBeenCalledWith('A-1', 4100);
  });

  it('надсилає клієнту лист про скасування', async () => {
    await service.cancelOrder('A-1');

    expect(notifier.send).toHaveBeenCalledTimes(1);
    expect(notifier.send).toHaveBeenCalledWith(
      'client@e.com',
      expect.stringContaining('A-1'),
    );
  });

  it('не змінює замовлення й не надсилає листа, якщо повернення не вдалося', async () => {
    gateway.refund = vi.fn().mockRejectedValue(new Error('REFUND_FAILED'));
    service = new CancelService(store, gateway, notifier);

    await expect(service.cancelOrder('A-1')).rejects.toThrow('REFUND_FAILED');

    const saved = await store.findById('A-1');
    expect(saved?.status).toBe('paid');
    expect(notifier.send).not.toHaveBeenCalled();
  });

  it('залишає замовлення скасованим, якщо лист не вдалося надіслати', async () => {
    notifier.send = vi.fn().mockRejectedValue(new Error('MAIL_DOWN'));
    service = new CancelService(store, gateway, notifier);

    await expect(service.cancelOrder('A-1')).rejects.toThrow('MAIL_DOWN');

    const saved = await store.findById('A-1');
    expect(saved?.status).toBe('cancelled');
  });

  it('відхиляє невідоме замовлення, не звертаючись до шлюзу', async () => {
    await expect(service.cancelOrder('X-9')).rejects.toThrow('ORDER_NOT_FOUND');

    expect(gateway.refund).not.toHaveBeenCalled();
    expect(notifier.send).not.toHaveBeenCalled();
  });

  it('не повертає кошти повторно за вже скасованим замовленням', async () => {
    await service.cancelOrder('A-1');

    await expect(service.cancelOrder('A-1')).rejects.toThrow(
      'ALREADY_CANCELLED',
    );

    expect(gateway.refund).toHaveBeenCalledTimes(1);
    expect(notifier.send).toHaveBeenCalledTimes(1);
  });

  describe('фіксація часу', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-15T10:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('записує момент скасування замовлення', async () => {
      await service.cancelOrder('A-1');

      const saved = await store.findById('A-1');
      expect(saved?.cancelledAt).toBe('2026-03-15T10:00:00.000Z');
    });
  });

  describe('з HTTP-шлюзом, перехопленим MSW', () => {
    beforeEach(() => {
      service = new CancelService(
        store,
        new HttpPaymentGateway('https://payments.example.com'),
        notifier,
      );
    });

    it('скасовує замовлення після успішної відповіді шлюзу', async () => {
      await expect(service.cancelOrder('A-1')).resolves.toEqual({
        refundId: 'R-1',
      });

      expect((await store.findById('A-1'))?.status).toBe('cancelled');
      expect(notifier.send).toHaveBeenCalledTimes(1);
    });

    it('не надсилає листа, якщо шлюз відповів помилкою 500', async () => {
      server.use(
        http.post(REFUND_URL, () => new HttpResponse(null, { status: 500 })),
      );

      await expect(service.cancelOrder('A-1')).rejects.toThrow('REFUND_FAILED');

      expect((await store.findById('A-1'))?.status).toBe('paid');
      expect(notifier.send).not.toHaveBeenCalled();
    });

    it('не надсилає листа, якщо шлюз повернув некоректний формат', async () => {
      server.use(http.post(REFUND_URL, () => HttpResponse.json({ ok: true })));

      await expect(service.cancelOrder('A-1')).rejects.toThrow(
        'INVALID_REFUND_FORMAT',
      );

      expect(notifier.send).not.toHaveBeenCalled();
    });
  });
});
