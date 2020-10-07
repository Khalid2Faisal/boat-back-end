// requiring libraries
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// requiring routes
const blogRoutes = require("./routes/blogs");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const tagRoutes = require("./routes/tag");
const contactRoutes = require("./routes/contact");

// app
const app = express();

// helmet and compression
require("./prod/prod")(app);

const database =
  process.env.NODE_ENV === production
    ? process.env.CLOUD_DATABASE
    : process.env.LOCAL_DATABASE;

// connecting to db
mongoose
  .connect(database, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log("database connected succefully"))
  .catch((err) => {
    console.log(`cann't connect to database`, err);
  });

// middlewares
app.use(express.json());
app.use(morgan("dev"));
// cors
if ((process.env.NODE_ENV = "development")) {
  app.use(cors({ origin: process.env.CLIENT_URL }));
}

// using routes
app.use("/api", blogRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", tagRoutes);
app.use("/api", contactRoutes);

// listening to the port
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
