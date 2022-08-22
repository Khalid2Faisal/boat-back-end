const { Blog } = require("../models/blog");
const { Category } = require("../models/category");
const { User } = require("../models/user");
const { Tag } = require("../models/tag");
const formidable = require("formidable");
const slugify = require("slugify");
const stripHtml = require("string-strip-html");
const _ = require("lodash");
const { errorHandler } = require("../helpers/dbErrorHandler");
const fs = require("fs");
const smartTrim = require("../helpers/smartTrim");

/**
 * It creates a blog post, saves it to the database, and then updates the blog post with the categories
 * and tags.
 * @param req - The request object.
 * @param res - The response object.
 */
const create = (req, res) => {
  const form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Image could not be upload",
      });
    }

    const { title, body, categories, tags } = fields;

    if (!title || !title.length) {
      return res.status(400).json({
        error: "Title is required",
      });
    }

    if (!body || body.length < 200) {
      return res.status(400).json({
        error: "Content is too short",
      });
    }

    if (!categories || categories.length === 0) {
      return res.status(400).json({
        error: "At least one category is required",
      });
    }

    if (!tags || tags.length === 0) {
      return res.status(400).json({
        error: "At least one tag is required",
      });
    }

    let blog = new Blog();
    blog.title = title;
    blog.body = body;
    blog.excrept = smartTrim(body, 320, "", " ...");
    blog.slug = slugify(title).toLowerCase();
    blog.mtitle = `${title} | ${process.env.APP_NAME}`;
    blog.mdesc = stripHtml(body.substring(0, 160));
    blog.postedBy = req.user._id;

    let arrayOfCategories = categories && categories.split(",");
    let arrayOfTags = tags && tags.split(",");

    if (files.photo) {
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: "Image should be less than 1mb in size",
        });
      }
      blog.photo.data = fs.readFileSync(files.photo.path);
      blog.photo.contentType = files.photo.type;
    }

    blog.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      Blog.findByIdAndUpdate(
        result._id,
        { $push: { categories: arrayOfCategories } },
        { new: true }
      ).exec((err, result) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        } else {
          Blog.findByIdAndUpdate(
            result._id,
            { $push: { tags: arrayOfTags } },
            { new: true }
          ).exec((err, result) => {
            if (err) {
              return res.status(400).json({
                error: errorHandler(err),
              });
            } else {
              res.json(result);
            }
          });
        }
      });
    });
  });
};

/**
 * It finds all the blogs, populates the categories, tags, and postedBy fields, selects the fields to
 * be returned, and then executes the query.
 * @param req - The request object.
 * @param res - response object
 */
const list = (req, res) => {
  Blog.find({})
    .populate("categories", "_id name slug")
    .populate("tags", "_id name slug")
    .populate("postedBy", "_id name username about")
    .select(
      "_id title slug excerpt categories tags postedBy createdAt updatedAt"
    )
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      } else {
        res.json(data);
      }
    });
};

/**
 * It fetches all the blogs, categories and tags from the database and sends them to the frontend
 * @param req - The request object.
 * @param res - the response object
 */
const listAllBlogsCategoriesTags = (req, res) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 10;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;

  let blogs;
  let categories;
  let tags;

  Blog.find({})
    .populate("categories", "_id name slug")
    .populate("tags", "_id name slug")
    .populate("postedBy", "_id name username about")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .select(
      "_id title slug excrept categories tags postedBy createdAt updatedAt"
    )
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      } else {
        blogs = data;
        Category.find({}).exec((err, c) => {
          if (err) {
            return res.status(400).json({
              error: errorHandler(err),
            });
          } else {
            categories = c;

            Tag.find({}).exec((err, t) => {
              if (err) {
                return res.status(400).json({
                  error: errorHandler(err),
                });
              } else {
                tags = t;

                res.json({ blogs, categories, tags, count: blogs.length });
              }
            });
          }
        });
      }
    });
};

