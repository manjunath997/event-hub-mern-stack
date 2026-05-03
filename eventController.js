const { validationResult } = require('express-validator');
const Event = require('../models/Event');
const path = require('path');

/**
 * Build public image URL from stored filename.
 */
function imageUrl(req, filename) {
  if (!filename) return '';
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/events/${path.basename(filename)}`;
}

/** List events with search (title) and filters (date range, location). */
async function listEvents(req, res, next) {
  try {
    const { q, dateFrom, dateTo, location } = req.query;
    const filter = {};

    if (q && String(q).trim()) {
      const term = String(q).trim();
      const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: new RegExp(safe, 'i') },
        { description: new RegExp(safe, 'i') },
      ];
    }
    if (location && String(location).trim()) {
      filter.location = new RegExp(String(location).trim(), 'i');
    }
    if (dateFrom || dateTo) {
      filter.dateTime = {};
      if (dateFrom) filter.dateTime.$gte = new Date(dateFrom);
      if (dateTo) filter.dateTime.$lte = new Date(dateTo);
    }

    const events = await Event.find(filter)
      .sort({ dateTime: 1 })
      .populate('createdBy', 'name email')
      .lean();

    const withUrls = events.map((e) => ({
      ...e,
      imageUrl: e.image ? imageUrl(req, e.image) : '',
    }));

    res.json({ events: withUrls });
  } catch (err) {
    next(err);
  }
}

async function getEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const obj = event.toObject();
    obj.imageUrl = obj.image ? imageUrl(req, obj.image) : '';
    res.json({ event: obj });
  } catch (err) {
    next(err);
  }
}

async function createEvent(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { title, description, dateTime, location, totalSeats } = req.body;
    const seats = parseInt(totalSeats, 10);
    const payload = {
      title,
      description,
      dateTime: new Date(dateTime),
      location,
      totalSeats: seats,
      availableSeats: seats,
      createdBy: req.user.id,
    };
    if (req.file) {
      payload.image = req.file.filename;
    }
    const event = await Event.create(payload);
    const obj = event.toObject();
    obj.imageUrl = obj.image ? imageUrl(req, obj.image) : '';
    res.status(201).json({ event: obj });
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const { title, description, dateTime, location, totalSeats } = req.body;
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (dateTime !== undefined) event.dateTime = new Date(dateTime);
    if (location !== undefined) event.location = location;

    if (totalSeats !== undefined) {
      const newTotal = parseInt(totalSeats, 10);
      const sold = event.totalSeats - event.availableSeats;
      if (newTotal < sold) {
        return res.status(400).json({
          message: `Cannot set total seats below already booked (${sold})`,
        });
      }
      event.totalSeats = newTotal;
      event.availableSeats = newTotal - sold;
    }

    if (req.file) {
      event.image = req.file.filename;
    }

    await event.save();
    const obj = event.toObject();
    obj.imageUrl = obj.image ? imageUrl(req, obj.image) : '';
    res.json({ event: obj });
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const Booking = require('../models/Booking');
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const activeBookings = await Booking.countDocuments({
      event: event._id,
      status: { $in: ['confirmed', 'pending_payment'] },
    });
    if (activeBookings > 0) {
      return res.status(400).json({
        message: 'Cannot delete event with active or pending bookings. Cancel bookings first.',
      });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  imageUrl,
};
