import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from 'react-leaflet'
import Sidebar from './components/sidebar'
import AttributesTable from './components/attributesTable'
import MetaData from './components/metaData.jsx'
import { fetchFeatures } from './services/wfs.js'
import CollapsiblePanel from './components/collapsiblePanel'
import config from './config.json'

function App() {
    const [hoveredFeature, setHoveredFeature] = useState(null)
    const [selectedFeature, setSelectedFeature] = useState(null)
    const [selectedLayer, setSelectedLayer] = useState(null)
    const [visibleFeatures, setVisibleFeatures] = useState(null)
    const [filterableFIDs, setFilterableFIDs] = useState([])
    const [isFiltered, setIsFiltered] = useState(false)
    const [geoData, setGeoData] = useState(null)
    const [wfsUrl, setWfsUrl] = useState('')

    async function handleLayerSelect(layer) {
        try {
            setSelectedLayer(layer)
            const data = await fetchFeatures(wfsUrl, layer.name)
            setSelectedLayer(layer)
            setGeoData(data)
            setVisibleFeatures(data.features)
        } catch (e) {
            console.error('Fehler beim Laden des Layers:', e)
        }
        // console.log('Gewählter Layer:', layer)
    }

    function MapController({ selectedFeature, selectedLayer, setSelectedFeature, setSelectedLayer, geoData, setVisibleFeatures }) {
        const map = useMap()

        useMapEvents({
            moveend: () => {
                if (!config.dynamicTable) return
                if (!geoData) return
                const bounds = map.getBounds()
                const features = geoData.features.filter(feature =>
                    bounds.contains([feature.geometry.coordinates[1], feature.geometry.coordinates[0]])
                )
                setVisibleFeatures(features)
        }})

        // Zoomen bei Layerauswahl
        useEffect(() => {
            if (!selectedLayer) return
            const lower = selectedLayer.boundingBox.lowerCorner.split(' ')
            const upper = selectedLayer.boundingBox.upperCorner.split(' ')
            map.fitBounds([[lower[1], lower[0]], [upper[1], upper[0]]], { animate: true, duration: 2 })
            map.invalidateSize()
            setSelectedLayer(null)
        }, [selectedLayer])
        

        // Zoomen auf ausgewähltes Feature
        useEffect(() => {
            if (!selectedFeature) return
            const [lng, lat] = selectedFeature.geometry.coordinates
            console.log([lng, lat])
            map.flyTo([lat, lng], 12)
            map.invalidateSize()
            setSelectedFeature(null)
        }, [selectedFeature])

    }

    const displayedFeatures = isFiltered ? visibleFeatures.filter(f => filterableFIDs.includes(f.id)) : visibleFeatures

    function selectAll() {
        setIsFiltered(false)
        if (visibleFeatures.length != filterableFIDs.length) {
            setFilterableFIDs(visibleFeatures.map(f => f.id))
        } else setFilterableFIDs([])
    }

    function change(id) {
        if (filterableFIDs.includes(id)) {
            setFilterableFIDs(filterableFIDs.filter(f => f !== id))
        } else setFilterableFIDs([...filterableFIDs, id])
    }

    function handleFeatureClick(feature) {
        setSelectedFeature(feature)
    }

    function onEachFeature(feature, layer) {
        if (feature) {
            layer.bindTooltip(feature.properties.NAME)
            const popupContent = `
                <div>
                    <table>
                        ${Object.entries(feature.properties)
                            .map(([key, value]) => `<tr><td><b>${key}</b></td><td>${value}</td></tr>`)
                            .join('')}
                    </table>
                </div>`
            //console.log(Obeject.entries(feature.properties))
            layer.bindPopup(popupContent)
        }
        layer.on({
            mouseover: (e) => setHoveredFeature(feature),
            mouseout: (e) => setHoveredFeature(null)
        })
    }

    

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <Sidebar onLayerSelect={handleLayerSelect} onUrlChange={setWfsUrl} />
            <MetaData layer={selectedLayer} />
            <MapContainer
                center={[51.505, -0.39]}
                zoom={5}
                style={{ flex: 1 }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="© OpenStreetMap contributors"
                />
                {geoData && <GeoJSON key={JSON.stringify(displayedFeatures)} data={displayedFeatures} onEachFeature={onEachFeature} />}
                <MapController selectedFeature={selectedFeature}
                                selectedLayer={selectedLayer}
                                setSelectedFeature={setSelectedFeature}
                                setSelectedLayer={setSelectedLayer} 
                                geoData={geoData}
                                setVisibleFeatures={setVisibleFeatures} />
            </MapContainer>
            <CollapsiblePanel>
                <AttributesTable features={displayedFeatures} handleOnClick={handleFeatureClick} filterableFIDs={filterableFIDs} setFilterableFIDs={setFilterableFIDs} isFiltered={isFiltered} setIsFiltered={setIsFiltered} change={change} selectAll={selectAll}/>
            </CollapsiblePanel>
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