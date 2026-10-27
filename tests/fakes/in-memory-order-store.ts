import type {
  CancelOrderStore,
  CancellableOrder,
} from '../../src/cancel-service';

export class InMemoryOrderStore implements CancelOrderStore {
  private items = new Map<string, CancellableOrder>();

  constructor(orders: CancellableOrder[] = []) {
    for (const order of orders) this.items.set(order.id, { ...order });
  }

  async findById(id: string): Promise<CancellableOrder | undefined> {
    return this.items.get(id);
  }

  async markCancelled(id: string, cancelledAt: string): Promise<void> {
    const order = this.items.get(id);
    if (order)
      this.items.set(id, { ...order, status: 'cancelled', cancelledAt });
  }
}
