import type { Notifier } from './order-service';

export interface CancellableOrder {
  id: string;
  email: string;
  amountUah: number;
  status: 'paid' | 'cancelled';
  cancelledAt?: string;
}

export interface CancelOrderStore {
  findById(id: string): Promise<CancellableOrder | undefined>;
  markCancelled(id: string, cancelledAt: string): Promise<void>;
}

export interface RefundResult {
  refundId: string;
}

export interface PaymentGateway {
  refund(orderId: string, amountUah: number): Promise<RefundResult>;
}

export class CancelService {
  constructor(
    private store: CancelOrderStore,
    private gateway: PaymentGateway,
    private notifier: Notifier,
  ) {}

  async cancelOrder(orderId: string): Promise<RefundResult> {
    const order = await this.store.findById(orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status === 'cancelled') throw new Error('ALREADY_CANCELLED');

    const refund = await this.gateway.refund(order.id, order.amountUah);
    await this.store.markCancelled(order.id, new Date().toISOString());
    await this.notifier.send(
      order.email,
      `Замовлення ${order.id} скасовано, ${order.amountUah} грн повернено`,
    );
    return refund;
  }
}
