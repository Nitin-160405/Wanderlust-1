const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");

const getMapToken = () => process.env.MAP_TOKEN || process.env.MAP_TPKEN;

async function getCoordinates(location, country) {
    const mapToken = getMapToken();

    if (!mapToken || !location) {
        return null;
    }

    const searchText = [location, country].filter(Boolean).join(", ");
    const encodedSearchText = encodeURIComponent(searchText);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedSearchText}.json?access_token=${mapToken}&limit=1`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        return data.features?.[0]?.geometry || null;
    } catch (err) {
        console.log("Mapbox geocoding error:", err.message);
        return null;
    }
}

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing Not Found");
        return res.redirect("/listings");
    }

    const hasCoordinates =
        Array.isArray(listing.geometry?.coordinates) &&
        listing.geometry.coordinates.length === 2 &&
        listing.geometry.coordinates.some((coordinate) => coordinate !== 0);

    if (!hasCoordinates) {
        const geometry = await getCoordinates(listing.location, listing.country);

        if (geometry) {
            listing.geometry = geometry;
            await listing.save();
        }
    }

    res.render("listings/show.ejs", {
        listing,
        mapToken: getMapToken(),
    });
};

module.exports.createListing = async (req, res) => {
    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    const geometry = await getCoordinates(newListing.location, newListing.country);

    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    if (geometry) {
        newListing.geometry = geometry;
    }

    await newListing.save();

    req.flash("success", "New Listing Created");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing Not Found");
        return res.redirect("/listings");
    }
    let originalImageurl = listing.image.url;
    originalImageurl = originalImageurl.replace("/upload", "/upload/h_300,w_250");
    res.render("listings/edit.ejs", { listing, originalImageurl });
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const updatedListing = await Listing.findByIdAndUpdate(
        id,
        req.body.listing,
        {
            new: true,
            runValidators: true,
        }
    );
    if (!updatedListing) {
        req.flash("error", "Listing Not Found");
        return res.redirect("/listings");
    }

    const geometry = await getCoordinates(updatedListing.location, updatedListing.country);
    if (geometry) {
        updatedListing.geometry = geometry;
        await updatedListing.save();
    }

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;

        updatedListing.image = { url, filename };
        await updatedListing.save();
    }
    req.flash("success", "Listing Updated Successfully");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;

    const deletedListing = await Listing.findByIdAndDelete(id);

    if (!deletedListing) {
        throw new ExpressError(404, "Listing Not Found");
    }

    req.flash("success", "Listing Deleted Successfully");
    res.redirect("/listings");
};
