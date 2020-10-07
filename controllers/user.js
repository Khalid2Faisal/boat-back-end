const { User } = require("../models/user");
const { Blog } = require("../models/blog");
const _ = require("lodash");
const formidable = require("formidable");
const fs = require("fs");
const { errorHandler } = require("../helpers/dbErrorHandler");

const read = (req, res) => {
  req.profile.hashed_password = undefined;
  // console.log(req.profile);
  return res.json(req.profile);
};

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

// const updateProfile = (req, res) => {
//   let userData = req.body
//   console.log(req.body);
//   let { name, username, email, about } = userData
//   let fields = { name, username, email, about }
//   let user = req.profile
//   console.log(req.profile);

//   user = _.extend(user, fields)

//   if (userData.photo) {
//     if (userData.photo.size > 10000000) {
//       return res.status(400).json({
//         error: "Image should be less than 10mb"
//       })
//     }
//     user.photo.data = fs.readFileSync(userData.photo.path);
//     user.photo.contentType = userData.photo.type;
//   }
//   console.log(user);
//   User.findOneAndUpdate({_id: user._id}, { photo: user.photo, username: user.username }, {new: true}, (err, user) => {
//     if (err) {
//       return res.status(400).json({
//         error: "Cann't update"
//       })
//     }
//     user.hashed_password = undefined;
//     res.json(user)
//     console.log(user);
//   })

  // user.save((err, result) => {
  //   if (err) {
  //     return res.status(400).json({
  //       error: "Cann't update",
  //     });
  //   }
  //   user.hashed_password = undefined;
  //   res.json(user);
  // });
// }

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
    return res.json(user)
  });
};

module.exports = {
  read,
  publicProfile,
  updateProfile,
  profilePhoto,
  getUser,
};
