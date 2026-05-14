const { validationResult } = require('express-validator');

/**
 * Run after express-validator chains. Returns 400 with field errors if validation fails.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
}

module.exports = validate;
