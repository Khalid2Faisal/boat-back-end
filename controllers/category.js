const { Category } = require("../models/category");
const { Blog } = require("../models/blog");
const slugify = require("slugify");
const { errorHandler } = require("../helpers/dbErrorHandler");

/**
 * It takes the name of the category from the request body, creates a slug from the name, creates a new
 * category with the name and slug, and then saves the category to the database.
 * @param req - The request object.
 * @param res - The response object.
 */
const create = (req, res) => {
  const { name } = req.body;
  let slug = slugify(name).toLowerCase();
  let category = new Category({ name, slug });

  category.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json(data);
  });
};

/**
 * It finds all the categories in the database and returns them in a JSON format.
 * @param req - The request object represents the HTTP request and has properties for the request query
 * string, parameters, body, HTTP headers, and so on.
 * @param res - response object
 */
const list = (req, res) => {
  Category.find({}).exec((err, data) => {
    if (err || !data) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json(data);
  });
};

/**
 * It takes a category slug, finds the category, then finds all blogs that have that category, and
 * returns the category and the blogs.
 * @param req - The request object.
 * @param res - response object
 */
const read = (req, res) => {
  const slug = req.params.slug.toLowerCase();
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;
  let limit = req.body.limit ? parseInt(req.body.limit) : 4;

  Category.findOne({ slug }).exec((err, category) => {
    if (err || !category) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    // res.json(category);

    Blog.find({ categories: category })
      .populate("categories", "_id name slug")
      .populate("tags", "_id name slug")
      .populate("postedBy", "_id name username")
      .select(
        "_id title slug mdesc categories tags postedBy createdAt updatedAt"
      )
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec((err, data) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        res.json({ category: category, blogs: data });
      });
  });
};

/**
 * It finds a category by its slug and deletes it.
 * @param req - request
 * @param res - The response object.
 */
const remove = (req, res) => {
  const slug = req.params.slug.toLowerCase();

  Category.findOneAndDelete({ slug }).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json({
      message: "category deleted successfully",
    });
  });
};

/* Exporting the functions in the file. */
module.exports = {
  create,
  list,
  read,
  remove,
};
