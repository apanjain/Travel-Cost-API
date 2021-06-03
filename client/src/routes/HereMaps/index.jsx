import { BASE_URL } from "helpers/config";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import styles from "./HereMaps.module.scss";
import LOCATIONS from "./locations";
import Button from "@material-ui/core/Button";
import {
  KeyboardDateTimePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import DateMomentUtils from "@date-io/moment";
// import { Link } from 'react-router-dom';
// import * as FaIcons from 'react-icons/fa';
// import * as AiIcons from 'react-icons/ai';
import SideBar from "./Sidebar";

const H = window.H;
const apikey = process.env.REACT_APP_HERE_API_KEY;

const HereMaps = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [showPm, setShowPm] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(0);
  const [singleRoute, setSingleRoute] = useState(false);
  const [totalroutes, setTotalRoutes] = useState(1);
  // const [afterMinutes, setAfterMinutes] = useState(0);
  const [fetching, setFetching] = useState(false);
  const mapObjects = useRef([]);

  const [places, setPlaces] = useState([]);
  const [display, setDisplay] = useState(false);
  const [display1, setDisplay1] = useState(false);
  var bcol = "#E8F4F5";
  var tcol = "#108898";

  var bcold = "rgb(255,255,255)";
  var tcold = "#666666";

  const wrapperRef = useRef(null);
  const wrapperRef1 = useRef(null);
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [orv, setOriginv] = useState({ lat: null, lng: null });
  const [dsv, setDestv] = useState({ lat: null, lng: null });
  var aurl =
    "https://autocomplete.geocoder.ls.hereapi.com/6.2/suggest.json?query=";
  var burl = "https://geocoder.ls.hereapi.com/6.2/geocode.json?locationid=";
  var curl = "&jsonattributes=1&gen=9";
  var apik = "&apiKey=";

  const [selectedDate, handleDateChange] = useState(null);

  const [inval, setInv] = useState(0);
  const [rdisplay, setRdisplay] = useState(true);

  useEffect(() => {
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  });

  useEffect(() => {
    window.addEventListener("mousedown", handleClickOutside1);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside1);
    };
  });

  const handleClickOutside = (event) => {
    const { current: wrap } = wrapperRef;
    if (wrap && !wrap.contains(event.target)) {
      setDisplay(false);
    }
  };

  const handleClickOutside1 = (event) => {
    const { current: wrap } = wrapperRef1;
    if (wrap && !wrap.contains(event.target)) {
      setDisplay1(false);
    }
  };

  const addMarkersToMap = useCallback((map, locations = []) => {
    if (!map) return;
    var group = new H.map.Group();
    locations.forEach((location) => {
      const locationMarker = new H.map.Marker(location);
      group.addObject(locationMarker);
      // map.addObject(locationMarker);
      // mapObjects.current = [...mapObjects.current, locationMarker];
    });

    mapObjects.current = [...mapObjects.current, group];
    map.addObject(group);
    map.getViewModel().setLookAtData({
      bounds: group.getBoundingBox(),
    });
  }, []);

  async function getDataApi(val) {
    const response = await fetch(aurl + val + apik + apikey);
    const data = await response.json();
    // console.log(data["suggestions"][0]["label"]);
    var ar = [];
    if ("suggestions" in data) {
      for (var i = 0; i < data["suggestions"].length; i++) {
        var lp = {
          label: data["suggestions"][i]["label"],
          lid: data["suggestions"][i]["locationId"],
        };
        ar.push(lp);
      }
    }
    // console.log(ar);
    return ar;
  }

  async function getLattLong(location_id) {
    const response = await fetch(burl + location_id + curl + apik + apikey);
    const data = await response.json();
    setInv(0);
    // console.log(data);
    setOriginv({
      lat: data["response"]["view"][0]["result"][0]["location"][
        "displayPosition"
      ]["latitude"],
      lng: data["response"]["view"][0]["result"][0]["location"][
        "displayPosition"
      ]["longitude"],
    });
    // addMarkersToMap(map, [{ lat: data["response"]["view"][0]["result"][0]["location"]["displayPosition"]["latitude"], lng: data["response"]["view"][0]["result"][0]["location"]["displayPosition"]["longitude"] }]);
  }

  async function getLattLongd(location_id) {
    const response = await fetch(burl + location_id + curl + apik + apikey);
    const data = await response.json();
    setInv(0);
    // console.log(data);
    setDestv({
      lat: data["response"]["view"][0]["result"][0]["location"][
        "displayPosition"
      ]["latitude"],
      lng: data["response"]["view"][0]["result"][0]["location"][
        "displayPosition"
      ]["longitude"],
    });
    // addMarkersToMap(map, [{ lat: data["response"]["view"][0]["result"][0]["location"]["displayPosition"]["latitude"], lng: data["response"]["view"][0]["result"][0]["location"]["displayPosition"]["longitude"] }]);
  }

  async function getData(event) {
    setOrigin(event.target.value);
    var res = await getDataApi(event.target.value);
    setPlaces(res);
    // console.log(res);
  }

  async function getDataD(event) {
    setDest(event.target.value);
    var res = await getDataApi(event.target.value);
    setPlaces(res);
    // console.log(res);
  }

  const updateOriginValue = (val) => {
    setOrigin(val.label);
    getLattLong(val.lid);
    setDisplay(false);
  };

  const updateDestValue = (val) => {
    setDest(val.label);
    getLattLongd(val.lid);
    setDisplay1(false);
  };

  function setindexval(inc) {
    if (routes.length !== 0) {
      if (inc === false)
        setInv((((inval - 1) % totalroutes) + totalroutes) % totalroutes);
      else setInv((inval + 1) % totalroutes);
    }
  }

  const addPolylineToMap = (
    map,
    linestring,
    lineWidth = 1,
    color = "#ff00ff",
    arrow = false
  ) => {
    let routeLine;
    if (arrow) {
      const routeOutline = new H.map.Polyline(linestring, {
        style: {
          lineWidth,
          strokeColor: color,
          lineTailCap: "arrow-tail",
          lineHeadCap: "arrow-head",
        },
      });
      const routeArrows = new H.map.Polyline(linestring, {
        style: {
          lineWidth,
          fillColor: "white",
          strokeColor: "rgba(255, 255, 255, 1)",
          lineDash: [0, 2],
          lineTailCap: "arrow-tail",
          lineHeadCap: "arrow-head",
        },
      });
      routeLine = new H.map.Group();
      routeLine.addObjects([routeOutline, routeArrows]);
    } else {
      const routeLine1 = new H.map.Polyline(linestring, {
        style: { strokeColor: color, lineWidth },
      });
      routeLine = new H.map.Group();
      routeLine.addObjects([routeLine1]);
    }
    mapObjects.current = [...mapObjects.current, routeLine];
    map.addObjects([routeLine]);
  };

  const clearMap = useCallback(() => {
    const filteredValues = mapObjects.current.filter((value) =>
      map.getObjects().includes(value)
    );
    // console.log(filteredValues);
    map.removeObjects(filteredValues);
    mapObjects.current = [];
  }, [map]);

  const showSingleRoute = () => {
    if (!map || !singleRoute) return;
    if (routes.length === 0) return;
    clearMap();
    addMarkersToMap(map, [orv, dsv]);

    routes[currentRoute].forEach((section) => {
      let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);
      addPolylineToMap(
        map,
        linestring,
        10,
        showPm ? section.pmColor : section.congestionColor,
        !showPm
      );
    });
  };

  const updateMap = () => {
    if (!routes || !map) return;
    if (routes.length === 0) return;
    clearMap();
    addMarkersToMap(map, [orv, dsv]);

    routes.forEach((route) => {
      route.forEach((section) => {
        let linestring = H.geo.LineString.fromFlexiblePolyline(
          section.polyline
        );
        addPolylineToMap(
          map,
          linestring,
          10,
          showPm ? section.pmColor : section.congestionColor,
          !showPm
        );
      });
    });
  };

  const fetchAndAddRoutes = () => {
    if (!map) return;
    // setFetching(true);
    const origin = orv;
    if (origin.lat == null || origin.lng == null) return;
    const dest = dsv;
    if (dest.lat == null || dest.lng == null) return;
    if (selectedDate == null) return;
    let departureTime = selectedDate;
    // departureTime.setMinutes(departureTime.getMinutes() + afterMinutes);
    // console.log(departureTime)
    setRoutes([]);
    setFetching(true);
    setShowPm(false);
    clearMap();
    const url = `${BASE_URL}/gettraveldata/origin=${origin.lat},${
      origin.lng
    }&dest=${dest.lat},${
      dest.lng
    }&departureTime=${departureTime.toISOString()}`;

    addMarkersToMap(map, [origin, dest]); // plot origin and destination on map
    fetch(url)
      .then((res) => res.json())
      .then((routes) => {
        setRoutes(routes);
        setTotalRoutes(routes.length + 1);
        setFetching(false);
        setSingleRoute(false);
      })
      .catch((err) => {
        console.log(err);
        setFetching(false);
      });
    // setFetching(false);
  };

  // useEffect(fetchAndAddRoutes, [map, addMarkersToMap, orv, dsv, selectedDate, clearMap]);

  useEffect(updateMap, [
    routes,
    map,
    addMarkersToMap,
    showPm,
    singleRoute,
    clearMap,
    dsv,
    orv,
  ]);
  useEffect(showSingleRoute, [
    routes,
    map,
    showPm,
    singleRoute,
    currentRoute,
    addMarkersToMap,
    clearMap,
    dsv,
    orv,
  ]);
  useLayoutEffect(() => {
    if (!mapRef.current) return;

    const platform = new H.service.Platform({
      apikey: apikey,
    });
    const defaultLayers = platform.createDefaultLayers();
    const map = new H.Map(mapRef.current, defaultLayers.vector.normal.map, {
      center: LOCATIONS.botanicalGarden,
      zoom: 12,
      pixelRatio: window.devicePixelRatio || 1,
    });
    setMap(map);
    // initialize map behavior
    new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));
    // create default ui
    H.ui.UI.createDefault(map, defaultLayers);
    window.addEventListener("resize", () => map.getViewPort().resize());

    // var logContainer = document.createElement('button');
    // logContainer.className = `${styles.log}`;
    // logContainer.innerHTML = 'Legends';
    // map.getElement().appendChild(logContainer);

    return () => {
      window.removeEventListener("resize", () => map.getViewPort().resize());
    };
  }, []);

  return (
    <>
      <div className="page-header">
        <div id={styles.appbar}>
          <div ref={wrapperRef}>
            <div className={styles.input}>
              <div className={styles.origin}>
                {/* <Link to="#" id={styles.icon}><FaIcons.FaBars
                  onClick={showSidebar}/></Link> */}
                <SideBar routes={routes} />
                <div className={styles.input5}>
                  <i className={`material-icons ${styles.icon1}`}>&#xe55c;</i>
                  <input
                    id={styles.input1}
                    autoComplete="off"
                    type="text"
                    onClick={() => setDisplay(!display)}
                    placeholder="Choose Starting point"
                    value={origin}
                    onChange={getData}
                  />
                </div>
              </div>

              {display && (
                <div className={styles.autoContainer}>
                  {places.map((value, i) => {
                    return (
                      <div
                        className={styles.option}
                        onClick={() => updateOriginValue(value)}
                        key={i}
                        tabIndex="0"
                      >
                        {value.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={styles.clearfix}></div>

          <div ref={wrapperRef1}>
            <div className={styles.input}>
              <div className={styles.input6}>
                <i className={`material-icons ${styles.icon1}`}>&#xe568;</i>
                <input
                  id={styles.input2}
                  autoComplete="off"
                  type="text"
                  onClick={() => setDisplay1(true)}
                  placeholder="Choose Destination"
                  value={dest}
                  onChange={getDataD}
                />
              </div>
            </div>
            {display1 && (
              <div className={styles.autoContainer}>
                {places.map((value, i) => {
                  return (
                    <div
                      className={styles.option}
                      onClick={() => updateDestValue(value)}
                      key={i}
                      tabIndex="0"
                    >
                      <span>{value.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.clearfix}></div>

          <div id={styles.bottom3}>
            <Button
              id={styles.CMV}
              style={{
                textTransform: "none",
                backgroundColor: !showPm ? bcol : bcold,
                color: !showPm ? tcol : tcold,
              }}
              onClick={() => {
                return setShowPm(() => {
                  return false;
                });
              }}
            >
              Congestion
            </Button>

            <Button
              id={styles.PMV}
              style={{
                textTransform: "none",
                backgroundColor: !showPm ? bcold : bcol,
                color: !showPm ? tcold : tcol,
              }}
              // color={col1}
              onClick={() => {
                return setShowPm(() => {
                  return true;
                });
              }}
            >
              PM 2.5
            </Button>

            {/* <br /> */}

            {/* <br /> */}
            <div id={styles.timemenu}>
              <MuiPickersUtilsProvider utils={DateMomentUtils}>
                <KeyboardDateTimePicker
                  id={styles.pickdateandtime}
                  value={null}
                  onChange={handleDateChange}
                  label=""
                  InputProps={{
                    disableUnderline: true,
                  }}
                  inputVariant="standard"
                  onError={console.log}
                  ampm={false}
                  minDate={new Date()}
                  format="yyyy/MM/DD HH:mm"
                />
              </MuiPickersUtilsProvider>
              <button
                className={styles.go}
                onClick={() => {
                  setInv(0);
                  fetchAndAddRoutes();
                  // updateMap();
                  // showSingleRoute();
                }}
              >
                Go
              </button>
            </div>

            <div className={styles.clearfix}></div>
          </div>

          <div className={styles.clearfix}></div>
        </div>

        <div id="demo-map" ref={mapRef} className={styles.hereMaps}></div>

        <div id={styles.bottombar}>
          <i
            className={`fas ${styles.prevb}`}
            onClick={() => {
              setindexval(false);
              setRdisplay(true);
            }}
          >
            &#xf137;
          </i>
          <div id={styles.bottombart}>
            <span id={styles.bshow}>
              {fetching ? (
                <>{"Fetching Routes..."}</>
              ) : (
                <>
                  {routes ? (
                    <>
                      {inval === 0
                        ? "Showing all routes"
                        : `Showing Route ${inval}`}
                    </>
                  ) : (
                    "No Routes available"
                  )}
                </>
              )}
            </span>

            <br />

            <span id={styles.bshow6}>
              {routes && !fetching
                ? `${totalroutes - 1} Routes available`
                : null}
            </span>
          </div>
          <i
            className={`fas ${styles.nextb}`}
            onClick={() => {
              setindexval(true);
              setRdisplay(true);
            }}
          >
            &#xf138;
          </i>

          {totalroutes !== 1 ? (
            <>
              {rdisplay ? (
                <>
                  {inval === 0 ? (
                    <>{setSingleRoute(false)}</>
                  ) : (
                    <>
                      {setSingleRoute(true)}
                      {setCurrentRoute(inval - 1)}
                    </>
                  )}
                  {setRdisplay(false)}
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default HereMaps;
