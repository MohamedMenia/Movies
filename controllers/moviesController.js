const Movie = require("../models/moviesModel");
const ApiFeatures = require("../utils/apiFeatures");
const CustomError = require("../utils/customError");
const asyncErrorHandler = require("../utils/asyncErrorHandler");

exports.getHighestRated = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratings";
  next();
};

exports.getAllMovies = asyncErrorHandler(async (req, res) => {
  const features = new ApiFeatures(Movie.find(), req.query)
    .filter()
    .sort()
    .paginate();

  const [totalPages, movies] = await Promise.all([
    features.getTotalPages(),
    features.query,
  ]);

  res.status(200).json({
    status: "success",
    length: movies.length,
    totalPages,
    data: { movies },
  });
});

exports.createMovie = asyncErrorHandler(async (req, res) => {
  const movie = await Movie.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      movie,
    },
  });
});

exports.getMovie = asyncErrorHandler(async (req, res, next) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) {
    const error = new CustomError("Movie with that ID is not found!", 404);
    return next(error);
  }
  res.status(201).json({
    status: "success",
    data: {
      movie,
    },
  });
});

exports.updateMovie = asyncErrorHandler(async (req, res) => {
  const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updatedMovie) {
    const error = new CustomError("Movie with that ID is not found!", 404);
    return next(error);
  }

  res.status(200).json({
    status: "success",
    data: { movie: updatedMovie },
  });
});

exports.deleteMovie = asyncErrorHandler(async (req, res) => {
  const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
  if (!deletedMovie) {
    const error = new CustomError("Movie with that ID is not found!", 404);
    return next(error);
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getMovieByGenre = asyncErrorHandler(async (req, res, next) => {
  const genre = req.params.genre;
  const movies = await Movie.aggregate([
    { $unwind: "$genres" },
    {
      $group: {
        _id: "$genres",
        movieCount: { $sum: 1 },
        movies: { $push: "$name" },
      },
    },
    { $addFields: { genre: "$_id" } },
    { $project: { _id: 0 } },
    { $sort: { movieCount: -1 } },
    //{$limit: 6}
    //{$match: {genre: genre}}
  ]);

  res.status(200).json({
    status: "success",
    count: movies.length,
    data: {
      movies,
    },
  });
});
