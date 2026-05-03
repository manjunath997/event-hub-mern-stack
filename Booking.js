const mongoose = require('mongoose');

const BOOKING_STATUS = ['pending_payment', 'confirmed', 'cancelled'];

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    seats: { type: Number, required: true, min: 1 },
    status: { type: String, enum: BOOKING_STATUS, default: 'confirmed' },
    /** Stripe PaymentIntent or Checkout Session id when payment is used */
    stripePaymentId: { type: String, default: null },
    /** Opaque ticket id encoded in QR (set when confirmed) */
    ticketId: { type: String, index: true },
    qrCodeDataUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, event: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.BOOKING_STATUS = BOOKING_STATUS;
