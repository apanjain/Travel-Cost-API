import L from 'leaflet';
import '../App.css';
import Places from "../../../assets/images/places.png";



L.IdwMarker = L.CircleMarker.extend({
  options: {
    range: 1000,
    // [[dataType, min]]
    dataOptions: [[2, 0.0]],
    p: 2,
    // points: [[lat, lon, value]]
  },



  getIDW: function () {
    let numberOfDataType = this.options.dataOptions.length;
    let IDWValues = [[this._latlng.lat, this._latlng.lng]];
    for (let i = 0; i < numberOfDataType; i++) {
      IDWValues.push(this._IDW(i));
    }
    return IDWValues;
  },
  _filter: function (dataOptionIndex) {
    return this.options.points[dataOptionIndex].filter(point => {
      let coordinate = new L.latLng(point[0], point[1]);
      let distance = coordinate.distanceTo(this._latlng) / 1000.0;
      return distance < this.options.ranges[dataOptionIndex];
    });
  },
  _IDW: function (dataOptionIndex) {
    let min = this.options.dataOptions[dataOptionIndex][1] || 0.0;
    let dataType = this.options.dataOptions[dataOptionIndex][0] || 2;
    let p = this.options.p;
    let cellsn = 0.0;
    let cellsd = 0.0;
    let inCell = this._filter(dataOptionIndex);
    // Inverse Distance Weighting (IDW)
    //       Σ (1 / (di ^ p)) * vi
    // V = -------------------------
    //          Σ (1 / (di ^ p))
    // Reference:
    // http://www.gitta.info/ContiSpatVar/de/html/Interpolatio_learningObject2.xhtml

    // cellsn = Σ (1 / (di ^ p)) * vi
    // cellsd = Σ (1 / (di ^ p))
    if (inCell.length === 0) return "N/A";
    for (let i = inCell.length - 1; i >= 0; i--) {
      let destCoor = new L.latLng(inCell[i][0], inCell[i][1]);
      let distance = destCoor.distanceTo(this._latlng) / 1000.0;
      // A station locates here
      if (distance === 0.0) {
        return inCell[i][dataType];
      }
      let distanceRev = 1.0 / Math.pow(distance, p);
      if (distanceRev !== Infinity) {
        if (inCell[i][dataType] >= min) {
          cellsn += distanceRev * inCell[i][dataType];
          cellsd += distanceRev;
        }
      }
    }
    return Math.round(cellsn / cellsd * 10.0) / 10.0;
  }
});
L.idwMarker = function (latlng, options) {
  return new L.IdwMarker(latlng, options);
};


L.Control.DisplayIDW = L.Control.extend({
  initialize: function (values, options) {
    this.values = values;
    L.setOptions(this, options);
  },
  onAdd: function () {
    let container = L.DomUtil.create('div', 'idw-display leaflet-control-layers1');
    container.innerHTML =
      `<div class="leaflet-control-layers-base1">
      <div class="property-card">
      <div id="aqi">${this.values[1]}<a> AQI</a></div>
            <div id="gps"><br><p>Latitude: ${Math.round(this.values[0][0] * 1000.0) / 1000.0}</p>
            <p>Longitude: ${Math.round(this.values[0][1] * 1000.0) / 1000.0}</p></div>
      </div>
      
      
        <a id="idw-display-close-button" class="leaflet-popup-close-button" >×</a>
      </div>`;
    return container;
  }
});

L.control.displayIDW = function (values, options) {
  return new L.Control.DisplayIDW(values, options);
};

//var info;

L.Control.Displaymap = L.Control.extend({

  onAdd: function () {
    let container = L.DomUtil.create('button', 'places_markers');
    container.innerHTML =
      ` <a id=map1><button id="places"><div id="icon_places"><img id="icon2" src=${Places}>
      </div>
        <div><p id="text1_places">Places</p></div>
      </button></a>`;
    return container;
  },

});
L.control.displaymap = function () {
  return new L.Control.Displaymap();
};

