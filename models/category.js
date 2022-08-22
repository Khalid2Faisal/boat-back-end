const mongoose = require("mongoose");

/* Creating a schema for the category model. */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      max: 32,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* Creating a model for the category schema. */
const Category = mongoose.model("Category", categorySchema);

/* Exporting the Category model. */
module.exports = {
  Category,
};
