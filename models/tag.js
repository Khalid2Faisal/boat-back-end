const mongoose = require("mongoose");

/* Creating a schema for the Tag model. */
const tagSchema = new mongoose.Schema(
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

/* Creating a model for the Tag schema. */
const Tag = mongoose.model("Tag", tagSchema);

/* Exporting the Tag model. */
module.exports = {
  Tag,
};
