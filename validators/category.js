const { check } = require("express-validator");

const categoryValidator = [
  check("name").not().isEmpty().withMessage("Name is required"),
];

module.exports = {
  categoryValidator,
}