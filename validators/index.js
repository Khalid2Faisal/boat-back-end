const { validationResult } = require("express-validator");

/**
 * If there are errors, return a 422 status code with the first error message. Otherwise, continue to
 * the next middleware
 * @param req - The request object.
 * @param res - The response object.
 * @param next - This is a callback function that will be called when the middleware is complete.
 * @returns The errors object is being returned.
 */
const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: errors.errors[0].msg });
  }
  next();
};

module.exports = {
  runValidation,
};
