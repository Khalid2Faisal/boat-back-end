const { User } = require("../models/user");
const shortId = require("shortid");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const _ = require("lodash");
const { Blog } = require("../models/blog");
const { errorHandler } = require("../helpers/dbErrorHandler");
const sgMail = require("@sendgrid/mail");
const { OAuth2Client } = require("google-auth-library");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * It takes the user's name, email, and password from the request body, checks if the email is already
 * taken, and if it's not, it creates a token, sends an email to the user with the token, and returns a
 * message to the user.
 * @param req - The request object.
 * @param res - The response object.
 */
const preSignup = (req, res) => {
  const { name, email, password } = req.body;
  User.findOne({ email: email.toLowerCase() }, (err, user) => {
    if (user) {
      return res.status(400).json({
        error: "Sorry, this email is already taken.",
      });
    }
    const token = jwt.sign(
      { name, email, password },
      process.env.JWT_ACOUNT_ACTIVATION,
      { expiresIn: "10m" }
    );

    const emailData = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: `Acount activation link`,
      html: `
        <p>Please use the following link to activate your acount</p>
        <p>${process.env.CLIENT_URL}/auth/account/activate/${token}</p>
        <hr />
        <p>This email may contain sensetive information</p>
        <p>https://devtodev.com</p>
      `,
    };

    sgMail.send(emailData).then((sent) => {
      return res.json({
        message: `Please activate your account. Activation link has been sent to ${email}`,
      });
    });
  });
};

/**
 * It takes a token from the request body, verifies it, and then saves the user to the database.
 * @param req - The request object.
 * @param res - response object
 * @returns The user is being returned.
 */
const signup = (req, res) => {
  const token = req.body.token;
  if (token) {
    jwt.verify(
      token,
      process.env.JWT_ACOUNT_ACTIVATION,
      function (err, decoded) {
        if (err) {
          return res.status(401).json({
            error: "Expired link. Please, Register again.",
          });
        }
        const { name, email, password } = jwt.decode(token);
        let username = shortId.generate();
        let profile = `${process.env.CLIENT_URL}/profile/${username}`;

        const user = new User({ name, email, password, username, profile });
        user.save((err, user) => {
          if (err) {
            return res.status(401).json({
              error: errorHandler(err),
            });
          }
          return res.json({
            message: "You registered successfully. Please login.",
          });
        });
      }
    );
  } else {
    return res.status(400).json({
      error: "Something went wrong. Please try again later.",
    });
  }
};

/**
 * It takes in the user's email and password, checks if the user exists, if the user exists, it checks
 * if the password is correct, if the password is correct, it generates a token and sends it to the
 * client.
 * @param req - The request object.
 * @param res - the response object
 */
const signin = (req, res) => {
  const { email, password } = req.body;
  // check if the user exists
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "This email does not exist! please Register.",
      });
    }
    // authenticate
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: "Email and password do not match!",
      });
    }
    // generate token to send to client
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10d",
    });

    res.cookie("token", token, { expiresIn: "10d" });

    const { _id, username, name, role, email } = user;
    return res.json({
      token,
      user: { _id, username, name, role, email },
      message: "Welcome back!",
    });
  });
};

/**
 * It clears the cookie named "token" and sends a JSON response with a message
 * @param req - The request object.
 * @param res - The response object.
 */
const signout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "You've successfully logged out." });
};

/* A middleware that checks if the user is logged in. */
const requireSignin = expressJwt({ secret: process.env.JWT_SECRET });

/**
 * It takes the user id from the request object, finds the user in the database, and then adds the user
 * to the request object.
 * @param req - The request object.
 * @param res - The response object.
 * @param next - This is a callback function that is called when the middleware is complete.
 */
const authMiddleware = (req, res, next) => {
  const authUserId = req.user._id;
  User.findById({ _id: authUserId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found!",
      });
    }
    req.profile = user;
    next();
  });
};

/**
 * If the user is not an admin, then return an error message.
 * @param req - The request object.
 * @param res - The response object.
 * @param next - This is a callback function that will be called when the middleware is complete.
 */
const adminMiddleware = (req, res, next) => {
  const adminUserId = req.user._id;
  User.findById({ _id: adminUserId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found!",
      });
    }

    if (user.role !== 1) {
      return res.status(400).json({
        error: "Only admin can do this action.",
      });
    }

    req.profile = user;
    next();
  });
};

