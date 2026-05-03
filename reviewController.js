const { validationResult } = require('express-validator');
const Review = require('../models/Review');
const Booking = require('../models/Booking');

/** List reviews + average for an event */
async function listReviews(req, res, next) {
  try {
    const reviews = await Review.find({ event: req.params.eventId })
      .sort({ createdAt: -1 })
      .populate('user', 'name')
      .lean();

    const avg =
      reviews.length === 0
        ? 0
        : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

    res.json({
      reviews,
      averageRating: Math.round(avg * 10) / 10,
      count: reviews.length,
    });
  } catch (err) {
    next(err);
  }
}

/** User must have a confirmed booking for the event to review (one review per user per event). */
async function createReview(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId } = req.params;
    const { rating, comment } = req.body;

    const hasBooking = await Booking.exists({
      user: req.user.id,
      event: eventId,
      status: 'confirmed',
    });
    if (!hasBooking) {
      return res.status(403).json({
        message: 'You can only review events you have attended (confirmed booking).',
      });
    }

    const review = await Review.create({
      user: req.user.id,
      event: eventId,
      rating: parseInt(rating, 10),
      comment: comment || '',
    });

    const populated = await Review.findById(review._id).populate('user', 'name');
    res.status(201).json({ review: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You already reviewed this event' });
    }
    next(err);
  }
}

module.exports = { listReviews, createReview };
