const CustomError = require("../utils/customError");

const devErrors = (res, error) => {
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    stackTrace: error.stack,
    error: error,
  });
};

const prodErrors = (res, error) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "something went wrong ! Please try again later",
    });
  }
};

const castErrorHandler = (err) => {
  const msg = `Invalid value for ${err.path}: ${err.value}!`;
  return new CustomError(msg, 400);
};

const dubKeyErrorHandler = (err, name) => {
  const msg = `There is already a movie with name ${name}. Please use another name!`;
  return new CustomError(msg, 400);
};

const validationErrorHandler = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const errorMessages = errors.join(` ,`);
  const msg = `Invalid input dat : ${errorMessages}`;
  return new CustomError(msg, 400);
};
const jwtExpiredErrorHandler = (err) => {
  return new CustomError("JWT has expird. please login again", 401);
};
const jwtErrorHandler = (err) => {
  return new CustomError("Invalid token. please login again", 401);
};

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";
  if (process.env.NODE_ENV === "development") {
    devErrors(res, error);
  } else {
    if (error.code === 11000) error = dubKeyErrorHandler(error, req.body.name);
    if (error.name === "CastError") error = castErrorHandler(error);
    if (error.name === "ValidationError") error = validationErrorHandler(error);
    if (error.name === "TokenExpiredError")
      error = jwtExpiredErrorHandler(error);
    if (error.name === "JsonWebTokenError") error = jwtErrorHandler(error);

    prodErrors(res, error);
  }
};
