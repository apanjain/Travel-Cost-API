const axios = require("axios");
const querystring = require("querystring");
const calculateCongestion = require("../controllers/getCongestion");
const {
  getPMColor,
  calculatePmValuesList,
} = require("../controllers/getPM2_5");
const API_URL = "https://intermodal.router.hereapi.com/v8/routes";

function getTravelData(req, res) {
  const queryStr = req && req.params ? req.params.query : null;
  const queryObj = queryStr ? querystring.parse(queryStr) : null;
  const origin = queryObj && queryObj.origin ? queryObj.origin : null;
  const dest = queryObj && queryObj.dest ? queryObj.dest : null;
  const departureTime =
    queryObj && queryObj.departureTime
      ? new Date(queryObj.departureTime)
      : new Date();
  const modes = queryObj && queryObj.modes ? queryObj.modes.split(",") : null;
  // validate data
  if (!origin || !dest) {
    const validate = [!origin, !dest];
    res
      .status(400)
      .json(
        ["Select a valid origin", "Select a valid destination"].filter(
          (val, index) => validate[index]
        )
      );
  }
  let intermodalApiCall = axios.get(API_URL, {
    params: {
      apiKey: process.env.here_api_key,
      alternatives: 10,
      destination: dest,
      origin: origin,
      return: "polyline,travelSummary",
      "transit[modes]": "-subway,-lightRail,-highSpeedTrain,-cityTrain", // remove undesirable transports
      departureTime: departureTime,
    },
  });
  intermodalApiCall
    .then(async (response) => {
      const routes =
        response.data && response.data.routes ? [...response.data.routes] : [];
      let result = [];
      let minPm = 1000;
      let maxPm = 0;
      for (var i = 0; i < routes.length; i++) {
        try {
          const updatedRoute = await fetchCongestionAndPM(
            routes[i],
            maxPm,
            minPm,
            departureTime
          );
          result = [...result, updatedRoute.route];
          (maxPm = updatedRoute.maxPm), (minPm = updatedRoute.minPm);
        } catch (err) {
          console.log(err);
        }
      }
      try {
        const pmResult = getPMColor(result, minPm, maxPm);
        const summary = {
          routesCount: pmResult.length,
          minPm,
          maxPm,
        };
        res.json({ routes: pmResult, summary }).status(200);
      } catch (err) {
        console.log(err);
        res.json({ msg: "Error in processing data" }).status(400);
      }
    })
    .catch((error) => {
      if (error.response) {
        if (error.response.status == 400) {
          res.json({ msg: error.response.title }).status(400);
        } else if (error.response.status == 401) {
          res
            .json({ msg: "error while authorisation to the HERE map server" })
            .status(401);
        } else {
          res
            .json({
              msg: "Unknown error occured while fetching the data from server",
            })
            .status(error.response.status);
        }
      } else if (error.request) {
        res
          .json({ msg: "The request was made but no response was received" })
          .status(500);
      } else {
        res.json({ msg: "Internal server error" }).status(500);
      }
    });
}
async function fetchCongestionAndPM(route, maxPm, minPm, departureTime) {
  const midPointLocations =
    route && route.sections
      ? route.sections.map((section) => {
          return {
            lat:
              (section.departure.place.location.lat +
                section.arrival.place.location.lat) /
              2,
            lng:
              (section.departure.place.location.lng +
                section.arrival.place.location.lng) /
              2,
          };
        })
      : [];
  const startAndEndLocations =
    route && route.sections
      ? route.sections.map((section) => {
          return {
            departure: {
              lat: section.departure.place.location.lat,
              lng: section.departure.place.location.lng,
            },
            arrival: {
              lat: section.arrival.place.location.lat,
              lng: section.arrival.place.location.lng,
            },
            isPedestrian: section.transport.mode === "pedestrian",
          };
        })
      : [];
  try {
    const pmValues = await calculatePmValuesList(midPointLocations);
    const congestionData = await calculateCongestion(
      startAndEndLocations,
      departureTime
    );
    minPm = Math.min(...pmValues);
    maxPm = Math.max(...pmValues);
    const updatedRoute = {
      ...route,
      sections:
        route && route.sections
          ? route.sections.map((section, i) => {
              return {
                ...section,
                travelSummary: {
                  ...section.travelSummary,
                  pmValue: pmValues[i],
                  ...congestionData[i],
                },
              };
            })
          : [],
    };
    // console.log(updatedRoute);
    return { route: updatedRoute, maxPm, minPm };
  } catch (err) {
    console.log(err);
  }
}

module.exports = getTravelData;