L.Control.IDWLegend = L.Control.extend({
  initialize: function (gradients, options) {
    this.gradients = this._transformGradient(gradients);
    this.unit = options.unit;
    L.Util.setOptions(this, options);
  },

  onAdd: function (map) {
    let container = L.DomUtil.create('div', 'idw-legend leaflet-control-layers'),
      gradesLabels = '',
      gradientsLength = this.gradients.length;
    let numLength = 0;
    for (let i = 0; i < gradientsLength; i++) {
      let length = this.gradients[i].key.toString().length;
      if (numLength < length) numLength = length;
    }
    // loop through our density intervals and 
    // generate a label with a colored square for each interval
    for (let i = 0; i < gradientsLength; i++) {
      let color = this.gradients[i].value;
      gradesLabels +=
        `<i style="background:${color};">&nbsp;&nbsp;${this._formatNumber(numLength, this.gradients[i].key)}`
        + `${(this.gradients[i + 1] ?
          `-${this._formatNumber(numLength, this.gradients[i + 1].key)}` : '+')}&nbsp;` +
        `&nbsp;&nbsp;</i>`


    }
    container.innerHTML =
      `<div class="leaflet-control-layers-base" id="grads">
       
          <p>
            ${gradesLabels}
            </p>
          
        
      </div>`;

    return container;
  },
  _transformGradient: function (gradients) {
    let newGradients = [];
    for (let i in gradients) {
      newGradients.push({ key: +i, value: gradients[i] });
    }
    return newGradients.sort((item1, item2) => {
      return +item1.key - +item2.key;
    });
  },
  _formatNumber: function (length, number) {
    let result = number.toString();
    let numLength = result.length;
    result = result.replace("-", `&ndash;`);
    if (numLength < length) {
      for (let i = 0; i < length - numLength; i++) {
        result = "&nbsp;&nbsp;" + result;
      }
    }
    return result;
  }
});

L.control.IDWLegend = function (gradients, options) {
  return new L.Control.IDWLegend(gradients, options);
};


function simpleidw(canvas) {
  if (!(this instanceof simpleidw)) return new simpleidw(canvas);

  this._canvas = canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

  this._ctx = canvas.getContext('2d');
  this._width = canvas.width;
  this._height = canvas.height;

  this._max = 1;
  this._min = 0;
  this._data = [];
};

simpleidw.prototype = {

  defaultCellSize: 25,

  defaultGradient: {
    0.0: '#000066',
    0.1: 'blue',
    0.2: 'cyan',
    0.3: 'lime',
    0.4: 'yellow',
    0.5: 'orange',
    0.6: 'red',
    0.7: 'Maroon',
    0.8: '#660066',
    0.9: '#990099',
    1.0: '#ff66ff'
  },

  data: function (data) {
    this._data = data;
    return this;
  },

  max: function (max) {
    this._max = max;
    return this;
  },

  min: function (min) {
    this._min = min;
    return this;
  },

  add: function (point) {
    this._data.push(point);
    return this;
  },

  clear: function () {
    this._data = [];
    return this;
  },

  cellSize: function (r) {
    // create a grayscale blurred cell image that we'll use for drawing points
    var cell = this._cell = document.createElement("canvas"),
      ctx = cell.getContext('2d');
    this._r = r;

    cell.width = cell.height = r;

    ctx.beginPath();
    ctx.rect(0, 0, r, r);
    ctx.fill();
    ctx.closePath();

    return this;
  },

  resize: function () {
    this._width = this._canvas.width;
    this._height = this._canvas.height;
  },

  gradient: function (grad) {
    // create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
    var canvas = document.createElement("canvas"),
      ctx = canvas.getContext('2d'),
      gradient = ctx.createLinearGradient(0, 0, 0, 256);

    canvas.width = 1;
    canvas.height = 256;
    if (this._min !== 0) {
      for (let i in grad) {
        gradient.addColorStop(this._numberLineTranslation(+i) / (this._max - this._min), grad[i]);
      }
    } else {
      for (let i in grad) {
        gradient.addColorStop(+i / this._max - this._min, grad[i]);
      }
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, 256);
    this._grad = ctx.getImageData(0, 0, 1, 256).data;

    return this;
  },

  draw: function (opacity) {
    if (!this._cell) this.cellSize(this.defaultCellSize);
    if (!this._grad) this.gradient(this.defaultGradient);

    var ctx = this._ctx;

    ctx.clearRect(0, 0, this._width, this._height);
    // draw a grayscale idwmap by putting a cell at each data point
    if (this._min !== 0) {
      for (var i = 0, len = this._data.length, p; i < len; i++) {
        p = this._data[i];
        // cell not used
        if (p[2] < this._min) continue;
        ctx.globalAlpha = this._numberLineTranslation(p[2]) / (this._max - this._min);
        ctx.drawImage(this._cell, p[0] - this._r / 2, p[1] - this._r / 2);
      }
    } else {
      for (let i = 0, len = this._data.length, p; i < len; i++) {
        p = this._data[i];
        // cell not used
        if (p[2] < this._min) continue;
        if (p[2] === 0) p[2] = 0.3;
        ctx.globalAlpha = p[2] / this._max;
        ctx.drawImage(this._cell, p[0] - this._r / 2, p[1] - this._r / 2);
      }
    }
    // colorize the heatmap, using opacity value of each pixel to get the right color from our gradient
    var colored = ctx.getImageData(0, 0, this._width, this._height);

    this._colorize(colored.data, this._grad, opacity);
    ctx.putImageData(colored, 0, 0);

    return this;
  },

  _colorize: function (pixels, gradient, opacity) {
    for (var i = 0, len = pixels.length, j; i < len; i += 4) {
      j = pixels[i + 3] * 4;
      // skip not used cells
      if (j === 0) continue;
      pixels[i] = gradient[j];
      pixels[i + 1] = gradient[j + 1];
      pixels[i + 2] = gradient[j + 2];
      pixels[i + 3] = opacity * 255;
    }
  },

  _numberLineTranslation: function (idwValue) {
    // if idwValue == 0 will be skip 
    // so the actual min value on the canvas will be 0.1
    let returnValue = idwValue - this._min;;
    if (returnValue < 1.0) return 0.3;
    return returnValue;
  }
};
window.simpleidw = simpleidw;

