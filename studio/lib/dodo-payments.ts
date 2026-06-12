/**
 * Dodo Payments checkout initialization.
 * Opens the Dodo-hosted checkout page for subscription or one-time payments.
 */

export interface DodoCheckoutOptions {
  checkout_url: string
  return_url?: string
  onSuccess?: () => void
  onCancel?: () => void
}

/**
 * Redirect the user to Dodo Payments checkout page.
 * After payment, Dodo redirects back to `return_url`.
 */
export function initDodoCheckout(options: DodoCheckoutOptions): void {
  if (!options.checkout_url) {
    console.error('No checkout URL provided')
    return
  }
  window.location.href = options.checkout_url
}

/**
 * Open checkout in a new tab/popup instead of redirecting.
 */
export function openDodoCheckoutPopup(options: DodoCheckoutOptions): Window | null {
  if (!options.checkout_url) {
    console.error('No checkout URL provided')
    return null
  }
  const popup = window.open(options.checkout_url, '_blank', 'width=600,height=700')
  return popup
}
