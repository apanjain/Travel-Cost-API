import React, { useEffect, useRef } from 'react';
import L from './js/leaflet-custom';
import { Map, TileLayer } from 'react-leaflet';
import "./App.css";
import 'leaflet/dist/leaflet.css';
import 'esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css';
import "leaflet-geosearch/dist/geosearch.css";
import "leaflet-geosearch/assets/css/leaflet.css";
import Search from "./search.js"
import 'leaflet-searchbox/dist/style.css'
import { Link } from 'react-router-dom';
//import "leaflet.idw/src/leaflet-idw";
import Vector from "../../assets/images/Vector.png";
import iconRetinaUrl from "assets/images/marker-icon-2x.png";
import iconUrl from '../../assets/images/marker-icon.png';
import shadowUrl from '../../assets/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;


L.Icon.Default.mergeOptions({
    iconRetinaUrl, iconUrl, shadowUrl
});


const token = process.env.REACT_APP_WAQI_API_KEY;
var lat1 = 28.086520, lat2 = 28.921631, long1 = 76.730347, long2 = 77.631226;
const url = `https://api.waqi.info/map/bounds/?latlng=${lat1},${long1},${lat2},${long2}&token=${token}`

let userData

let aqiGradient = {
    0: "#69B34C",
    50: "green",
    100: "yellow",
    150: '#FFD700',
    200: "orange",
    250: '#FF8C00',
    300: "red",
    400: "brown",
    1000: "black"
};

let aqigrad = {
    0: "#69B34C",
    50: "green",
    100: "yellow",
    200: "orange",
    300: "red",
    400: "brown",
}

let IDWOptions = {
    // opacity  - the opacity of the IDW layer
    // cellSize - height and width of each cell, 25 by default
    // exp      - exponent used for weighting, 1 by default
    // max      - maximum point values, 1.0 by default
    // gradient - color gradient config, e.g. {0.4: 'blue', 0.65: 'lime', 1: 'red'}
    opacity: 0.4,
    position: "bottomleft",
    // maxZoom: 10,
    // minZoom: 10,
    cellSize: 1,
    //exp: 5,
    gradient: aqiGradient,
    // dataType: 2,
    // station_range: 10,
    minVal: 0.0,
    maxVal: 1000.0,
    unit: ""
};

const Home = () => {
    const mapRef = useRef();
    let rows = [];

    const fetchdata = async () => {
        const response = await fetch(url);
        const data = await response.json();
        userData = data.data;

    }

    function getColor(mag) {
        if (mag >= 0 && mag < 51) {
            return "#69B34C";
        }
        else if (mag > 50 && mag < 101) {
            return "green";
        }
        else if (mag > 100 && mag < 151) {
            return "yellow";
        }
        else if (mag > 150 && mag < 201) {
            return "#FFD700";
        }
        else if (mag > 200 && mag < 251) {
            return "orange";
        }
        else if (mag > 250 && mag < 301) {
            return '#FF8C00';
        }
        else if (mag > 300 && mag < 401) {
            return 'red';
        }
        else if (mag > 400 && mag < 501) {
            return "#FF2626";
        }
        else if (mag > 500 && mag < 601) {
            return "#DD0000";
        }
        else {
            return "brown";
        }
    };

    useEffect(() => {
        const { current = {} } = mapRef;
        const { leafletElement: map } = current;

        fetchdata().then(() => {
            for (let i in userData) {
                if (!isNaN(userData[i].aqi)) {
                    rows.push([userData[i].lat, userData[i].lon, parseInt(userData[i].aqi)]);
                }
            }

            if (!map) return;
            L.idwLayer(rows, {
                opacity: 0.4,
                // maxZoom: 18,
                cellSize: 12,
                exp: 2,
                max: 1000,
                maxVal: 1000,
                minVal: 0,
                station_range: 10,
                gradient: aqiGradient,
            }).addTo(map);

            L.control.displaymap({
                position: "topright",
            }).addTo(map);

            var btn = document.querySelector('#map1')
            var y = 0;
            var mouseOver = false;
            let idwMarkers = [];
            btn.addEventListener('click', () => {
                map.on('singleclick', function (evt) {
                    if (mouseOver) { return }
                }
                )
                y += 1;
                if (y % 2 !== 0) {

                    for (let j in rows) {
                        idwMarkers[j] = L.idwMarker([parseFloat(rows[j][0]), parseFloat(rows[j][1])], {
                            fillColor: getColor(parseFloat(rows[j][2])),
                            Color: getColor(parseFloat(rows[j][2])),
                            fillOpacity: 1,
                            weight: 0,
                        }).addTo(map)
                        //console.log(rows[j][0]);
                    };

                }

                else {

                    y = 0;

                    for (let j in rows) {
                        idwMarkers[j].remove();
                    }
                }

            })
            L.control.zoom({
                position: "bottomleft",
            }).addTo(map);

            let idwMarker = undefined;
            let idwDisplay = undefined;
            map.on('click',
                function mapClickListen(event) {
                    let pos = event.latlng;
                    if (idwMarker) {
                        idwDisplay.remove();
                        idwMarker.setLatLng(pos);
                    } else {
                        idwMarker = new L.idwMarker(
                            pos, {
                            ranges: [1000],
                            //dataOptions: [[2, 0.0]],
                            p: 2,
                            radius: 5,
                            points: [rows],
                            fillOpacity: 1,
                            weight: 0,
                        }).addTo(map);
                    }
                    idwDisplay = L.control.displayIDW(idwMarker.getIDW(), {
                        position: "topleft",
                    }).addTo(map);
                    // close button functio

                    document.getElementById("idw-display-close-button").onclick = function (event) {
                        // avoid click on the map again
                        map.off('click', mapClickListen);
                        idwMarker.remove();
                        idwDisplay.remove();
                        idwMarker = undefined;
                        idwDisplay = undefined;
                        // turn on the map click function
                        setTimeout(() => {
                            map.on('click', mapClickListen);
                        }, 100);
                    };
                });

        })

        // console.log(rows);
        L.control.IDWLegend(aqigrad, IDWOptions).addTo(map);

    }, [rows])

    //console.log(rows);

    return (
        <div className="App">
            <Map ref={mapRef} center={[28.6139, 77.2090]} zoom={10} zoomControl={false} >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; <a href=&quot;https://www.openstreetmap.org/copyright&quot;>OpenStreetMap</a> contributors" />
                <Search />
            </Map>
            <div id="navigation">
                <div id="icon1"><Link to="/map"><img src={Vector} alt="direction"></img></Link>
                </div>
                <div><Link to="/map"><p id="text1">Directions</p></Link></div>
            </div>

        </div>
    );
}

export default Home;