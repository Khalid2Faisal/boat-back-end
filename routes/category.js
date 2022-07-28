const express = require("express");
const router = express.Router();

// controllers
const { create, list, read, remove } = require("../controllers/category");
const { requireSignin, adminMiddleware } = require("../controllers/auth");

// validators
const { runValidation } = require("../validators");
const { categoryValidator } = require("../validators/category");

router.post(
  "/category",
  categoryValidator,
  runValidation,
  requireSignin,
  adminMiddleware,
  create
);
router.get("/categories", list);
router.post("/category/:slug", read);
router.delete("/category/:slug", requireSignin, adminMiddleware, remove);

module.exports = router;
