//config express
const express = require("express");
const mongoose = require("mongoose");
const app = express();
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

app.use(express.json());
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

//creating server
app.listen(process.env.PORT, () => {
  console.log("server has started");
});

//handel unhandled Rejection error
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled rejection occured! Shutting down...");

  server.close(() => {
    process.exit(1);
  });
});
