const express = require('express');
const { body, param } = require('express-validator');
const {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { uploadEventImage } = require('../middleware/upload');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

const eventBodyRules = [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('dateTime').optional().isISO8601(),
  body('location').optional().trim().notEmpty(),
  body('totalSeats').optional().isInt({ min: 1 }),
];

router.get('/', listEvents);
router.get('/:id', param('id').isMongoId(), validateRequest, getEvent);

router.post(
  '/',
  authenticate,
  requireAdmin,
  uploadEventImage.single('image'),
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('dateTime').isISO8601(),
    body('location').trim().notEmpty(),
    body('totalSeats').isInt({ min: 1 }),
  ],
  validateRequest,
  createEvent
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  uploadEventImage.single('image'),
  [param('id').isMongoId(), ...eventBodyRules],
  validateRequest,
  updateEvent
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  param('id').isMongoId(),
  validateRequest,
  deleteEvent
);

module.exports = router;
