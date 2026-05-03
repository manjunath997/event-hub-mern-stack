const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');

/** Admin metrics */
async function adminDashboard(req, res, next) {
  try {
    const [totalEvents, totalBookings, activeUsers] = await Promise.all([
      Event.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      User.countDocuments({ isActive: true }),
    ]);

    const recentBookings = await Booking.find({ status: 'confirmed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .populate('event', 'title dateTime');

    res.json({
      totalEvents,
      totalBookings,
      activeUsers,
      recentBookings,
    });
  } catch (err) {
    next(err);
  }
}

/** User: my bookings summary */
async function userDashboard(req, res, next) {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('event');

    const confirmed = bookings.filter((b) => b.status === 'confirmed');
    res.json({
      registeredEvents: confirmed.length,
      bookings,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { adminDashboard, userDashboard };
