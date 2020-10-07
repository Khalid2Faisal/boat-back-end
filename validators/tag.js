const { check } = require("express-validator");

const tagValidator = [
  check("name").not().isEmpty().withMessage("Name is required"),
];

module.exports = {
  tagValidator,
}