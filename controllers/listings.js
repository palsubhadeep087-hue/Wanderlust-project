const Listing = require("../models/listing");
const axios = require("axios"); 

module.exports.index = async (req, res) => {
    const { location, category } = req.query;
    let allListings;
    if (category) {
        allListings = await Listing.find({
            category: category
        });
    } 
    else if (location) {
        allListings = await Listing.find({
            $or: [
                { location: { $regex: location, $options: "i" } },
                { country: { $regex: location, $options: "i" } }
            ]
        });
    } 
    else {
        allListings = await Listing.find({});
    }
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    // Geocoding via OpenStreetMap Nominatim
    try {
        const query = `${req.body.listing.location}, ${req.body.listing.country}`;
        const response = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: query,
                format: "json",
                limit: 1,
            },
            headers: {
                "User-Agent": "Wanderlust-App-Student",
            },
        });

        if (response.data && response.data.length > 0) {
            newListing.geometry = {
                type: "Point",
                coordinates: [
                    parseFloat(response.data[0].lon), // Longitude
                    parseFloat(response.data[0].lat), // Latitude
                ],
            };
        } else {
            newListing.geometry = {
                type: "Point",
                coordinates: [77.2090, 28.6139],
            };
        }
    } catch (err) {
        console.error("Geocoding Error:", err.message);
        newListing.geometry = {
            type: "Point",
            coordinates: [77.2090, 28.6139],
        };
    }

    await newListing.save();
    req.flash("success", "New listing created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (req.body.listing.location) {
    try {
      let response = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q: `${req.body.listing.location}, ${req.body.listing.country || ""}`,
          format: "json",
          limit: 1,
        },
        headers: { "User-Agent": "Wanderlust-Student-App" },
      });

      if (response && response.data && response.data.length > 0) {
        listing.geometry = {
          type: "Point",
          coordinates: [
            parseFloat(response.data[0].lon),
            parseFloat(response.data[0].lat),
          ],
        };
        await listing.save();
      }
    } catch (err) {
      console.error("Geocoding Update Error:", err);
    }
  }

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};