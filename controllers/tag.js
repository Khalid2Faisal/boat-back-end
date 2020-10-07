const { Tag } = require("../models/tag");
const slugify = require("slugify");
const { Blog } = require("../models/blog");
const { errorHandler } = require("../helpers/dbErrorHandler");

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

module.exports = {
  create,
  list,
  read,
  remove,
};
