// Shared enums used across the backend and all client apps.
//
// These are the canonical values for domain concepts that appear in more
// than one module. Keep this file in sync with:
//   - MyFriend_POS_Roles_and_Permissions_Matrix_v0_1.docx
//   - MyFriend_POS_Database_Schema_Specification_v0_1.docx
//   - MyFriend_POS_Detailed_Business_Workflow_Specifications_v0_1.docx
//
// This is a Phase 2 scaffold. Values below reflect the specification
// documents as of M0. Expand/correct against the schema doc during M2
// as each domain module is implemented — do not add values here that
// are not backed by a locked specification.

/** Platform and organization roles, per the Roles & Permissions Matrix. */
export enum UserRole {
  PLATFORM_SUPER_ADMIN = 'platform_super_admin',
  PLATFORM_ADMIN = 'platform_admin',
  ORG_OWNER = 'org_owner',
  ORG_ADMIN = 'org_admin',
  BUSINESS_MANAGER = 'business_manager',
  CASHIER = 'cashier',
  INVENTORY_STAFF = 'inventory_staff',
  FINANCE = 'finance',
  KITCHEN_PRODUCTION = 'kitchen_production',
  SERVICE_STAFF = 'service_staff',
  CUSTOMER = 'customer',
}

/** Order lifecycle status. */
export enum OrderStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  COMPLETED = 'completed',
  VOIDED = 'voided',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

/** Payment method. */
export enum PaymentMethod {
  CASH = 'cash',
  MOBILE_MONEY_MPESA = 'mobile_money_mpesa',
  MOBILE_MONEY_AIRTEL = 'mobile_money_airtel',
  MOBILE_MONEY_ORANGE = 'mobile_money_orange',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
}

/** Payment status. */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/** Supported currencies. */
export enum Currency {
  CDF = 'CDF',
  USD = 'USD',
}

/** Supported locales. */
export enum Locale {
  FR = 'fr',
  EN = 'en',
}

/** Organization/business type — drives which workflow set applies. */
export enum BusinessType {
  RETAIL = 'retail',
  RESTAURANT = 'restaurant',
  SERVICE = 'service',
}

/** Cash session status, for open/close cash drawer tracking. */
export enum CashSessionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  RECONCILED = 'reconciled',
}

/** Sync state for offline-originated records (see Offline & Sync Spec, ADR-005). */
export enum SyncState {
  LOCAL_ONLY = 'local_only',
  QUEUED = 'queued',
  UPLOADING = 'uploading',
  SYNCED = 'synced',
  RETRY = 'retry',
  FAILED = 'failed',
  CONFLICT = 'conflict',
}

/** Subscription entitlement tier — gates platform features per organization. */
export enum SubscriptionTier {
  TRIAL = 'trial',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}