/**
 * It returns the number of documents in the Blog collection.
 * @param req - request object
 * @param res - response object
 */
const getBlogSize = (req, res) => {
  Blog.estimatedDocumentCount({}, (err, count) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    } else {
      res.json(count);
    }
  });
};

/**
 * It finds all the blogs that are featured and returns them to the user
 * @param req - The request object represents the HTTP request and has properties for the request query
 * string, parameters, body, HTTP headers, and so on.
 * @param res - response object
 */
const listAllFeatured = (req, res) => {
  let limit = 8;
  let blogs;

  Blog.find({ isFeatured: true })
    .populate("categories", "_id name slug")
    .populate("tags", "_id name slug")
    .populate("postedBy", "_id name username about")
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select(
      "_id title slug excrept categories tags postedBy createdAt updatedAt"
    )
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      } else {
        blogs = data;
        res.json({ blogs });
      }
    });
};

/**
 * It finds the user with the isAuthorOfTheMonth property set to true, selects the _id, name, and about
 * properties, sorts the results by the updatedAt property in descending order, limits the results to
 * one, and then executes the query.
 * @param req - The request object represents the HTTP request and has properties for the request query
 * string, parameters, body, HTTP headers, and so on.
 * @param res - the response object
 */
const authorOfTheMonth = (req, res) => {
  User.find({ isAuthorOfTheMonth: true })
    .select("_id name about")
    .sort({ updatedAt: -1 })
    .limit(1)
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      } else {
        auther = data;
        res.json(auther);
      }
    });
};

/**
 * It takes a slug from the URL, finds the blog with that slug, populates the categories, tags, and
 * postedBy fields, and returns the blog as JSON
 * @param req - request
 * @param res - response object
 */
const read = (req, res) => {
  const slug = req.params.slug.toLowerCase();
  Blog.findOne({ slug })
    .populate("categories", "_id name slug")
    .populate("tags", "_id name slug")
    .populate("postedBy", "_id name username about")
    .select(
      "_id title body slug mtitle mdesc categories tags postedBy createdAt updatedAt"
    )
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      } else {
        res.json(data);
      }
    });
};

/**
 * It finds a blog by its slug and removes it from the database
 * @param req - request
 * @param res - The response object.
 */
const remove = (req, res) => {
  const slug = req.params.slug.toLowerCase();
  Blog.findOneAndRemove({ slug }).exec((err) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    } else {
      res.json({
        message: "Blog deleted successfully",
      });
    }
  });
};

/**
 * It takes the slug of the blog post, finds the blog post, and then updates the blog post with the new
 * data
 * @param req - The request object.
 * @param res - response object
 */
const update = (req, res) => {
  const slug = req.params.slug.toLowerCase();

  Blog.findOne({ slug }).exec((err, oldBlog) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }

    let form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, (err, fields, files) => {
      if (err) {
        return res.status(400).json({
          error: "Image could not be uploaded",
        });
      }

      let slugBeforeMerge = oldBlog.slug;
      oldBlog = _.merge(oldBlog, fields);
      oldBlog.slug = slugBeforeMerge;

      const { body, desc, categories, tags } = fields;

      if (body) {
        oldBlog.excrept = smartTrim(body, 320, " ", " ...");
        oldBlog.desc = stripHtml(body.substring(0, 160));
      }

      if (categories) {
        oldBlog.categories = categories.split(",");
      }

      if (tags) {
        oldBlog.tags = tags.split(",");
      }

      if (files.photo) {
        if (files.photo.size > 10000000) {
          return res.status(400).json({
            error: "Image should be less than 10mb in size",
          });
        }
        oldBlog.photo.data = fs.readFileSync(files.photo.path);
        oldBlog.photo.contentType = files.photo.type;
      }

      oldBlog.save((err, result) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        res.json(result);
      });
    });
  });
};

// It takes the slug from the URL, finds the blog with that slug, and then sends the photo data to the
// client.

