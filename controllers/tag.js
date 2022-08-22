const { Tag } = require("../models/tag");
const slugify = require("slugify");
const { Blog } = require("../models/blog");
const { errorHandler } = require("../helpers/dbErrorHandler");

/**
 * It takes the name of the tag from the request body, creates a slug from the name, creates a new tag
 * object with the name and slug, and then saves the tag to the database
 * @param req - The request object.
 * @param res - response object
 */
const create = (req, res) => {
  const { name } = req.body;
  let slug = slugify(name).toLowerCase();
  let tag = new Tag({ name, slug });

  tag.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json(data);
  });
};

/**
 * Find all tags in the database and return them in a JSON object.
 * @param req - The request object.
 * @param res - response object
 */
const list = (req, res) => {
  Tag.find({}).exec((err, data) => {
    if (err || !data) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json(data);
  });
};

/**
 * It finds a tag by its slug, then finds all blogs that have that tag, and returns the tag and the
 * blogs.
 * </code>
 * @param req - The request object.
 * @param res - response object
 */
const read = (req, res) => {
  const slug = req.params.slug.toLowerCase();

  Tag.findOne({ slug }).exec((err, tag) => {
    if (err || !tag) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }

    // res.json(tag);

    Blog.find({ tags: tag })
      .populate("categories", "_id name slug")
      .populate("tags", "_id name slug")
      .populate("postedBy", "_id name")
      .select(
        "_id title slug excrept categories tags postedBy createdAt updatedAt"
      )
      .sort({ updatedAt: -1 })
      .exec((err, data) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        res.json({ tag: tag, blogs: data });
      });
  });
};

/**
 * It finds a tag by its slug and deletes it
 * @param req - The request object represents the HTTP request and has properties for the request query
 * string, parameters, body, HTTP headers, and so on.
 * @param res - The response object.
 */
const remove = (req, res) => {
  const slug = req.params.slug.toLowerCase();

  Tag.findOneAndDelete({ slug }).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json({
      message: "tag deleted successfully",
    });
  });
};

/* Exporting the functions so that they can be used in other files. */
module.exports = {
  create,
  list,
  read,
  remove,
};
