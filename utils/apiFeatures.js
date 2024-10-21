class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
    this.totalPages = 0;
  }

  filter() {
    let queryString = JSON.stringify(this.queryStr);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    let queryOBJ;
    try {
      queryOBJ = JSON.parse(queryString);
    } catch (error) {
      throw new Error("Invalid query string");
    }

    const excludeFields = ["sort", "limit", "page"];
    excludeFields.forEach((field) => delete queryOBJ[field]);

    this.query = this.query.find(queryOBJ);
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  paginate() {
    const page = this.queryStr.page * 1 || 1;
    const limit = this.queryStr.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  getTotalPages() {
    const limit = this.queryStr.limit * 1 || 10;
    return this.query.model
      .countDocuments(this.query.getQuery())
      .then((totalDocuments) => Math.ceil(totalDocuments / limit));
  }
}

module.exports = ApiFeatures;