// @param req - request
// @param res - The response object.
const photo = (req, res) => {
  const slug = req.params.slug.toLowerCase();
  Blog.findOne({ slug })
    .select("photo")
    .exec((err, blog) => {
      if (err || !blog) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.set("Content-Type", blog.photo.contentType);
      return res.send(blog.photo.data);
    });
};

/**
 * It takes the id of the blog post and the categories of the blog post and finds all blog posts that
 * are not the same as the id of the blog post and have the same categories as the blog post.
 * @param req - request object
 * @param res - response object
 */
const listRelated = (req, res) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 3;
  const { _id, categories } = req.body.post;

  Blog.find({ _id: { $ne: _id }, categories: { $in: categories } })
    .limit(limit)
    .populate("postedBy", "_id name username profile about")
    .select("title slug mdesc postedBy createdAt updatedAt")
    .exec((err, blogs) => {
      if (err) {
        return res.status(400).json({
          error: "Blogs not found",
        });
      }

      res.json(blogs);
    });
};

/**
 * If the search query is present, then find the blogs that match the search query and return them
 * @param req - request
 * @param res - response
 */
const listSearch = (req, res) => {
  const { search } = req.query;
  if (search) {
    Blog.find(
      {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { body: { $regex: search, $options: "i" } },
        ],
      },
      (err, blogs) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        res.json(blogs);
      }
    ).select("-photo -body");
  }
};

/**
 * It takes the username from the URL, finds the user in the database, then finds all the blogs that
 * were posted by that user.
 * @param req - request
 * @param res - response
 */
const listByUser = (req, res) => {
  let username = req.params.username;
  User.findOne({ username }).exec((err, user) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    let userId = user._id;
    Blog.find({ postedBy: userId })
      .populate("categories", "_id name slug")
      .populate("tags", "_id name slug")
      .populate("postedBy", "_id name username")
      .select("_id title slug postedBy createdAt updatedAt")
      .exec((err, data) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        res.json(data);
      });
  });
};

/**
 * It returns the number of blogs, authors, tags, categories, users, authors of the month and featured
 * blogs
 * @param req - The request object.
 * @param res - response object
 */
const statistics = (req, res) => {
  Blog.find({}).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    } else {
      const blogsLength = data.length;
      const authors = data.map((blog) => {
        return JSON.stringify(blog.postedBy);
      });
      const uniqueAuthors = new Set([...authors]);
      const authorsNumber = uniqueAuthors.size;
      Tag.find({}).exec((err, data) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        } else {
          const tagsCount = data.length;
          Category.find({}).exec((err, data) => {
            if (err) {
              return res.status(400).json({
                error: errorHandler(err),
              });
            } else {
              const categoriesCount = data.length;
              User.find({}).exec((err, data) => {
                if (err) {
                  return res.status(400).json({
                    error: errorHandler(err),
                  });
                } else {
                  const usersCount = data.length;
                  User.find({ isAuthorOfTheMonth: true }).exec((err, data) => {
                    if (err) {
                      return res.status(400).json({
                        error: errorHandler(err),
                      });
                    } else {
                      const authorsOfTheMonthCount = data.length;
                      Blog.find({ isFeatured: true }).exec((err, data) => {
                        if (err) {
                          return res.status(400).json({
                            error: errorHandler(err),
                          });
                        } else {
                          const featuredBlogsCount = data.length;
                          res.json({
                            blogsLength,
                            authorsNumber,
                            tagsCount,
                            categoriesCount,
                            usersCount,
                            authorsOfTheMonthCount,
                            featuredBlogsCount,
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
};

/* Exporting the functions from the blog.controller.js file. */
module.exports = {
  create,
  list,
  listAllBlogsCategoriesTags,
  getBlogSize,
  listAllFeatured,
  authorOfTheMonth,
  read,
  remove,
  update,
  photo,
  listRelated,
  listSearch,
  listByUser,
  statistics,
};
