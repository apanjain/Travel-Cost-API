const axios = require("axios");
const querystring = require("querystring");
const moment = require("moment");
const API_URL = "https://intermodal.router.hereapi.com/v8/routes";

function getTravelData(req, res) {
  let queryStr = req.params.query;
  let queryObj = querystring.parse(queryStr);
  let origin = queryObj.origin;
  let dest = queryObj.dest;

  let p = axios.get(API_URL, {
    params: {
      apiKey: process.env.api_key,
      alternatives: 10,
      destination: dest,
      origin: origin,
      return: "polyline"
    },
  });
  p.then((response) => {
    let result = [];
    for (var i = 0; i < response.data.routes.length; i++) {
      result = [...result, formatData(response.data.routes[i])];
    }
    res.json(result).status(200);
  }).catch((error) => {
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
const getColor = (time) => {
  if(time <= 15*60) return "green";
  else if(time <= 30*60) return "blue";
  else if(time <= 45*60) return "orange";
  else if(time <= 60*60) return "brown";
  else return "red";
}
function formatData(route) {
  const routeData = route.sections.map((section)=>{
    let travelTime = moment
    .duration(
      moment(section.arrival.time, "YYYY/MM/DD HH:mm").diff(
        moment(section.departure.time, "YYYY/MM/DD HH:mm")
      )
    )
    .asSeconds();
    return {
      travelTime,
      color : getColor(travelTime),
      begin: section.departure.place.location,
      end: section.arrival.place.location,
      transport: section.transport,
      polyline: section.polyline
    }
  })
  return routeData;
}

module.exports = getTravelData;
