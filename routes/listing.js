const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedin, isOwner, validateListing } = require("../middleware.js");
const listingControllers = require("../controllers/listings.js");
const multer = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({storage});

// Index Route & Create Route
router.route("/")
  .get(wrapAsync(listingControllers.index))
  .post(isLoggedin, upload.single('listing[image]'), validateListing,wrapAsync(listingControllers.createListing));

// New Route
router.get("/new", isLoggedin, listingControllers.renderNewForm);

//
router.route("/:id")
  .get(wrapAsync(listingControllers.showListing))
  .put(isLoggedin, isOwner, upload.single('listing[image]'),validateListing, wrapAsync(listingControllers.updateListing))
  .delete(isLoggedin, isOwner, wrapAsync(listingControllers.destroyListing));




// Edit Route
router.get("/:id/edit", isLoggedin, isOwner, wrapAsync(listingControllers.renderEditForm));



module.exports = router;