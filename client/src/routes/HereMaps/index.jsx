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
import "./App.css";
import Button from "@material-ui/core/Button";
import { IconButton, InputAdornment } from "@material-ui/core";
import { DateTimePicker, KeyboardDateTimePicker, MuiPickersUtilsProvider, } from "@material-ui/pickers";
import DateMomentUtils from '@date-io/moment';
import { Fade } from '@material-ui/core';
import { BrowserRouter as Router, Redirect, Route, Link } from 'react-router-dom';



const H = window.H;
const apikey = process.env.REACT_APP_HERE_API_KEY;

const HereMaps = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [showPm, setShowPm] = useState(true);
  const [currentRoute, setCurrentRoute] = useState(0);
  const [singleRoute, setSingleRoute] = useState(false);
  const [afterMinutes, setAfterMinutes] = useState(0);
  const [fetching, setFetching] = useState(false);
  const mapObjects = useRef([]);

  const [places, setPlaces] = useState([]);
  const [display, setDisplay] = useState(false);
  const [display1, setDisplay1] = useState(false);
  const [bcol, setCol] = useState('#E8F4F5');
  const [tcol, setColt] = useState('#108898');

  const [bcold, setCold] = useState('rgb(255,255,255)');
  const [tcold, setColtd] = useState('#666666');

  const wrapperRef = useRef(null);
  const wrapperRef1 = useRef(null);
  const [origin, setOrigin] = useState(null);
  const [dest, setDest] = useState(null);
  const [orv, setOriginv] = useState({ lat: null, lng: null });
  const [dsv, setDestv] = useState({ lat: null, lng: null });
  var aurl = "https://autocomplete.geocoder.ls.hereapi.com/6.2/suggest.json?query=";
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

  const handleClickOutside = event => {
    const { current: wrap } = wrapperRef;
    if (wrap && !wrap.contains(event.target)) {
      setDisplay(false);
    }
  };

  const handleClickOutside1 = event => {
    const { current: wrap } = wrapperRef1;
    if (wrap && !wrap.contains(event.target)) {
      setDisplay1(false);
    }
  };

  const addMarkersToMap = useCallback((map, locations = []) => {
    if (!map) return;
    locations.forEach((location) => {
      const locationMarker = new H.map.Marker(location);
      map.addObject(locationMarker);
      mapObjects.current = [...mapObjects.current, locationMarker];
    });
  }, []);



  async function getDataApi(val) {
    const response = await fetch(aurl + val + apik + apikey);
    const data = await response.json();
    // console.log(data["suggestions"][0]["label"]);
    var ar = []
    if ("suggestions" in data) {
      for (var i = 0; i < data["suggestions"].length; i++) {
        var lp = { label: data["suggestions"][i]["label"], lid: data["suggestions"][i]["locationId"] };
        ar.push(lp);
      }
    }
    // console.log(ar);
    return ar;
  }

  async function getLattLong(location_id) {
    const response = await fetch(burl + location_id + curl + apik + apikey);
    const data = await response.json();

    // console.log(data);
    setOriginv({ lat: data["response"]["view"][0]["result"][0]["location"]["displayPosition"]["latitude"], lng: data["response"]["view"][0]["result"][0]["location"]["displayPosition"]["longitude"] });
    // addMarkersToMap(map, [{ lat: data["response"]["view"][0]["result"][0]["location"]["displayPosition"]["latitude"], lng: data["response"]["view"][0]["result"][0]["location"]["displayPosition"]["longitude"] }]);
  }

  async function getLattLongd(location_id) {
    const response = await fetch(burl + location_id + curl + apik + apikey);
    const data = await response.json();

    // console.log(data);
    setDestv({ lat: data["response"]["view"][0]["result"][0]["location"]["displayPosition"]["latitude"], lng: data["response"]["view"][0]["result"][0]["location"]["displayPosition"]["longitude"] });
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

  const updateOriginValue = val => {
    setOrigin(val.label);
    getLattLong(val.lid);
    setDisplay(false);
  };

  const updateDestValue = val => {
    setDest(val.label);
    getLattLongd(val.lid);
    setDisplay1(false);
  };

  function customo() {
    setCol('#E8F4F5');
    setColt('#108898');
    setCold('rgb(255,255,255)');
    setColtd('#666666');
  }

  function customd() {
    setCold('#E8F4F5');
    setColtd('#108898');
    setCol('rgb(255,255,255)');
    setColt('#666666');
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
      routeLine = new H.map.Polyline(linestring, {
        style: { strokeColor: color, lineWidth },
      });
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
    setFetching(true);
    const origin = orv;
    if (origin.lat == null || origin.lng == null)
      return;
    const dest = dsv;
    if (dest.lat == null || dest.lng == null)
      return;
    if (selectedDate == null)
      return;
    let departureTime = selectedDate;
    // departureTime.setMinutes(departureTime.getMinutes() + afterMinutes);
    // console.log(departureTime)
    const url = `${BASE_URL}/gettraveldata/origin=${origin.lat},${origin.lng
      }&dest=${dest.lat},${dest.lng
      }&departureTime=${departureTime.toISOString()}`;

    clearMap();
    addMarkersToMap(map, [origin, dest]); // plot origin and destination on map
    fetch(url)
      .then((res) => res.json())
      .then((routes) => {
        setRoutes(routes);
        setFetching(false);
        setSingleRoute(false);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(fetchAndAddRoutes, [map, addMarkersToMap, afterMinutes, orv, dsv, selectedDate, clearMap]);
  useEffect(updateMap, [routes, map, showPm, singleRoute, orv, dsv, clearMap]);
  useEffect(showSingleRoute, [
    routes,
    map,
    showPm,
    singleRoute,
    currentRoute,
    orv, dsv,
    clearMap,
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
    window.addEventListener("resize", map.getViewPort().resize);
    const behavior = new window.H.mapevents.Behavior(
      new window.H.mapevents.MapEvents(map)
    );

    // console.log(behavior);
    return () => {
      window.removeEventListener("resize", map.getViewPort().resize);
    };
  }, []);

  return (
    <>
      <div className="page-header">
        {/* <div>{inval}</div> */}
        <div id="appbar">
          <div ref={wrapperRef}>
            <div class="input">
              <div class="origin">
                <Link to="/"><i class="material-icons icon">&#xe5c4;</i></Link>
                <div class="input5">
                  <i class="material-icons icon1">&#xe55c;</i>
                  <input id="input1" autocomplete="off"
                    type="text"
                    onClick={() => setDisplay(!display)}
                    placeholder="Choose Starting point"
                    value={origin}
                    onChange={getData}
                  />
                </div>
              </div>

              {display && (
                <div className="autoContainer">
                  {places.map((value, i) => {
                    return (
                      <div
                        className="option"
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

          <div class="clearfix"></div>

          <div ref={wrapperRef1}>
            <div class="input">
              <div class="input6">
                <i class="material-icons icon1">&#xe568;</i>
                <input id="input2" autocomplete="off"
                  type="text"
                  onClick={() => setDisplay1(true)}
                  placeholder="Choose Destination"
                  value={dest}
                  onChange={getDataD}
                />
              </div>
            </div>
            {display1 && (
              <div className="autoContainer">
                {places.map((value, i) => {
                  return (
                    <div
                      className="option"
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

          <div class="clearfix"></div>

          <div id="bottom3">
            <Button id="PMV"
              style={{ textTransform: 'none', backgroundColor: bcol, color: tcol, }}
              onClick={() => {
                return setShowPm(() => {
                  customo();
                  return true;
                });
              }}
            >
              PM 2.5
          </Button>

            <Button id="CV"
              style={{ textTransform: 'none', backgroundColor: bcold, color: tcold, }}
              // color={col1}
              onClick={() => {
                customd();
                return setShowPm(() => {
                  return false;
                });
              }}
            >
              Congestion
          </Button>

            {/* <br /> */}

            {/* <br /> */}
            <div id="timemenu">
              <MuiPickersUtilsProvider utils={DateMomentUtils}>
                <KeyboardDateTimePicker id="pickdateandtime"
                  value={null}
                  onChange={handleDateChange}
                  label=""
                  inputVariant="standard"
                  onError={console.log}
                  ampm={false}
                  minDate={new Date()}
                  format="yyyy/MM/DD HH:mm"
                />
              </MuiPickersUtilsProvider>
            </div>

            <div class="clearfix"></div>
          </div>

          <div class="clearfix"></div>
        </div>

        <div id="demo-map" ref={mapRef} className={styles.hereMaps}></div>

        <div id="bottombar">
          <i class='fas prevb'
            onClick={() => {
              setInv(((inval - 1) % 7 + 7) % 7);
              setRdisplay(true);
            }
            }
          >&#xf137;</i>
          <div id="bottombart">
            <span id="bshow">
              {routes ? (
                <>
                  {inval == 0 ? "Showing all routes" : `Showing Route ${inval}`}
                </>
              ) : "No Routes available"}
            </span>

            <br />

            <span id="bshow6">
              {routes ? "6 Routes available" : null}
            </span>
          </div>
          <i class='fas nextb'
            onClick={() => {
              setInv((inval + 1) % 7);
              setRdisplay(true);
            }

            }
          >&#xf138;</i>

          {routes ? (
            <>
              {
                rdisplay ? (
                  <>
                    {inval == 0 ?
                      < div >
                        {setSingleRoute(false)}
                      </div>
                      : <div>
                        {setSingleRoute(true), setCurrentRoute(inval - 1)}
                      </div>
                    }
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
