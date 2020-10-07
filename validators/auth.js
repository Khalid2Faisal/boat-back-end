const { check } = require("express-validator");

const userSignupValidator = [
  check("name").not().isEmpty().withMessage("Name is reqired"),
  check("email").isEmail().withMessage("Must be a valid email adress"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("password must be at least 6 characters long"),
];

const userSigninValidator = [
  check("email")
    .not()
    .isEmpty()
    .isEmail()
    .withMessage("Must be a valid email adress"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("password must be at least 6 characters long"),
];

const forgotPasswordValidator = [
  check("email")
    .not()
    .isEmpty()
    .isEmail()
    .withMessage("Must be a valid email adress"),
];

const resetPasswordValidator = [
  check("newPassword")
    .not()
    .isEmpty()
    .isLength({ min: 6 })
    .withMessage("password must be at least 6 characters long"),
];

module.exports = {
  userSignupValidator,
  userSigninValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
