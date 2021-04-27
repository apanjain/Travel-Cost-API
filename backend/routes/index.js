const express = require("express");
const router = express.Router();
const getTravelData = require("../views/travelData");
const pollutionViews = require("../views/pollution");

router.get("/aqi/:id/", pollutionViews.getPollutionData);

router.get("/gettraveldata/:query", getTravelData);

module.exports = router;
