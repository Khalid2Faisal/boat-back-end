const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

/* Creating a schema for the blog. */
const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      min: 3,
      max: 160,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    body: {
      type: {},
      required: true,
      min: 200,
      max: 2000000,
    },
    excrept: {
      type: String,
      max: 1000,
    },
    mtitle: {
      type: String,
    },
    mdesc: {
      type: String,
    },
    photo: {
      data: Buffer,
      contentType: String,
    },
    categories: [{ type: ObjectId, ref: "Category", required: true }],
    tags: [{ type: ObjectId, ref: "Tag", required: true }],
    postedBy: {
      type: ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

/* Creating a model for the blog. */
const Blog = mongoose.model("Blog", blogSchema);

/* Exporting the Blog model. */
module.exports = {
  Blog,
};
