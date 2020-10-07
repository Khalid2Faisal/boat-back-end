const express = require("express");
const router = express.Router();

// requiring controllers and validators
const { requireSignin, authMiddleware, adminMiddleware } = require('../controllers/auth')
const { read, publicProfile, updateProfile, profilePhoto, getUser } = require('../controllers/user')

router.get("/user/profile", requireSignin, authMiddleware, read);
router.get("/profile/:username", publicProfile);
router.get("/user/:_id", requireSignin, authMiddleware, getUser)
router.put("/user/update", requireSignin, authMiddleware, updateProfile)
router.get("/user/photo/:_id", profilePhoto)


module.exports = router;
