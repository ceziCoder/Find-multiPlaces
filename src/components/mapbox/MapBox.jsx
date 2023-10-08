/* eslint-disable no-unused-vars */
import { useState, useRef, useCallback, useEffect } from 'react'
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl, GeolocateControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import axios from 'axios'
import { IoCloseOutline } from 'react-icons/io5'
import { MdLocationOn } from 'react-icons/md'
import { AddressAutofill } from '@mapbox/search-js-react'
import { useJsApiLoader, GoogleMap, Autocomplete, DirectionsRenderer } from '@react-google-maps/api'



//`https://api.mapbox.com/geocoding/v5/mapbox.places/${normalizedSearchValue}.json?access_token=${token}`



const token = import.meta.env.VITE_REACT_APP_TOKEN

const libraries = ['places']


//const destiantionRef = useRef()

export const Mapbox = () => {
	const [viewState, setViewState] = useState({
		longitude: 21.448405,
		latitude: 50.315107,
		zoom: 10,
		terrain: {
			source: 'mapbox-raster-dem',
			exaggeration: 2,
		},
	})
    
    const { isLoaded } = useJsApiLoader({
			googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY,
			libraries: libraries,
		})

	const originRef = useRef()

	const [searchValue, setSearchValue] = useState('')
	const [suggestions, setSuggestions] = useState([])
	const [selectedSuggestion, setSelectedSuggestion] = useState(null)

	const normalizeAddress = (address) => {
		return address.toLowerCase().replace(/[^\w\s]/gi, '')
	}

	const fetchSuggestions = async () => {
		try {
			const normalizedSearchValue = normalizeAddress(searchValue)
			const response = await axios.get(
				`https://api.mapbox.com/geocoding/v5/mapbox.places/${normalizedSearchValue}.json?access_token=${token}`,
				{
					params: {
						bbox: '14.074521,49.002046,24.145653,54.839580',
						country: 'PL', 
						language: 'pl',
					},
				}
			)

			const suggestions = response.data.features
				.map((feature) =>  
						feature.place_name )
					
				


			setSuggestions(suggestions)
			console.log(response.data)
		} catch (error) {
			console.error('Wystąpił błąd podczas wyszukiwania:', error)
			setSuggestions([])
		}
	}

	const handleFormSubmit = async (event) => {
		event.preventDefault()

		try {
			const normalizedSearchValue = normalizeAddress(searchValue)
			const response = await axios.get(
				`https://api.mapbox.com/geocoding/v5/mapbox.places/${normalizedSearchValue}.json?access_token=${token}`
			)

			const suggestions = response.data.features.map((feature) => feature.place_name)
			setSuggestions(suggestions)
			console.log(response.data)

			const firstResult = response.data.features[0]

			if (firstResult) {
				const newViewState = {
					longitude: firstResult.center[0],
					latitude: firstResult.center[1],
					zoom: 15,
				}
				setViewState(newViewState)

				setSearchValue('')
				setSelectedSuggestion(firstResult)
			}
		} catch (error) {
			console.error(' searching error', error)
			setSuggestions([])
			setSelectedSuggestion(null)
		}
	}

	const handleInputKeyPress = (event) => {
		if (event.key === 'Enter') {
			handleFormSubmit(event)
		}
	}
	const handleInputChange = (event) => {
		setSearchValue(event.target.value)
		
	}

	///////////  markers   ///////////////

	const [marker, setMarker] = useState({
		longitude: 21.448405,
		latitude: 50.315107,
		transition: {
			duration: 3500,
			delay: 0,
		},
	})
	const [events, logEvents] = useState({})

	const onMarkerDragStart = useCallback((event) => {
		logEvents((_events) => ({ ..._events, onDragStart: event.lngLat }))
		console.log('onDragStart', event.lngLat)
	}, [])

	const onMarkerDrag = useCallback((event) => {
		logEvents((_events) => ({ ..._events, onDrag: event.lngLat }))

		setMarker({
			longitude: event.lngLat.lng,
			latitude: event.lngLat.lat,
		})
	}, [])

	const onMarkerDragEnd = useCallback((event) => {
		logEvents((_events) => ({ ..._events, onDragEnd: event.lngLat }))
	}, [])

	return (
		<div className='h-screen flex flex-col'>
			<form onSubmit={handleFormSubmit} className=' flex m-2'>
				<Autocomplete>
				<input
					type='text'
					name='search'
					placeholder='Wyszukaj miejscowość'
					className='border border-gray-300 rounded p-1  w-auto'
					value={searchValue}
					onChange={handleInputChange}
					onKeyPress={handleInputKeyPress}
				
				/>
				</Autocomplete>

				<button onClick={handleFormSubmit} type='submit' className='m-2 p-3 bg-blue-500 text-white rounded'>
					Szukaj
				</button>
			</form>

			{suggestions.length > 0 && (
				<ul className=' border border-gray-300 rounded text-white text-sm p-4 mt-2 absolute top-16 md:w-[17%]  bg-black/60 z-10 '>
					{suggestions.map((suggestion) => (
						<li
							key={suggestion}
							className='cursor-pointer hover:bg-gray-100 '
							onClick={() => setSearchValue(suggestion)}>
							{suggestion}
						</li>
					))}
					<IoCloseOutline
						className='absolute bottom-0 right-0 cursor-pointer  text-xl bg-black/20 rounded-md'
						onClick={() => setSuggestions([])}
					/>
				</ul>
			)}

			<div style={{ flex: 1 }}>
				<Map
					{...viewState}
					width='100%'
					height='100%'
					projection='globe'
					fitBoundsOptions={{ padding: 20 }}
					mapboxAccessToken={token}
					onMove={(evt) => setViewState(evt.viewState)}
					mapStyle='mapbox://styles/mapbox/satellite-streets-v11'>
					<div style={{ position: 'absolute', top: 10, right: 10 }}>
						<GeolocateControl trackUserLocation position='top-left' />
						<FullscreenControl position='top-left' />
						<NavigationControl onViewportChange={(viewport) => setViewState(viewport)} position='top-left' />
						<ScaleControl />
					</div>
					<div style={{ flex: 1, width: '100%', height: '100vh' }}></div>
					{selectedSuggestion && (
						<Marker longitude={selectedSuggestion.center[0]} latitude={selectedSuggestion.center[1]}>
							<Popup
								latitude={selectedSuggestion.center[1]}
								longitude={selectedSuggestion.center[0]}
								onClose={() => setSelectedSuggestion(null)} // clear suggestions
							>
								{selectedSuggestion.place_name}
							</Popup>
						</Marker>
					)}

					<Marker
						longitude={marker.longitude}
						latitude={marker.latitude}
						anchor='bottom'
						draggable
						onDragStart={onMarkerDragStart}
						onDrag={onMarkerDrag}
						onDragEnd={onMarkerDragEnd}>
						<MdLocationOn className='text-2xl' color='red' size={60}></MdLocationOn>
					</Marker>
				</Map>
			</div>
		</div>
	)
}
