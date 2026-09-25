// Shared API request/response schemas, defined with Zod.
//
// This is the single source of truth for what the backend accepts and
// returns. The backend validates incoming requests against these schemas;
// clients (PWA, Business Web, Platform Admin Web, Customer Web) import the
// inferred TypeScript types so a change to a contract is a compile error
// everywhere it's consumed — never a runtime surprise.
//
// This is a Phase 2 scaffold with one worked example (health check) plus
// the shape for a real domain endpoint (create order) to establish the
// pattern. Real endpoint schemas are added module-by-module starting in M2,
// built directly from MyFriend_POS_API_Specification_v0_1.docx — do not
// invent request/response shapes here that the API Spec does not define.

import { z } from 'zod'

import { Currency, OrderStatus, PaymentMethod } from '../enums'

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
})
export type HealthResponse = z.infer<typeof HealthResponseSchema>

// ---------------------------------------------------------------------------
// Orders — worked example of the pattern to follow for every module.
// Replace/expand against the API Specification during M2 (Epic 06/07).
// ---------------------------------------------------------------------------

export const OrderLineItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
})
export type OrderLineItem = z.infer<typeof OrderLineItemSchema>

export const CreateOrderRequestSchema = z.object({
  storeId: z.string().uuid(),
  currency: z.nativeEnum(Currency),
  lineItems: z.array(OrderLineItemSchema).min(1),
  clientOperationId: z.string().uuid(), // idempotency key — required for offline-originated ops
})
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>

export const OrderResponseSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid(),
  status: z.nativeEnum(OrderStatus),
  currency: z.nativeEnum(Currency),
  lineItems: z.array(OrderLineItemSchema),
  total: z.number().nonnegative(),
  createdAt: z.string().datetime(),
})
export type OrderResponse = z.infer<typeof OrderResponseSchema>

// ---------------------------------------------------------------------------
// Payments — worked example, same pattern as Orders above.
// ---------------------------------------------------------------------------

export const CreatePaymentRequestSchema = z.object({
  orderId: z.string().uuid(),
  method: z.nativeEnum(PaymentMethod),
  amount: z.number().positive(),
  clientOperationId: z.string().uuid(),
})
export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequestSchema>

// ---------------------------------------------------------------------------
// Standard API envelopes
// ---------------------------------------------------------------------------

/** Every successful API response is wrapped in this envelope. */
export const ApiSuccessEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  })

/** Every error API response is wrapped in this envelope. Matches the
 *  ErrorCode enum and AppError classes in ../errors. */
export const ApiErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
})
export type ApiErrorEnvelope = z.infer<typeof ApiErrorEnvelopeSchema>

/** Standard pagination query parameters, per the API Specification. */
export const PaginationQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>
