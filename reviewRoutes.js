const express = require('express');
const { body, param } = require('express-validator');
const { listReviews, createReview } = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.get(
  '/events/:eventId/reviews',
  param('eventId').isMongoId(),
  validateRequest,
  listReviews
);
router.post(
  '/events/:eventId/reviews',
  authenticate,
  [
    param('eventId').isMongoId(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().trim(),
  ],
  validateRequest,
  createReview
);

module.exports = router;
