const { validationResult } = require("express-validator");

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: errors.errors[0].msg });
  }
  next();
};

module.exports = {
  runValidation
}
