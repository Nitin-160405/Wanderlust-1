const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const {validateReview, isLoggedin} = require("../middleware.js");
const reviewController = require("../controllers/review.js");



router.post("/", isLoggedin, validateReview, wrapAsync(reviewController.createReview));

//delete review route

router.delete(
  "/:reviewId",
  wrapAsync(reviewController.destroyReview)
);

module.exports = router;