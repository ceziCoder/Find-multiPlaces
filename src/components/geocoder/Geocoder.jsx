import React from 'react'
import MapBoxGeocoder from '@mapbox/mapbox-gl-geocoder'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'

const token = import.meta.env.VITE_REACT_APP_TOKEN

export const Geocoder = () => {
	const ctrl = new MapBoxGeocoder({
		accessToken:  token ,
		marker: false,
		collapsed: true,
	})

	return <div>{ctrl}</div>
}


