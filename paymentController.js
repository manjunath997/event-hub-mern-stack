const Booking = require('../models/Booking');
const { getStripe } = require('../utils/stripe');
const { finalizeBooking } = require('./bookingController');

/**
 * Stripe webhook: raw body required. Confirms pending bookings after payment.
 */
async function stripeWebhook(req, res, next) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return res.status(503).json({ message: 'Stripe webhook not configured' });
  }

  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const bookingId = session.metadata && session.metadata.bookingId;
      if (!bookingId) {
        return res.json({ received: true });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking || booking.status !== 'pending_payment') {
        return res.json({ received: true });
      }

      const result = await finalizeBooking(booking);
      if (!result.ok) {
        console.error('Webhook could not finalize booking:', result.message);
        // Payment succeeded but seats gone — ops should refund manually
      }
    }
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { stripeWebhook };
