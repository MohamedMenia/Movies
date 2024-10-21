const express = require("express");
const router = express.Router();
const moviesController = require("../controllers/moviesController");
const authController = require("../controllers/authController");

router
  .route("/highest-rated")
  .get(moviesController.getHighestRated, moviesController.getAllMovies);

router
  .route("/")
  .get(authController.protect, moviesController.getAllMovies)
  .post(
    authController.protect,
    authController.restrict("admin"),
    moviesController.createMovie
  );

router
  .route("/:id")
  .get(authController.protect, moviesController.getMovie)
  .patch(
    authController.protect,
    authController.restrict("admin"),
    moviesController.updateMovie
  )
  .delete(
    authController.protect,
    authController.restrict("admin"),
    moviesController.deleteMovie
  );

module.exports = router;
