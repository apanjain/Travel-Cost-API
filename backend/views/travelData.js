const axios = require("axios");
const querystring = require("querystring");
const calculateCongestion = require("../controllers/getCongestion");
const {
  getPMColor,
  calculatePmValuesList,
} = require("../controllers/getPM2_5");
const { decode } = require("../utils/flexiblePolyline");
const API_URL = "https://router.hereapi.com/v8/routes";

function getTravelData(req, res) {
  const queryStr = req && req.params ? req.params.query : null;
  const queryObj = queryStr ? querystring.parse(queryStr) : null;
  const origin = queryObj && queryObj.origin ? queryObj.origin : null;
  const dest = queryObj && queryObj.dest ? queryObj.dest : null;
  const departureTime =
    queryObj && queryObj.departureTime
      ? queryObj.departureTime
      : new Date().toISOString();
  const transportMode =
    queryObj && queryObj.transportMode ? queryObj.transportMode : "car";
  // validate data
  if (!origin || !dest) {
    const validate = [!origin, !dest];
    res.status(400).json({
      msg: ["Select a valid origin", "Select a valid destination"].filter(
        (val, index) => validate[index]
      ),
    });
  }
  let intermodalApiCall = axios.get(API_URL, {
    params: {
      apiKey: process.env.here_api_key,
      alternatives: 6,
      destination: dest,
      origin: origin,
      return: "polyline,travelSummary",
      transportMode,
      departureTime,
      spans: "names,length",
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
            minPm
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
async function fetchCongestionAndPM(route, maxPm, minPm) {
  try {
    const congestionParams =
      route && route.sections
        ? route.sections.map((section) => {
            return {
              duration: section.travelSummary.duration,
              baseDuration: section.travelSummary.baseDuration,
            };
          })
        : [];
    const decodedPolylines =
      route && route.sections
        ? route.sections.map((section) => {
            return decode(section.polyline).polyline;
          })
        : [];
    const midPointLocations =
      route && route.sections
        ? route.sections.map((section, index) => {
            let midSpans = [];
            const spanSize = section.spans.length;
            for (let j = 0; j < spanSize - 1; j++) {
              const lat =
                decodedPolylines[index][section.spans[j].offset][0] +
                decodedPolylines[index][section.spans[j + 1].offset][0] / 2;
              const lng =
                decodedPolylines[index][section.spans[j].offset][1] +
                decodedPolylines[index][section.spans[j + 1].offset][1] / 2;
              midSpans = [...midSpans, { lat, lng }];
            }
            const lat =
              decodedPolylines[index][section.spans[spanSize - 2].offset][0] +
              decodedPolylines[index][section.spans[spanSize - 1].offset][0] /
                2;
            const lng =
              decodedPolylines[index][section.spans[spanSize - 2].offset][1] +
              decodedPolylines[index][section.spans[spanSize - 1].offset][1] /
                2;
            midSpans = [...midSpans, { lat, lng }];
            return midSpans;
          })
        : [];
    let spansList = [];
    let exposure = 0;
    for (let i = 0; i < route.sections.length; i++) {
      const section = route.sections[i];
      const pmValues = await calculatePmValuesList(midPointLocations[i]);
      minPm = Math.min(...pmValues);
      maxPm = Math.max(...pmValues);
      let spans = [];
      for (let j = 0; j < section.spans.length; j++) {
        exposure += section.spans[j].length * pmValues[j];
        spans = [
          ...spans,
          {
            ...section.spans[j],
            pmValue: pmValues[j],
          },
        ];
      }
      spansList = [...spansList, spans];
    }
    const congestionData = await calculateCongestion(congestionParams);
    const updatedRoute = {
      ...route,
      sections:
        route && route.sections
          ? route.sections.map((section, i) => {
              return {
                ...section,
                travelSummary: {
                  ...section.travelSummary,
                  ...congestionData[i],
                  exposure,
                },
                spans: spansList[i],
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
