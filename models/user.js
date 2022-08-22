const mongoose = require("mongoose");
const crypto = require("crypto");

/* Creating a schema for the user model. */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      max: 32,
      min: 6,
    },
    name: {
      type: String,
      trim: true,
      required: true,
      max: 32,
      min: 6,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      max: 64,
    },
    profile: {
      type: String,
      required: true,
    },
    hashed_password: {
      type: String,
      required: true,
    },
    salt: String,
    about: {
      type: String,
    },
    role: {
      type: Number,
      default: 0,
    },
    photo: {
      data: Buffer,
      contentType: String,
    },
    resetPasswordLink: {
      data: String,
      default: "",
    },
  },
  { timestamps: true }
);

/* Creating a virtual field called password. */
userSchema
  .virtual("password")
  .set(function (password) {
    // creating temporarity variable called password
    this._password = password;
    // generating salt
    this.salt = this.makeSalt();
    // encrypting password
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

/* Creating methods for the user model. */
userSchema.methods = {
  /* Comparing the plain text password with the hashed password. */
  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },
  /* Encrypting the password. */
  encryptPassword: function (password) {
    if (!password) return "";
    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },
  /* Generating a random number. */
  makeSalt: function () {
    return Math.round(new Date().valueOf() * Math.random()) + "";
  },
};

/* Creating a model called User. */
const User = mongoose.model("User", userSchema);

/* Exporting the User model. */
module.exports = {
  User,
};
