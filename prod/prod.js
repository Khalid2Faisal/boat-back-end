const helmet = require("helmet");
const compression = require("compression");

/* Exporting a function that is being used in the app.js file. */
module.exports = function (app) {
  app.use(helmet());
  app.use(compression());
};