L.IdwLayer = (L.Layer ? L.Layer : L.Class).extend({

  //    options: {
  //        opacity: 0.5,
  //        maxZoom: 18,
  //        cellSize: 1,
  //        exp: 2,
  //        max: 2
  //    }

  initialize: function (latlngs, options) {
    this._latlngs = latlngs;
    // dataType: 2 => pm2.5, 3 => temperature, 4 => humidity
    L.setOptions(this, options);
  },

  setLatLngs: function (latlngs) {
    this._latlngs = latlngs;
    return this.redraw();
  },

  addLatLng: function (latlng) {
    this._latlngs.push(latlng);
    return this.redraw();
  },

  setOptions: function (options) {
    L.setOptions(this, options);
    if (this._idw) {
      this._updateOptions();
    }
    return this.redraw();
  },

  redraw: function () {
    if (this._idw && !this._frame && !this._map._animating) {
      this._frame = L.Util.requestAnimFrame(this._redraw, this);
    }
    return this;
  },

  onAdd: function (map) {
    this._map = map;

    if (!this._canvas) {
      this._initCanvas();
    }

    map._panes.overlayPane.appendChild(this._canvas);

    map.on('moveend', this._reset, this);

    if (map.options.zoomAnimation && L.Browser.any3d) {
      map.on('zoomanim', this._animateZoom, this);
    }

    this._reset();
  },

  onRemove: function (map) {
    map.getPanes().overlayPane.removeChild(this._canvas);

    map.off('moveend', this._reset, this);

    if (map.options.zoomAnimation) {
      map.off('zoomanim', this._animateZoom, this);
    }
  },

  addTo: function (map) {
    map.addLayer(this);
    return this;
  },

  // remove: function () {
  //   map.remove();
  // },

  _initCanvas: function () {
    var canvas = this._canvas = L.DomUtil.create('canvas', 'leaflet-idwmap-layer leaflet-layer');

    var originProp = L.DomUtil.testProp(['transformOrigin', 'WebkitTransformOrigin', 'msTransformOrigin']);
    canvas.style[originProp] = '50% 50%';

    var size = this._map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    var animated = this._map.options.zoomAnimation && L.Browser.any3d;
    L.DomUtil.addClass(canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

    this._idw = simpleidw(canvas);
    this._updateOptions();
  },

  _updateOptions: function () {
    this._idw.cellSize(this.options.cellSize || this._idw.defaultCellSize);
    if (this.options.maxVal) {
      this._idw.max(this.options.maxVal);
    }
    if (this.options.minVal) {
      this._idw.min(this.options.minVal);
    }
    if (this.options.gradient) {
      this._idw.gradient(this.options.gradient);
    }

  },

  _reset: function () {
    var topLeft = this._map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this._canvas, topLeft);

    var size = this._map.getSize();

    if (this._idw._width !== size.x) {
      this._canvas.width = this._idw._width = size.x;
    }
    if (this._idw._height !== size.y) {
      this._canvas.height = this._idw._height = size.y;
    }

    this._redraw();
  },

  _redraw: function () {
    if (!this._map) {
      return;
    }
    var data = [],
      // r is cell size
      r = this._idw._r,
      // screen size: o.Point {x: 1156, y: 983}
      size = this._map.getSize(),
      // bounds of pixel coordinate on the screen
      bounds = new L.Bounds(
        L.point([-r, -r]),
        size.add([r, r])
      ),
      // exp used for weighting, 1 by default
      // exponential distances of the n data points to the estimated point
      exp = this.options.exp || 2,
      // maxZoom = this.options.maxZoom === undefined ? this._map.getMaxZoom() : this.options.maxZoom,
      cellCen = r / 2,
      // number of cells on the x-axis of the screen
      nCellX = Math.ceil((bounds.max.x - bounds.min.x) / r) + 1,
      // number of cells on the y-axis of the screen
      nCellY = Math.ceil((bounds.max.y - bounds.min.y) / r) + 1,
      numberOfData = this._latlngs.length,
      // dataType: 2 => pm2.5, 3 => temperature, 4 => humidity
      dataType = this.options.dataType || 2,
      // station effective range in km
      station_range = this.options.station_range || 10,
      maxVal = this.options.maxVal || 1000.0,
      minVal = this.options.minVal || 0.0;
    //console.log("Zoom level:", map.getZoom());
    //console.log("Cells:", nCellY * nCellX);
    //console.log("Data points:", this._latlngs.length);

    // -- cclljj
    // left top lat lon coordinate of the screen
    var leftTop = this._map.containerPointToLatLng([0, 0]),
      // right bottom lat lon coordinate of the screen
      rightBottom = this._map.containerPointToLatLng([this._map.getSize().x, this._map.getSize().y]),
      // km per pixel on x-axis
      offsetX = Math.abs(leftTop.lng - rightBottom.lng) * 104.64 / this._map.getSize().x,
      // km per pixel on y-axis
      offsetY = Math.abs(leftTop.lat - rightBottom.lat) * 110.69 / this._map.getSize().y

    // Inverse Distance Weighting (IDW)
    //       Σ (1 / (di ^ p)) * vi
    // V = -------------------------
    //          Σ (1 / (di ^ p))
    // Reference:
    // http://www.gitta.info/ContiSpatVar/de/html/Interpolatio_learningObject2.xhtml

    // cellsn = Σ (1 / (di ^ p)) * vi
    // cellsd = Σ (1 / (di ^ p))
    var cellsn = new Array(nCellY),
      cellsd = new Array(nCellY);
    // initialize cellsn and cellsd to 0
    for (var i = 0; i < nCellY; i++) {
      cellsn[i] = new Array(nCellX);
      cellsd[i] = new Array(nCellX);
      for (var j = 0; j < nCellX; j++) {
        cellsn[i][j] = 0;
        cellsd[i][j] = 0;
      }
    }

    // 10 km per degree
    let tenKmPerLng = 10 / 104.64;
    let tenKmPerLat = 10 / 110.69;
    // limit the coordinate
    leftTop.lat += tenKmPerLat
    leftTop.lng -= tenKmPerLng;
    rightBottom.lat -= tenKmPerLat;
    rightBottom.lng += tenKmPerLng;
    //let pointCounter = 0;
    //console.time("process idw in bounds");
    for (var k = 0; k < numberOfData; k++) {
      // check whether IDW value is valid
      if (isNaN(this._latlngs[k][dataType])
        || this._latlngs[k][dataType] > maxVal
        || this._latlngs[k][dataType] < minVal) {
        // console.log("malfunction station: ", this._latlngs[k]);
        continue;
      }
      // eliminate data outside the screen
      if (this._latlngs[k][0] > leftTop.lat ||
        this._latlngs[k][0] < rightBottom.lat ||
        this._latlngs[k][1] < leftTop.lng ||
        this._latlngs[k][1] > rightBottom.lng) {
        continue;
      }
      //pointCounter++;
      // p is the pixel coordinate of _latlngs[k] on the screen
      var p = this._map.latLngToContainerPoint(L.latLng(this._latlngs[k][0], this._latlngs[k][1])),
        // left pixel coordinate of the cell
        x1 = p.x - station_range / offsetX,
        // right
        x2 = p.x + station_range / offsetX,
        // top
        y1 = p.y - station_range / offsetY,
        // bottom
        y2 = p.y + station_range / offsetY;

      // cell coordinate
      x1 = Math.round(x1 / r + 0.5);
      x2 = Math.ceil(x2 / r - 0.5);
      y1 = Math.round(y1 / r + 0.5);
      y2 = Math.ceil(y2 / r - 0.5);

      // check if x1, x2, y1, y2 out of cellsn, cellsd bounds
      if (x2 < 0) {
        continue;
      }
      if (x1 >= nCellX) {
        continue;
      }
      if (y2 < 0) {
        continue;
      }
      if (y1 >= nCellY) {
        continue;
      }

      if (x1 < 0) {
        x1 = 0;
      }
      if (x2 >= nCellX) {
        x2 = nCellX - 1;
      }
      if (y1 < 0) {
        y1 = 0;
      }
      if (y2 >= nCellY) {
        y2 = nCellY - 1;
      }
      // L.marker([this._latlngs[k][0], this._latlngs[k][1]]).addTo(map);
      // calculate every point effect by the station
      for (let j = x1; j <= x2; j++) {
        for (let i = y1; i <= y2; i++) {
          if (cellsd[i][j] < 0.0) {
            // center of the cell
            // cellsd = -1
            continue;
          }
          // estimated point pixel coordinate
          var cp = L.point((j * r + cellCen), (i * r + cellCen));

          // distance in km on x-axis
          var LJ_x = (p.x - cp.x) * offsetX;
          // distance in km on y-axis
          var LJ_y = (p.y - cp.y) * offsetY;
          var LJ_dist = Math.sqrt(LJ_x * LJ_x + LJ_y * LJ_y);
          if (LJ_dist > station_range) {
            // point out of effective range
            continue;
          }

          // IDW value
          var val = this._latlngs[k][dataType];
          // pixel distance
          var distInPixels = cp.distanceTo(p);

          if (distInPixels === 0.0) {
            // cell center fills in original value
            cellsn[i][j] = val;
            cellsd[i][j] = -1;
          } else {
            var distInPixelsExp = Math.pow(distInPixels, exp);
            cellsn[i][j] += (val / distInPixelsExp);
            cellsd[i][j] += (1.0 / distInPixelsExp);
          }
        }
      }
    }
    // console.log("Points for idw:", pointCounter);
    for (let i = 0; i < nCellY; i++) {
      for (let j = 0; j < nCellX; j++) {
        if (cellsd[i][j] < 0.0) {
          cellsd[i][j] = 1.0;
        }
        var interpolVal = 0.0
        if (cellsd[i][j] === 0.0) {
          // cell not used
          interpolVal = minVal - 1;
        } else {
          interpolVal = cellsn[i][j] / cellsd[i][j];
        }
        // IDW value
        var cell = [
          Math.round(j * r),
          Math.round(i * r),
          Math.min(interpolVal, maxVal)
        ];

        if (cell !== undefined) {
          data.push(cell);
        }
      }
    }
    // console.timeEnd("process idw in bounds");
    // console.time("draw");
    this._idw.data(data).draw(this.options.opacity);
    // console.timeEnd("draw");
    this._frame = null;
  },

  _animateZoom: function (e) {
    var scale = this._map.getZoomScale(e.zoom),
      offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

    if (L.DomUtil.setTransform) {
      L.DomUtil.setTransform(this._canvas, offset, scale);

    } else {
      this._canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')';
    }
  }
});

L.idwLayer = function (latlngs, options) {
  return new L.IdwLayer(latlngs, options);
};


export default L


