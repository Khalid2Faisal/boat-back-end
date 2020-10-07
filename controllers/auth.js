const { User } = require("../models/user");
const shortId = require("shortid");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const _ = require("lodash");
const { Blog } = require("../models/blog");
const { errorHandler } = require("../helpers/dbErrorHandler");
const sgMail = require("@sendgrid/mail");
const { OAuth2Client } = require("google-auth-library")
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const preSignup = (req, res) => {
  const { name, email, password } = req.body;
  User.findOne({ email: email.toLowerCase() }, (err, user) => {
    if (user) {
      return res.status(400).json({
        error: "Email is taken",
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
        message: `Email has been sent to ${email}`,
      });
    });
  });
};

// const signup = (req, res) => {
//   User.findOne({ email: req.body.email }).exec((err, user) => {
//     if (user) {
//       return res.status(400).json({
//         error: "This email is already taken",
//       });
//     }

//     const { name, email, password } = req.body;
// let username = shortId.generate();
// let profile = `${process.env.CLIENT_URL}/profile/${username}`;

//     let newUser = new User({ name, email, password, profile, username });
//     newUser.save((err, success) => {
//       if (err) {
//         return res.status(400).json({
//           err: err,
//         });
//       }
//       res.json({ message: "Signup success! please sign in." });
//     });
//   });
// };

const signup = (req, res) => {
  const token = req.body.token;
  if (token) {
    jwt.verify(token, process.env.JWT_ACOUNT_ACTIVATION, function (
      err,
      decoded
    ) {
      if (err) {
        return res.status(401).json({
          error: "Expired link. Signup again.",
        });
      }
      const { name, email, password } = jwt.decode(token);
      let username = shortId.generate();
      let profile = `${process.env.CLIENT_URL}/profile/${username}`;

      const user = new User({name, email, password, username, profile})
      user.save((err, user) => {
        if (err) {
          return res.status(401).json({
            error: errorHandler(err)
          })
        }
        return res.json({
          message: "Signup success! Please signin."
        })
      })
    });
  } else {
    return res.status(400).json({
      error: "Something went wrong. Please try again later."
    })
  }
};

const signin = (req, res) => {
  const { email, password } = req.body;
  // check if the user exists
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "this email does not exist! please sign up.",
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
    });
  });
};

const signout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Signout success" });
};

const requireSignin = expressJwt({ secret: process.env.JWT_SECRET });

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
        error: "Admin resource. Access denied.",
      });
    }

    req.profile = user;
    next();
  });
};

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
        error: "You are not authorized",
      });
    }
    next();
  });
};

const forgotPassword = (req, res) => {
  const { email } = req.body;

  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({
        error: "User with that email does not exist",
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

const resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;

  if (resetPasswordLink) {
    jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function (
      err,
      decoded
    ) {
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
            message: `Great! Now you can login with the new password`,
          });
        });
      });
    });
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const googleLogin = (req, res) => {
  const idToken = req.body.tokenId
  client.verifyIdToken({idToken, audience: process.env.GOOGLE_CLIENT_ID}).then(response => {
    const { email_verified, name, email, jti } = response.payload;
    if (email_verified) {
      User.findOne({ email }).exec((err, user) => {
        if (user) {
          const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: '10d'})
          res.cookie('token', token, { expiresIn: '10d' })
          const { _id, name, email, role, username } = user;
          return res.json({ token, user: { _id, name, email, role, username } })
        } else {
          let username = shortId.generate()
          let profile = `${process.env.CLIENT_URL}/profile/${username}`
          let password = jti;
          user = new User({ name, email, profile, username, password });
          user.save((err, data) => {
            if (err) {
              return res.status(401).json({
                error: errorHandler(err)
              })
            }
            const token = jwt.sign({_id: data._id}, process.env.JWT_SECRET, {expiresIn: '10d'})
            res.cookie('token', token, { expiresIn: '10d' })
            const {_id, name, email, username, role} = data
            return res.json({ token, user: { _id, name, email, role, username } })
          })
        }
      })
    } else {
      return res.status(400).json({
        error: "Google login failed. Try again later."
      })
    }
  })
}

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
