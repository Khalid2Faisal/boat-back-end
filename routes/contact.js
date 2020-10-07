const express = require("express");
const router = express.Router();

// controllers
const { contact, contactBlogAuthor } = require("../controllers/contact");
// validators
const { runValidation } = require("../validators");
const { contactFormValidator } = require("../validators/contact");

router.post(
  "/contact",
  contactFormValidator,
  runValidation,
  contact
);
router.post(
  "/contact-blog-author",
  contactFormValidator,
  runValidation,
  contactBlogAuthor
);

module.exports = router;
