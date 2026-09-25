import { describe, expect, it } from 'vitest'

import { CreateOrderRequestSchema, HealthResponseSchema } from '../api'
import { AppError, ErrorCode, ValidationError } from '../errors'
import { OrderStatus, UserRole } from '../enums'

describe('contracts sanity checks', () => {
  it('HealthResponseSchema accepts a valid payload', () => {
    const result = HealthResponseSchema.safeParse({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
    expect(result.success).toBe(true)
  })

  it('CreateOrderRequestSchema rejects an order with no line items', () => {
    const result = CreateOrderRequestSchema.safeParse({
      storeId: '11111111-1111-1111-1111-111111111111',
      currency: 'CDF',
      lineItems: [],
      clientOperationId: '22222222-2222-2222-2222-222222222222',
    })
    expect(result.success).toBe(false)
  })

  it('ValidationError carries the correct error code and HTTP status', () => {
    const err = new ValidationError('Bad input')
    expect(err).toBeInstanceOf(AppError)
    expect(err.code).toBe(ErrorCode.VALIDATION_ERROR)
    expect(err.httpStatus).toBe(400)
  })

  it('enums export the expected values', () => {
    expect(UserRole.CASHIER).toBe('cashier')
    expect(OrderStatus.COMPLETED).toBe('completed')
  })
})
