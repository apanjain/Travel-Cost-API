import { useLeaflet } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { useEffect } from 'react';
import "leaflet-geosearch/dist/geosearch.css"
import "leaflet-geosearch/assets/css/leaflet.css"
//import L from './Helpers/leaflet-custom';


const Search = (props) => {
  const { map } = useLeaflet() // access to leaflet map

  useEffect(() => {
    const searchControl = new GeoSearchControl({
      provider: new OpenStreetMapProvider({
        params: {
          countrycodes: "in",
        }
      }),
      style: 'bar',
      autoComplete: true,
      // popupFormat: ({result}) => `${result.x}`,
      // resultFormat: ({}),
      //marker: L.circleMarker({radius: 5,}),
      showPopup: true,


      retainZoomLevel: false,
      animateZoom: true,
      //keepResult: true,
      searchLabel: 'Search places',
      //updateMap: false,
    })
    map.addControl(searchControl) // this is how you add a control in vanilla leaflet
    return () => map.removeControl(searchControl)
  }, [map])

  return null // don't want anything to show up from this comp
}

export default Search