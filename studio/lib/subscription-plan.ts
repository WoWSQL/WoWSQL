/**
 * Plan helpers for subscription-gated features.
 */

export interface PlanInfo {
  plan_name?: string
  name?: string
  status?: string
  billing_cycle?: string
  current_period_end?: string
}

export function getPlanSlug(plan: PlanInfo | null | undefined): string {
  return (plan?.plan_name || plan?.name || 'free').toLowerCase()
}

export function canCreateDedicatedProject(plan: PlanInfo | null | undefined): boolean {
  const slug = getPlanSlug(plan)
  return slug === 'pro' || slug === 'scale'
}

export function isBillingBlocked(plan: PlanInfo | null | undefined): boolean {
  if (!plan) return false
  const status = plan.status?.toLowerCase()
  return status === 'payment_failed' || status === 'expired'
}

export function getBillingWallMessage(plan: PlanInfo | null | undefined): string {
  if (!plan) return 'Please subscribe to a plan.'
  if (plan.status === 'payment_failed') return 'Your payment failed. Please update your payment method.'
  if (plan.status === 'expired') return 'Your subscription has expired. Please resubscribe.'
  return 'Subscription required.'
}

export function isPaidPlan(plan: PlanInfo | null | undefined): boolean {
  const slug = getPlanSlug(plan)
  return slug !== 'free'
}

export function isSubscriptionActive(plan: PlanInfo | null | undefined): boolean {
  return plan?.status === 'active' || plan?.status === 'trial'
}
