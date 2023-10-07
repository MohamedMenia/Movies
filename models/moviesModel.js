const mongoose = require("mongoose");
const fs = require("fs");

const movieSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required field"],
      unique: true,
      trim: true,
      maxlength: [100, "Movie name must not have more than 100 characters"],
      minlength: [4, "Movie name must have at least 4 characters"],
    },
    genres: {
      type: [String],
      require: [true, "genres is required field"],
      // enum: {
      //      values: ["Action", "Adventure", "Sci-Fi", "Thriller", "Crime", "Drama", "Comedy", "Romance", "Biography"],
      //      message: "This genre does not exist"
      // }
    },
    descreption: {
      type: String,
      required: [true, "descreption is required field"],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "duration is required field"],
    },
    actors: {
      type: [String],
    },
    directors: {
      type: [String],
    },
    ratings: {
      type: Number,
      default: 1.0,
      validate: {
        validator: function (value) {
          return value >= 1 && value <= 10;
        },
        message: "ratings should be above 1 and blow 10",
      },
      require: [true, "ratings is required field"],
    },
    totalRating: {
      type: Number,
    },
    releaseYear: {
      type: Number,
      required: [true, "release year is required field"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    createdBy: {
      type: String,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
movieSchema.pre("save", function (next) {
  this.createdBy = process.env.ADMINNAME;
  next();
});

movieSchema.post("save", function (doc, next) {
  const content = `A new movie document with name ${doc.name} hase been created by ${doc.createdBy}`;
  fs.writeFileSync("./log/log.txt", "\n" + content, { flag: "a" }, (err) => {
    console.log(err.message);
  });
  next();
});

movieSchema.virtual("durationInHours").get(function () {
  return this.duration / 60;
});
const Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;
