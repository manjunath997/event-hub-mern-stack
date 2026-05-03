const express = require('express');
const { body, param } = require('express-validator');
const {
  createBooking,
  listMyBookings,
  cancelBooking,
} = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.post(
  '/',
  authenticate,
  [
    body('eventId').isMongoId(),
    body('seats').isInt({ min: 1 }),
  ],
  validateRequest,
  createBooking
);

router.get('/mine', authenticate, listMyBookings);
router.delete(
  '/:id',
  authenticate,
  param('id').isMongoId(),
  validateRequest,
  cancelBooking
);

module.exports = router;
