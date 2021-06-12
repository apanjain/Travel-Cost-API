const axios = require("axios");
const API_URL = "https://route.ls.hereapi.com/routing/7.2/calculateroute.json";

async function calculateCongestion(locationsList, departureTime) {
  const promises = locationsList.map((location) => {
    return axios.get(API_URL, {
      params: {
        waypoint0: `${location.departure.lat},${location.departure.lng}`,
        waypoint1: `${location.arrival.lat},${location.arrival.lng}`,
        mode: "fastest;car;traffic:enabled",
        apiKey: process.env.here_api_key,
        departure: departureTime,
      },
    });
  });
  try {
    const responses = await Promise.all(promises);
    const congestionData = responses.map((response, index) => {
      const { baseTime, travelTime } = response.data.response.route[0].summary;
      const congestionValue = travelTime / baseTime;
      return {
        congestionValue,
        congestionColor: locationsList[index].isPedestrian
          ? "green"
          : getCongestionColor(congestionValue),
      };
    });
    return congestionData;
  } catch (err) {
    console.log(err);
  }
}

function getCongestionColor(congestionValue) {
  if (congestionValue < 1.25) return "green";
  else if (congestionValue >= 1.25 && congestionValue < 1.5) return "blue";
  else if (congestionValue >= 1.5 && congestionValue < 2) return "orange";
  else if (congestionValue >= 2) return "red";
}
module.exports = calculateCongestion;
