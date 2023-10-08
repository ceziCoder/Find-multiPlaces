/* eslint-disable no-unused-vars */
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
  Polyline,
} from "@react-google-maps/api";
import { useRef, useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import { BiNavigation, BiTrash } from "react-icons/bi";
import Draggable, { DraggableCore } from "react-draggable";
import { AiFillCloseCircle } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import {FaHandRock} from 'react-icons/fa'
import {IoLocationOutline} from 'react-icons/io5'


const center = { lat: 50.315107, lng: 21.448405 };
const libraries = ["places"];
const waypoints = [];

export function Googlemap() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [open, setOpen] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [directions, setDirections] = useState(null);
  const [originPoint, setOriginPoint] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [originInput, setOriginInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const originAutocompleteRef = useRef(null);
  const destinationAutocompleteRef = useRef(null);
  const [mapKey, setMapKey] = useState(1)

  ////// click event //////

  const handleMapClick = (event) => {
    const newWaypoint = {
      location: {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      },
      stopover: true,
    };

    // Update markers state
    setMarkers((prevMarkers) => [...prevMarkers, newWaypoint]);

    // opened div white function
    setOpen(true);

    // calculate directions
    if (markers.length >= 1) {
      calculateDirections([...markers, newWaypoint]);
      //updated waypoints
      calculateMatrix(
        markers[markers.length - 1].location,
        newWaypoint.location
      );
    }
    console.log("New markers:", markers);
  };

  if (!isLoaded) {
    return "....loading";
  }

  const handleMarkerClick = async (marker) => {
    setSelectedPlace(null);
    setOpen(true);

    const lat = marker.location.lat;
    const lng = marker.location.lng;

    // get directions
    const geocoder = new window.google.maps.Geocoder();
    const latLng = new window.google.maps.LatLng(lat, lng);
    //
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === "OK") {
        if (results[0]) {
          setSelectedPlace(results[0].formatted_address);

          if (markers.length >= 2) {
            const origin = markers[markers.length - 1];
            const destination = markers[markers.length - 1];
            calculateMatrix(origin.location, destination.location);
          }

          console.log(results[0].formatted_address);
        }
      }
    });
  };

  ///// calculate directions /////

  const calculateDirections = (waypoints) => {
    const directionsService = new window.google.maps.DirectionsService();
    const origin = waypoints[0].location;
    const destination = waypoints[waypoints.length - 1].location;

    const request = {
      origin,
      destination,
      waypoints: waypoints.slice(1, waypoints.length - 1),
      travelMode: window.google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        setDirections(result);
        setDistance(result.routes[0].legs[0].distance.text);
        setDuration(result.routes[0].legs[0].duration.text);
      }
    });
  };

  async function calculateMatrix(origin, destination, subtract = false) {
    const service = new window.google.maps.DistanceMatrixService();

    const originPoint = new window.google.maps.LatLng(origin.lat, origin.lng);
    const destinationPoint = new window.google.maps.LatLng(
      destination.lat,
      destination.lng
    );

    const response = await new Promise((resolve) => {
      service.getDistanceMatrix(
        {
          origins: [originPoint],
          destinations: [destinationPoint],
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
          if (status === "OK") {
            resolve(response);
          } else {
            console.error(
              "Błąd przy wywołaniu usługi Matrix of Directions: ",
              status
            );
            resolve(null);
          }
        }
      );
    });

    if (response) {
      const distanceText = response.rows[0].elements[0].distance.text;
      const durationText = response.rows[0].elements[0].duration.text;

      const [hours, minutes] = durationText.split(" ");

      // Update totalDistance and totalDuration
      if (subtract) {
        setTotalDistance(
          (prevDistance) => prevDistance - parseInt(distanceText)
        );
        setTotalDuration(
          (prevDuration) => prevDuration - parseFloat(durationText)
        );
      } else {
        setTotalDistance(
          (prevDistance) => prevDistance + parseInt(distanceText)
        );
        setTotalDuration(
          (prevDuration) => prevDuration + parseFloat(durationText)
        );
      }

      console.log(response);
      console.log(`Suma dystansu: ${totalDistance} km`);
      console.log(`Suma czasu podróży: ${totalDuration} mins`);
      console.log({ distanceText, durationText });
    }
  }

  ///// AUTOCOMPLETE  input search  ///

  const handleOriginPlaceChanged = () => {
    if (originAutocompleteRef.current) {
      const place = originAutocompleteRef.current.getPlace();
      if (place.geometry) {
        const newOrigin = {
          location: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          },
          stopover: true,
        };

        setMarkers((prevMarkers) => [newOrigin, ...prevMarkers]);
        setOriginInput(place.formatted_address);

        if (markers.length >= 1) {
          calculateDirections([...markers, newOrigin]);
          calculateMatrix(
            markers[markers.length - 1].location,
            newOrigin.location
          );
        }
      }
    }
  };

  const handleDestinationPlaceChanged = () => {
    if (destinationAutocompleteRef.current) {
      const place = destinationAutocompleteRef.current.getPlace();
      if (place.geometry) {
        const newDestination = {
          location: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          },
          stopover: true,
        };

        setMarkers((prevMarkers) => [...prevMarkers, newDestination]);
        setDestinationInput(place.formatted_address);

        if (markers.length >= 1) {
          calculateDirections([...markers, newDestination]);
          calculateMatrix(
            markers[markers.length - 1].location,
            newDestination.location
          );
        }
      }
    }
  };

  /////////////////////   REMOVE WAYPOINTS   /////////////////////

  const removeLastWaypoint = async () => {
    if (markers && markers.length > 1) {
      // Get the distance and duration of the last waypoint to be removed

      const lastWaypoint = markers[markers.length - 1];
      const origin = markers[markers.length - 2];

      if (lastWaypoint && lastWaypoint.location) {
        await calculateMatrix(origin.location, lastWaypoint.location, true);
      }

      console.log(markers.length, "markers");

      // remove last waypoint
      const updatedMarkers = markers.slice(0, -1);

      //setMarkers((prevMarkers) => [...prevMarkers.slice(0, -1)]);

      // updating markers state
      setMarkers(updatedMarkers);

      console.log("Updated markers:", updatedMarkers);

      // calculate directions again
      calculateDirections(updatedMarkers);

      if (markers.length == 2) {
        window.location.reload();
        //setMapKey(mapKey + 1)
      }
    }
  }


 
  

  return (
    <div className="w-screen h-screen overflow-hidden  ">
      
      <div className=" w-full h-full ">
        <div className="  bg-gradient-to-r from-black/60 to-purple-200 top-0 flex justify-center items-center font-extrabold p-1"><p className="bg-clip-text text-transparent bg-gradient-to-r from-black to-purple-600">Find multiPlaces</p>
      
            <IoLocationOutline />...
            
          <IoLocationOutline />...
          <IoLocationOutline/>...
        </div>
        {/* Google Map Box */}
        <GoogleMap
          key={mapKey}
          center={{ lat: 50.315107, lng: 21.448405 }}
          zoom={12}
          mapContainerStyle={{ width: "100vw", height: "100vh" }}
          options={{
            zoomControl: true,
            streetViewControl: true,
            mapTypeControl: true,
            fullscreenControl: true,
          }}
          onLoad={(map) => {
            setMap(map);
            setOpen(true);
          }}
          onClick={handleMapClick}
        >
          {directions && <DirectionsRenderer directions={directions} />}
          {waypoints.map((waypoint, index) => (
            <Marker
              key={index}
              label={(index + 1).toString()}
              position={waypoint.location}
              onClick={() => {
                calculateMatrix;
                setOpen(true);
                setSelectedPlace(null);
                map.panTo(waypoint.location).setZoom(10);

                console.log(waypoint.location, "waypoint");
              }}
            />
          ))}
        </GoogleMap>
        
      </div>

      <div className="">
        {open && (
          <Draggable  handle=".handle">
            <div className=" absolute left-1/1 top-14  transform -translate-x-1/2 -translate-y-1/2w-auto h-[60%]   bg-gradient-to-r from-black/40 to-purple-600/20   rounded-md flex flex-col p-2 ">
              <MdClose
                onClick={() => setOpen(false)}
                size={30}
                className="cursor-pointer rounded-full bg-black absolute right-0 top-0 m-1 hover:scale-105"
                color="white"
                style={{
                  position: "absolute",
                  right: "0",
                  cursor: "pointer",
                  top: "0",
                  padding: "1",
                  
                }}
              />

              <div className="flex  flex-col mt-6 ">
                <div className=" handle absolute top-1 cursor-grabbing w-[80%] h-[30px]"/>
                <span className=" flex m-2 w-full h-full ">
                  <Autocomplete
                    onLoad={(autocomplete) =>
                      (originAutocompleteRef.current = autocomplete)
                    }
                    onPlaceChanged={handleOriginPlaceChanged}
                  >
                    <input
                      className="bg-white/40 cursor-text  -ml-2 p-2 rounded-lg "
                      name="from"
                      type="text"
                      placeholder="from..."
                      value={originInput}
                      onChange={(e) => setOriginInput(e.target.value)}
                    />
                  </Autocomplete>
                  <AiFillCloseCircle
                    size={20}
                    className=" cursor-pointer -ml-5"
                    onClick={() => setOriginInput("")}
                  />
                </span>
                <span className="flex  w-full h-full">
                  <Autocomplete
                    onLoad={(autocomplete) =>
                      (destinationAutocompleteRef.current = autocomplete)
                    }
                    onPlaceChanged={handleDestinationPlaceChanged}
                  >
                    <input
                      name="to"
                      className=" bg-white/60 cursor-text flex  rounded-lg p-2 w-full"
                      type="text"
                      placeholder="next...next...next..."
                      value={destinationInput}
                      onChange={(e) => setDestinationInput(e.target.value)}
                    />
                  </Autocomplete>
                  <AiFillCloseCircle
                    size={20}
                    className=" cursor-pointer -ml-5"
                    onClick={() => setDestinationInput("")}
                  />
                </span>
              </div>

              <div className="flex justify-between "></div>

              <div className="w-4 m-2 pb-2 h-4 flex ">
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: "bold",
                    color: "white",
                  }}
                  className="m-2"
                >
                  Distance: {totalDistance} km
                </div>
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: "bold",
                    color: "white",
                  }}
                  className="m-2 "
                >
                  Duration: {Math.floor(totalDuration / 60)} h{" "}
                  {Math.floor(totalDuration % 60)} min
                </div>

                <button className="" onClick={() => {}}>
                  <BiTrash
                    size={30}
                    color="white"
                    className="absolute right-1 bottom-1 m-1 rounded-full bg-black p-1 cursor-pointer"
                    onClick={() => removeLastWaypoint()}
                  />
                </button>

                <div>
                  <p className="text-black text-center">{selectedPlace}</p>
                </div>
              </div>
              <div className="handle flex justify-center items-end absolute bottom-2 cursor-grabbing w-[230px] h-1/2 ">
                <FaHandRock  style={{background:'transparent' , opacity: '0.5',  borderRadius: '50%', cursor: 'grabbing',}} size={ 30} />
                
              </div>
            </div>
          </Draggable>
        )}
      </div>
    </div>
  );
}

/*in googlemaps	{
		markers.map((marker, index) => <Marker key={index} position={marker}></Marker>)
	}

    ref={draggableRef}
	handleMarkerClick(waypoint.location)
        




	
	*/