/**
 * It checks if the user is authorized to update or delete a blog post.
 * @param req - The request object.
 * @param res - response object
 * @param next - This is a callback function that is called when the middleware is complete.
 */
const canUpdateDeleteBlog = (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  Blog.findOne({ slug }).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    let authorizedUser =
      data.postedBy._id.toString() === req.profile._id.toString();
    if (!authorizedUser) {
      return res.status(400).json({
        error: "You are not authorized to do this action.",
      });
    }
    next();
  });
};

/**
 * It takes the email from the request body, finds the user with that email, creates a token, sends an
 * email with a link to reset the password, and updates the user's resetPasswordLink with the token.
 * @param req - The request object.
 * @param res - The response object.
 */
const forgotPassword = (req, res) => {
  const { email } = req.body;

  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({
        error: "User with that email does not exist.",
      });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, {
      expiresIn: "10m",
    });

    const emailData = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: `Password reset link`,
      html: `
        <p>Please use the following link to reset your password</p>
        <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
        <hr />
        <p>This email may contain sensetive information</p>
        <p>https://devtodev.com</p>
      `,
    };

    return user.updateOne({ resetPasswordLink: token }, (err, success) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      } else {
        sgMail.send(emailData).then((sent) => {
          return res.json({
            message: `Email has been sent to ${email}. Follow the instructions to reset your password. Link expires in 10 minutes.`,
          });
        });
      }
    });
  });
};

/**
 * It takes the resetPasswordLink and newPassword from the request body, verifies the
 * resetPasswordLink, finds the user with the resetPasswordLink, updates the user's password and
 * resetPasswordLink, and sends a response to the client.
 * @param req - The request object.
 * @param res - The response object.
 * @returns The user is being returned.
 */
const resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;

  if (resetPasswordLink) {
    jwt.verify(
      resetPasswordLink,
      process.env.JWT_RESET_PASSWORD,
      function (err, decoded) {
        if (err) {
          return res.status(401).json({
            error: "Expired link. please, try again.",
          });
        }
        User.findOne({ resetPasswordLink }, (err, user) => {
          if (err || !user) {
            return res.status(401).json({
              error: "Something went wrong. Try later",
            });
          }
          const updatedFields = {
            password: newPassword,
            resetPasswordLink: "",
          };

          user = _.extend(user, updatedFields);
          user.save((err, result) => {
            if (err) {
              return res.status(401).json({
                error: errorHandler(err),
              });
            }
            res.json({
              message: `Great! Now you can login with the new password.`,
            });
          });
        });
      }
    );
  }
};

/* The below code is using the Google OAuth2Client to verify the idToken that is sent from the
frontend. If the idToken is verified, the user is then checked to see if they exist in the database.
If they do, they are logged in. If they don't, they are created and logged in. */
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const googleLogin = (req, res) => {
  const idToken = req.body.tokenId;
  client
    .verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
    .then((response) => {
      const { email_verified, name, email, jti } = response.payload;
      if (email_verified) {
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "10d",
            });
            res.cookie("token", token, { expiresIn: "10d" });
            const { _id, name, email, role, username } = user;
            return res.json({
              token,
              user: { _id, name, email, role, username },
              message: "Welcome to Boat Travel!",
            });
          } else {
            let username = shortId.generate();
            let profile = `${process.env.CLIENT_URL}/profile/${username}`;
            let password = jti;
            user = new User({ name, email, profile, username, password });
            user.save((err, data) => {
              if (err) {
                return res.status(401).json({
                  error: errorHandler(err),
                });
              }
              const token = jwt.sign(
                { _id: data._id },
                process.env.JWT_SECRET,
                { expiresIn: "10d" }
              );
              res.cookie("token", token, { expiresIn: "10d" });
              const { _id, name, email, username, role } = data;
              return res.json({
                token,
                user: { _id, name, email, role, username },
                message: "Welcome to Boat Travel!",
              });
            });
          }
        });
      } else {
        return res.status(400).json({
          error: "Google login failed. Try again later.",
        });
      }
    });
};

/* Exporting all the functions from the auth.js file. */
module.exports = {
  preSignup,
  signup,
  signin,
  signout,
  requireSignin,
  authMiddleware,
  adminMiddleware,
  canUpdateDeleteBlog,
  forgotPassword,
  resetPassword,
  googleLogin,
};
