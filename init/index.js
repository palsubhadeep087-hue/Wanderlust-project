const mongoose = require("mongoose");
const axios = require("axios");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
main()
    .then(() => {
        console.log("Connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });
async function main() {
    await mongoose.connect(MONGO_URL);
}
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
const initDB = async () => {
    await Listing.deleteMany({});
    const listings = [];
    for (let obj of initData.data) {
        try {
            const response = await axios.get(
                "https://nominatim.openstreetmap.org/search",
                {
                    params: {
                        q: `${obj.location}, ${obj.country}`,
                        format: "json",
                        limit: 1
                    },
                    headers: {
                        "User-Agent": "Wanderlust-Student-App"
                    }
                }
            );
            if (response.data.length > 0) {
                const place = response.data[0];
                obj.geometry = {
                    type: "Point",
                    coordinates: [
                        parseFloat(place.lon),
                        parseFloat(place.lat)
                    ]
                };
                console.log(`✓ ${obj.location}`);
                listings.push({
                    ...obj,
                    owner: "6a9b868b6d777302ed516501"
                });
            } else {
                console.log(`✗ Location not found: ${obj.location}`);
            }
        } catch (err) {
            console.log(
                `✗ Geocoding failed for ${obj.location}: ${err.message}`
            );
        }
        await sleep(1000);
    }
    await Listing.insertMany(listings);
    console.log(`${listings.length} listings were initialized`);
    await mongoose.connection.close();
};

initDB();