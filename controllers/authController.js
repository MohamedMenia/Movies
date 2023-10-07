const User = require("../models/userModel");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const jwt = require("jsonwebtoken");
const CustomError = require("../utils/customError");
const util = require("util");
const sendEmail = require("../utils/email");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.SECRET_STR, {
    expiresIn: process.env.LOGIN_EXPIRES,
  });
};

exports.signup = asyncErrorHandler(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const token = signToken(newUser._id);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser,
    },
  });
});
exports.login = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email && !password) {
    const error = new CustomError("please provide email & password", 400);
    return next(error);
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    const error = new CustomError("incorrect email", 400);
    return next(error);
  }

  const isMatch = await user.comparePassword(password, user.password);
  if (!isMatch) {
    const error = new CustomError("incorrect password", 400);
    return next(error);
  }

  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token,
  });
});
exports.protect = asyncErrorHandler(async (req, res, next) => {
  let token = req.headers.authorization;
  if (token && token.startsWith("Bearer")) {
    token = token.split(" ")[1];
  } else {
    const error = new CustomError("you are not logged in! ", 401);
    return next(error);
  }
  const decodedtoken = await util.promisify(jwt.verify)(
    token,
    process.env.SECRET_STR
  );

  const user = await User.findById(decodedtoken.id);
  if (!user) {
    const error = new CustomError("the user with given id not exist", 404);
    next(error);
  }
  req.user = user;
  next();
});

exports.restrict = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      const error = new CustomError(
        "you don't have permission to perform this action",
        403
      );
      next(error);
    }
    next();
  };
};

exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    const error = new CustomError(
      "we could not find the user with given email",
      404
    );
    next(error);
  }
  const resetToken = user.creatResetPasswordToken();
  await user.save();

  const resetUrl = `${req.protocol}://${req.get(
    `host`
  )}/users/resetPassword/${resetToken}`;
  const message = `We have received a password reset request please use the below link to reset your password\n\n ${resetUrl}\n\nthis password link will be only vaild for 10 minutes.`;
  try {
    await sendEmail({
      email: user.email,
      subject: "password change request received",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "password reset link send to the user email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();
    const error = new CustomError(
      "There was an error sending password reset email, please try again",
      500
    );
    next(error);
  }
});
exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  const passwordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: passwordToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });
  console.log(user);
  if (!user) {
    const error = new CustomError("token is invalid or expired", 400);
    next(error);
  }
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  user.save();

  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token,
  });
});
