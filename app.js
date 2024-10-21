//config express
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const rateLimiter = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const helmet = require("helmet");
//importing routes
const authRoutes = require("./routes/authRouter");
const moviesRoutes = require("./routes/moviesRoutes");

// config env file
const dotEnv = require("dotenv");
dotEnv.config({ path: "./config.env" });

//importing error handler class and globalErrorHandler func
const CustomError = require("./utils/customError");
const globalErrorHandler = require("./controllers/errorController");

//connecting database
mongoose
  .connect(process.env.LOCAL_DB_STR, {
    useNewUrlParser: true,
  })
  .catch((error) => {
    console.log(error);
  });

  // setting security http headers
const limiter = rateLimiter({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message:
    "We have received too many requests from this IP, please try again in an hour",
});

app.use(limiter);
app.use(mongoSanitize());
app.use(xss());
app.use(helmet());

app.use(
  express.json({
    limit: "10kb",
  })
);
app.use("/movies", moviesRoutes);
app.use("/users", authRoutes);
app.all("*", (req, res, next) => {
  // globalErrorHandler
  // const err = new Error(`can't find  ${req.originalUrl} on the server`);
  // err.status = "fail";
  // err.statusCode = 404;
  const err = new CustomError(
    `can't find  ${req.originalUrl} on the server`,
    404
  );
  next(err);
});

app.use(globalErrorHandler);

//handel unhandled Rejection error
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled rejection occured! Shutting down...");

  server.close(() => {
    process.exit(1);
  });
});
//creating server
app.listen(process.env.PORT, () => {
  console.log("server has started");
});
