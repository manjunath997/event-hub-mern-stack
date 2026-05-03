const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { buildQrForBooking, newTicketId } = require('../utils/qrTicket');
const { getStripe, isStripeEnabled } = require('../utils/stripe');
const { notifyUser } = require('../realtime');

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

/** Amount per seat in smallest currency unit (e.g. cents) for Stripe demo */
function amountPerSeatCents() {
  const n = parseInt(process.env.STRIPE_AMOUNT_CENTS_PER_SEAT || '100', 10);
  return Number.isFinite(n) && n > 0 ? n : 100;
}

/**
 * Confirm booking: decrement seats atomically, set QR and status.
 */
async function finalizeBooking(bookingDoc) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const updated = await Event.findOneAndUpdate(
      { _id: bookingDoc.event, availableSeats: { $gte: bookingDoc.seats } },
      { $inc: { availableSeats: -bookingDoc.seats } },
      { new: true, session }
    );
    if (!updated) {
      await session.abortTransaction();
      return { ok: false, message: 'Not enough seats available' };
    }

    const ticketId = newTicketId();
    bookingDoc.status = 'confirmed';
    bookingDoc.ticketId = ticketId;
    bookingDoc.qrCodeDataUrl = await buildQrForBooking(
      bookingDoc._id,
      bookingDoc.event,
      ticketId
    );
    await bookingDoc.save({ session });
    await session.commitTransaction();

    notifyUser(bookingDoc.user.toString(), 'booking:confirmed', {
      bookingId: bookingDoc._id.toString(),
      eventId: bookingDoc.event.toString(),
      ticketId: bookingDoc.ticketId,
    });

    return { ok: true, booking: bookingDoc };
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

async function createBooking(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId, seats } = req.body;
    const seatCount = parseInt(seats, 10);
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.dateTime < new Date()) {
      return res.status(400).json({ message: 'Cannot book past events' });
    }

    const stripe = getStripe();

    if (stripe && isStripeEnabled()) {
      const booking = await Booking.create({
        user: req.user.id,
        event: eventId,
        seats: seatCount,
        status: 'pending_payment',
      });

      const unitAmount = amountPerSeatCents();
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        success_url: `${clientUrl}/bookings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/events/${eventId}?payment=cancelled`,
        metadata: {
          bookingId: booking._id.toString(),
          userId: req.user.id,
        },
        line_items: [
          {
            price_data: {
              currency: (process.env.STRIPE_CURRENCY || 'usd').toLowerCase(),
              product_data: {
                name: `${event.title} — ${seatCount} seat(s)`,
              },
              unit_amount: unitAmount,
            },
            quantity: seatCount,
          },
        ],
      });

      booking.stripePaymentId = checkoutSession.id;
      await booking.save();

      return res.status(201).json({
        booking,
        checkoutUrl: checkoutSession.url,
        message: 'Complete payment to confirm your booking',
      });
    }

    // Free flow: confirm immediately with atomic seat decrement
    const booking = await Booking.create({
      user: req.user.id,
      event: eventId,
      seats: seatCount,
      status: 'pending_payment',
    });
    const result = await finalizeBooking(booking);
    if (!result.ok) {
      await Booking.deleteOne({ _id: booking._id });
      return res.status(400).json({ message: result.message });
    }

    const populated = await Booking.findById(result.booking._id).populate('event');
    res.status(201).json({
      booking: populated,
      message: 'Booking confirmed',
    });
  } catch (err) {
    next(err);
  }
}

async function listMyBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('event');
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id).populate('event');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwner = booking.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Already cancelled' });
    }

    if (booking.status === 'pending_payment') {
      booking.status = 'cancelled';
      await booking.save();
      return res.json({ message: 'Pending booking cancelled', booking });
    }

    if (booking.status === 'confirmed') {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await Event.findByIdAndUpdate(
          booking.event._id,
          { $inc: { availableSeats: booking.seats } },
          { session }
        );
        booking.status = 'cancelled';
        await booking.save({ session });
        await session.commitTransaction();
      } catch (e) {
        await session.abortTransaction();
        throw e;
      } finally {
        session.endSession();
      }
    }

    res.json({ message: 'Booking cancelled', booking });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBooking,
  listMyBookings,
  cancelBooking,
  finalizeBooking,
};
