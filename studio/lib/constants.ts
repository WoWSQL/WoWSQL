// WoWSQL Self-Hosted — Configuration Constants
// All traffic goes through the local Kong gateway or directly to the mini backend.

const cleanUrl = (url: string) => url.replace(/\/$/, '')

function configuredUrl(name: string, developmentFallback: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`${name} must be configured for production; localhost fallback is disabled.`)
    }
    return developmentFallback
  }

  const parsed = new URL(value)
  const localHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)$/i.test(parsed.hostname)
  const allowedProtocol = name === 'NEXT_PUBLIC_WS_URL'
    ? ['wss:']
    : ['https:']

  if (process.env.NODE_ENV === 'production' && (localHost || !allowedProtocol.includes(parsed.protocol))) {
    throw new Error(`${name} must use a public ${allowedProtocol.join('/')} URL in production.`)
  }

  return cleanUrl(value)
}

// Public API origin. Production builds must supply real reachable URLs.
export const API_URL = configuredUrl('NEXT_PUBLIC_API_URL', 'http://localhost:8080')
export const KONG_URL = configuredUrl('NEXT_PUBLIC_KONG_URL', 'http://localhost:8080')
export const WS_URL = configuredUrl('NEXT_PUBLIC_WS_URL', 'ws://localhost:8080')
export const DASHBOARD_URL = configuredUrl('NEXT_PUBLIC_DASHBOARD_URL', 'http://localhost:3000')
export const STORAGE_URL = cleanUrl(process.env.NEXT_PUBLIC_KONG_URL || 'http://localhost:8080')

// Anon key for PostgREST access through Kong
export const ANON_KEY = process.env.NEXT_PUBLIC_ANON_KEY || ''

// External URLs (kept for compatibility with copied pages)
export const EXTERNAL_URLS = {
  API_DOCS: `${KONG_URL}/rest/v1/`,
  API_REDOC: `${KONG_URL}/rest/v1/`,
}

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: `${API_URL}/api/v1/auth/register`,
    LOGIN: `${API_URL}/api/v1/auth/login`,
    ME: `${API_URL}/api/v1/auth/me`,
    REFRESH: `${API_URL}/api/v1/auth/refresh`,
    LOGOUT: `${API_URL}/api/v1/auth/logout`,
    SETUP_STATUS: `${API_URL}/api/v1/auth/setup-status`,
    API_KEYS: `${API_URL}/api/v1/auth/api-keys`,
    VERIFY_EMAIL: `${API_URL}/api/v1/auth/verify-email`,
    RESEND_VERIFICATION: `${API_URL}/api/v1/auth/resend-verification`,
    FORGOT_PASSWORD: `${API_URL}/api/v1/auth/forgot-password`,
    RESET_PASSWORD: `${API_URL}/api/v1/auth/reset-password`,
    OAUTH_CONFIG: `${API_URL}/api/v1/auth/oauth/config`,
    OAUTH_GOOGLE: `${API_URL}/api/v1/auth/oauth/google`,
    OAUTH_GITHUB: `${API_URL}/api/v1/auth/oauth/github`,
    OAUTH_SET_PASSWORD: `${API_URL}/api/v1/auth/oauth/set-password`,
    OAUTH_PASSWORD_STATUS: `${API_URL}/api/v1/auth/oauth/password-status`,
  },
  PROJECTS: {
    LIST: `${API_URL}/api/v1/projects`,
    CREATE: `${API_URL}/api/v1/projects`,
  },
  DATABASE: {
    TABLES: `${API_URL}/api/v1/db/tables`,
    QUERY: (table: string) => `${API_URL}/api/v1/db/tables/${table}/query`,
    INSERT: (table: string) => `${API_URL}/api/v1/db/tables/${table}/insert`,
    UPDATE: (table: string) => `${API_URL}/api/v1/db/tables/${table}/update`,
    DELETE: (table: string) => `${API_URL}/api/v1/db/tables/${table}/delete`,
  },
  STORAGE: {
    BASE: `${KONG_URL}/storage/v1`,
    BUCKETS: `${API_URL}/api/v1/storage/buckets`,
    UPLOAD: (bucket: string) => `${API_URL}/api/v1/storage/buckets/${bucket}/upload`,
    FILES: (bucket: string) => `${API_URL}/api/v1/storage/buckets/${bucket}/files`,
  },
  REALTIME: {
    WS: `${WS_URL}/realtime/v1/ws`,
  },
  REST: {
    BASE: `${KONG_URL}/rest/v1`,
  },
  RDS: {
    PRICING: `${API_URL}/api/v1/rds/pricing`,
    REGIONS: `${API_URL}/api/v1/rds/regions`,
    INSTANCES: `${API_URL}/api/v1/rds/instances`,
    INSTANCE: (id: number) => `${API_URL}/api/v1/rds/instances/${id}`,
    STATUS: (id: number) => `${API_URL}/api/v1/rds/instances/${id}/status`,
    CONNECTION: (id: number) => `${API_URL}/api/v1/rds/instances/${id}/connection`,
    LINK_PROJECT: (id: number) => `${API_URL}/api/v1/rds/instances/${id}/link-project`,
    BILLING: (id: number) => `${API_URL}/api/v1/rds/instances/${id}/billing`,
    SHARED_TO_RDS: `${API_URL}/api/v1/rds/shared-migration/migrate`,
    REGION_MIGRATION: `${API_URL}/api/v1/rds/region-migration/migrate`,
    UPGRADE: `${API_URL}/api/v1/rds/upgrade/modify-instance`,
    CALCULATE_UPGRADE_COST: `${API_URL}/api/v1/rds/upgrade/calculate-cost`,
    MIGRATION_STATUS: (slug: string) => `${API_URL}/api/v1/rds/migration-status/${slug}`,
  },
  PRICING: {
    PLANS: `${API_URL}/api/v1/pricing/plans`,
    CURRENT_PLAN: `${API_URL}/api/v1/pricing/current-plan`,
    SUBSCRIBE: `${API_URL}/api/v1/pricing/subscribe`,
    UPGRADE: `${API_URL}/api/v1/pricing/upgrade`,
    CANCEL: `${API_URL}/api/v1/pricing/cancel`,
    RESUBSCRIBE: `${API_URL}/api/v1/pricing/resubscribe`,
    USAGE_SUMMARY: `${API_URL}/api/v1/pricing/usage-summary`,
    PAYMENT_HISTORY: `${API_URL}/api/v1/pricing/billing/payment-history`,
    INVOICE: (paymentId: string) => `${API_URL}/api/v1/pricing/invoice/${paymentId}`,
  },
  STATUS: {
    SYSTEM: `${API_URL}/api/v1/status`,
    HEALTH: `${API_URL}/health`,
    METRICS: `${API_URL}/api/v1/status/metrics`,
  },
  CONTACT: {
    SUBMIT: `${API_URL}/api/v1/contact/submit`,
    HEALTH: `${API_URL}/api/v1/contact/health`,
  },
  DOCS: `${API_URL}/docs`,
  HEALTH: `${API_URL}/health`,
}
