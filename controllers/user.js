const { User } = require("../models/user");
const { Blog } = require("../models/blog");
const _ = require("lodash");
const formidable = require("formidable");
const fs = require("fs");
const { errorHandler } = require("../helpers/dbErrorHandler");

/**
 * The read function is a controller function that returns the user profile.
 * @param req - The request object.
 * @param res - The response object.
 * @returns The user profile.
 */
const read = (req, res) => {
  req.profile.hashed_password = undefined;
  // console.log(req.profile);
  return res.json(req.profile);
};

/**
 * It finds a user by username, then finds all the blogs that user has posted, and returns the user and
 * the blogs in a JSON response.
 * @param req - request
 * @param res - response
 */
const publicProfile = (req, res) => {
  let username = req.params.username;
  let user;
  let blogs;

  User.findOne({ username }).exec((err, userFromDB) => {
    if (err) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    user = userFromDB;
    let userId = user._id;

    Blog.find({ postedBy: userId })
      .populate("categories", "_id name slug")
      .populate("tags", "_id name slug")
      .populate("postedBy", "_id name")
      .limit(10)
      .select(
        "_id title slug excrept categories tags postedBy createdAt updatedAt"
      )
      .exec((err, data) => {
        if (err) {
          return res.status(400).json({
            error: "Blog not found.",
          });
        }
        user.photo = undefined;
        user.hashed_password = undefined;
        res.json({
          user,
          blogs: data,
        });
      });
  });
};

/**
 * It takes the incoming request, parses it, and then saves the data to the database
 * @param req - The request object.
 * @param res - The response object.
 */
const updateProfile = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Photo could not be uploaded",
      });
    }
    let user = req.profile;
    user = _.extend(user, fields);

    if (files.photo) {
      if (files.photo.size > 10000000) {
        return res.status(400).json({
          error: "Image should be less than 10mb",
        });
      }
      user.photo.data = fs.readFileSync(files.photo.path);
      user.photo.contentType = files.photo.type;
    }
    user.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: "Cann't save picture",
        });
      }
      user.hashed_password = undefined;
      res.json(user);
    });
  });
};

/**
 * It takes the userId from the request params, finds the user in the database, and if the user has a
 * photo, it sets the content type and sends the photo data
 * @param req - request
 * @param res - the response object
 */
const profilePhoto = (req, res) => {
  const userId = req.params._id;
  User.findOne({ _id: userId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "Photo not found",
      });
    }
    if (user.photo.data) {
      res.set("Content-Type", user.photo.contentType);
      return res.send(user.photo.data);
    }
  });
};

/**
 * It finds a user by their id and returns the user's information
 * @param req - request
 * @param res - response
 */
const getUser = (req, res) => {
  let userId = req.params._id;
  User.findOne({ _id: userId }).exec((err, user) => {
    if (err) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    // user.photo = undefined;
    user.hashed_password = undefined;
    return res.json(user);
  });
};

/* Exporting the functions in the file. */
module.exports = {
  read,
  publicProfile,
  updateProfile,
  profilePhoto,
  getUser,
};
