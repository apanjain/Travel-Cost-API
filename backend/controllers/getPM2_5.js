const { default: axios } = require("axios");
const getColorForPercentage = require("../utils/getColorForPercentage");

let database = [];

exports.updateDatabase = async () => {
  let newData = [];

  const getData = async () => {
    let lat1 = 28.08652,
      lat2 = 28.921631,
      long1 = 76.730347,
      long2 = 77.631226;
    const api_url = `https://api.waqi.info/map/bounds/?latlng=${lat1},${long1},${lat2},${long2}&token=${process.env.waqi_api_key}`;
    await axios
      .get(api_url)
      .then((res) => {
        const arr = res && res.data ? res.data.data : null;
        if (arr && arr.length > 0) {
          for (let i in arr) {
            if (!isNaN(arr[i].aqi)) {
              newData = [
                ...newData,
                {
                  latitude: arr[i].lat,
                  longitude: arr[i].lon,
                  pm: parseInt(arr[i].aqi),
                },
              ];
            }
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };
  await getData();
  database = newData;
  console.log("Updated Database!");
  // console.log(database);
};

exports.getPM2_5 = (lat, lng, currentDatabase) => {
  const x1 = lat;
  const y1 = lng;

  let top = 0;
  let bot = 0;

  function distance(lat1, lon1, lat2, lon2) {
    const p = 0.017453292519943295; // Math.PI / 180
    const c = Math.cos;
    const a =
      0.5 -
      c((lat2 - lat1) * p) / 2 +
      (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
  }
  for (let i = 0; i < currentDatabase.length; i++) {
    const x2 = currentDatabase[i].latitude;
    const y2 = currentDatabase[i].longitude;

    dist = distance(x1, y1, x2, y2);

    top += currentDatabase[i].pm / Math.pow(dist, 2);
    bot += 1 / Math.pow(dist, 2);
  }
  let pm2_5;
  if (bot == 0) {
    pm2_5 = top;
  } else {
    pm2_5 = top / bot;
  }

  return pm2_5;
};

exports.getPMColor = (routes = [], minPm, maxPm) => {
  let colorizedPmRoutes = [];
  // console.log(minPm, maxPm);
  routes.forEach((route) => {
    colorizedPmRoutes = [
      ...colorizedPmRoutes,
      {
        ...route,
        sections:
          route.sections && route.sections.length > 0
            ? route.sections.map((section) => {
                const normalizedPm =
                  maxPm > minPm
                    ? (section.travelSummary.pmValue - minPm) / (maxPm - minPm)
                    : -1;
                return {
                  ...section,
                  travelSummary: {
                    ...section.travelSummary,
                    normalizedPm,
                    pmColor: getColorForPercentage(normalizedPm),
                  },
                };
              })
            : [],
      },
    ];
  });
  // console.log(colorizedPmRoutes)
  return colorizedPmRoutes;
};

exports.calculatePmValuesList = async (locationsList) => {
  const currentDatabase = [...database]; // use contant value for a particular calculation as database is updated every 10 seconds
  const promises = locationsList.map((location) => {
    return new Promise((resolve, reject) =>
      resolve(this.getPM2_5(location.lat, location.lng, currentDatabase))
    );
  });
  try {
    const responses = await Promise.all(promises);
    return responses;
  } catch (err) {
    console.log(err);
  }
};
