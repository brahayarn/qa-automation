export const orderSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1 },
    tier: { type: 'string', enum: ['basic', 'silver', 'gold'] },
    subtotal: { type: 'number', minimum: 0 },
    total: { type: 'number', minimum: 0 },
    status: { type: 'string', enum: ['new', 'paid', 'shipped'] },
    createdAt: { type: 'string', format: 'date-time' },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          sku: { type: 'string' },
          price: { type: 'number' },
          qty: { type: 'integer' },
        },
        required: ['sku', 'price', 'qty'],
        additionalProperties: false,
      },
    },
  },
  required: ['id', 'tier', 'subtotal', 'total', 'status', 'createdAt', 'items'],
  additionalProperties: false,
} as const;

export const orderListSchema = {
  type: 'array',
  items: orderSchema,
} as const;

export const errorSchema = {
  type: 'object',
  properties: {
    code: { type: 'string', minLength: 1 },
  },
  required: ['code'],
  additionalProperties: false,
} as const;
