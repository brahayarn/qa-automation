import type { PaymentGateway, RefundResult } from './cancel-service';

export class HttpPaymentGateway implements PaymentGateway {
  constructor(private baseUrl: string) {}

  async refund(orderId: string, amountUah: number): Promise<RefundResult> {
    const response = await fetch(`${this.baseUrl}/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amountUah }),
    });
    if (!response.ok) throw new Error('REFUND_FAILED');

    const data = (await response.json()) as { refundId?: unknown };
    if (typeof data.refundId !== 'string') {
      throw new Error('INVALID_REFUND_FORMAT');
    }
    return { refundId: data.refundId };
  }
}
