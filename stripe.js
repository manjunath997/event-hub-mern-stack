/**
 * Lazy Stripe client — only when STRIPE_SECRET_KEY is set.
 */
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // eslint-disable-next-line global-require
  return require('stripe')(key);
}

function isStripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

module.exports = { getStripe, isStripeEnabled };
