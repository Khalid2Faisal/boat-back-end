const express = require("express");
const router = express.Router();
const {
  create,
  list,
  listAllBlogsCategoriesTags,
  getBlogSize,
  listAllFeatured,
  read,
  remove,
  update,
  photo,
  listRelated,
  listSearch,
  listByUser,
  authorOfTheMonth,
  statistics,
} = require("../controllers/blogs");
const {
  requireSignin,
  adminMiddleware,
  authMiddleware,
  canUpdateDeleteBlog,
} = require("../controllers/auth");

router.post("/blog", requireSignin, adminMiddleware, create);
router.get("/blogs", list);
router.post("/blogs-categories-tags", listAllBlogsCategoriesTags);
router.get("/blogs/size", getBlogSize);
router.get("/featured", listAllFeatured);
router.get("/blog/:slug", read);
router.delete("/blog/:slug", requireSignin, adminMiddleware, remove);
router.put("/blog/:slug", requireSignin, adminMiddleware, update);
router.get("/blog/photo/:slug", photo);
router.post("/blogs/related", listRelated);
router.get("/blogs/search", listSearch);
router.get("/auther-of-the-month", authorOfTheMonth);
router.get("/statistics", statistics);

// regular user crud
router.post("/user/blog", requireSignin, authMiddleware, create);
router.delete(
  "/user/blog/:slug",
  requireSignin,
  authMiddleware,
  canUpdateDeleteBlog,
  remove
);
router.put(
  "/user/blog/:slug",
  requireSignin,
  authMiddleware,
  canUpdateDeleteBlog,
  update
);
router.get("/:username/blogs", listByUser);

module.exports = router;
