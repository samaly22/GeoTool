import { useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import Sidebar from './components/sidebar'
import AttributesTable from './components/attributesTable'
import { fetchFeatures } from './services/wfs.js'

function App() {
    const [selectedFeature, setSelectedFeature] = useState(null)
    const [geoData, setGeoData] = useState(null)
    const [wfsUrl, setWfsUrl] = useState('')

    async function handleLayerSelect(layer) {
        try {
            const data = await fetchFeatures(wfsUrl, layer.name)
            setGeoData(data)
        } catch (e) {
            console.error('Fehler beim Laden des Layers:', e)
        }
        // console.log('Gewählter Layer:', layer)
    }

    function MapController({ selectedFeature }) {
        console.log('selectedFeature: ', selectedFeature)
        if (!selectedFeature) return null
        const map = useMap()
        const [lng, lat] = selectedFeature.geometry.coordinates
        console.log([lng, lat])
        map.flyTo([lat, lng], 12)
        map.invalidateSize()
        return null
    }

    function handleFeatureClick(feature) {
        setSelectedFeature(feature)
    }

    async function onEachFeature(feature, layer) {
        layer.bindPopup(feature)
        layer.on({
            mouseover: (e) => setHoveredFeature(feature),
            mouseout: (e) => setHoveredFeature(null)
        })
    }

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <Sidebar onLayerSelect={handleLayerSelect} onUrlChange={setWfsUrl} />
            <MapContainer
                center={[51.505, -0.39]}
                zoom={5}
                style={{ flex: 1 }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="© OpenStreetMap contributors"
                />
                {geoData && <GeoJSON key={JSON.stringify(geoData)} data={geoData} />}
                <MapController selectedFeature={selectedFeature} />
            </MapContainer>
            <AttributesTable geoJson={geoData} handleOnClick={handleFeatureClick} />
        </div>    
    )
    
//  nur Leaflet Karte anzeigen
//   return (
//     <MapContainer
//       center={[51.505, -0.09]}
//       zoom={13}
//       style={{ height: '100vh', width: '100%' }}
//     >
//       <TileLayer
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         attribution="© OpenStreetMap contributors"
//       />
//     </MapContainer>
//   )
}

export default App