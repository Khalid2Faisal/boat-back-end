"use strict";

/** get unique error field name */
/**
 * It takes an error object as an argument and returns a string that is the name of the field that is
 * already in use.
 * @param error - The error object that was thrown
 * @returns The error message is being returned.
 */
const uniqueMessage = (error) => {
  let output;

  try {
    let fieldName = error.message.substring(
      error.message.lastIndexOf(".$") + 2,
      error.message.lastIndexOf("_1")
    );
    output =
      fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + "already exists";
  } catch (ex) {
    output = "Unique field already exists";
  }

  return output;
};

/** get the error message from the error object */
/**
 * It takes an error object and returns a string message.
 * @param error - The error object that is thrown by Mongoose.
 * @returns The error message.
 */
const errorHandler = (error) => {
  let message = "";

  if (error.code) {
    switch (error.code) {
      case 11000:
      case 11001:
        message = uniqueMessage(error);
        break;
      default:
        message = "something went wrong";
    }
  } else {
    for (let errorName in error.errors) {
      if (error.errors[errorName].message)
        message = error.errors[errorName].message;
    }
  }

  return message;
};

/* Exporting the errorHandler function. */
module.exports = {
  errorHandler,
};
