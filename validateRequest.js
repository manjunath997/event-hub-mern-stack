const { validationResult } = require('express-validator');

/** Run after express-validator chains on the same route */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = { validateRequest };
