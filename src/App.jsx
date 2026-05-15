import { useEffect, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from 'react-leaflet'
import Sidebar from './components/sidebar'
import AttributesTable from './components/attributesTable'
import { fetchFeatures } from './services/wfs.js'
import CollapsiblePanel from './components/collapsiblePanel'
import config from './config.json'

function App() {
    const [hoveredFeature, setHoveredFeature] = useState(null)
    const [selectedFeature, setSelectedFeature] = useState(null)
    const [selectedLayer, setSelectedLayer] = useState(null)
    const [metaLayer, setMetaLayer] = useState(null)
    const [visibleFeatures, setVisibleFeatures] = useState(null)
    const [filterableFIDs, setFilterableFIDs] = useState([])
    const [isFiltered, setIsFiltered] = useState(false)
    const [layers, setLayers] = useState([])
    const [wfsUrl, setWfsUrl] = useState('')

    function addLayer(name, source, data) {
        setLayers(prev => {
            if (prev.some(l => l.name === name)) return prev
            const id = `layer-${Date.now()}`
            return [ ...prev, { id, name, source, data }]
        })
    }

    function removeLayer(id) {
        setLayers(prev => prev.filter(l => l.id !== id))
    }

    function handleGeoJSONLoad(data, name) {
        //console.log(data)
        addLayer(name, 'geojson', data)
        console.log(layers)
        setVisibleFeatures(data.features)
        const bounds = L.geoJSON(data).getBounds()
        setSelectedLayer({ boundingBox: {lowerCorner: `${bounds.getWest()} ${bounds.getSouth()}`, upperCorner: `${bounds.getEast()} ${bounds.getNorth()}` }})
    }
    
    async function handleLayerSelect(layer) {
        try {
            setSelectedLayer(layer)
            setMetaLayer({ ...layer, url: wfsUrl })
            const data = await fetchFeatures(wfsUrl, layer.name, layer.formats)
            addLayer(layer.name, 'wfs', data)
            //console.log(layers)
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
                if (!layers) return
                const bounds = map.getBounds()
                const allFeatures = layers.flatMap(l => l.data.features)
                const features = allFeatures.filter(feature =>
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
            setTimeout(() => map.invalidateSize(), 300)
            console.log('lower:', lower, 'upper:', upper)
            setSelectedLayer(null)
        }, [selectedLayer])
        

        // Zoomen auf ausgewähltes Feature
        useEffect(() => {
            if (!selectedFeature) return
            if (selectedFeature.geometry.type === 'Point') {
                const [lng, lat] = selectedFeature.geometry.coordinates
                map.flyTo([lat, lng], 12)
            } else {
                const bounds = L.geoJSON(selectedFeature).getBounds()
                map.fitBounds(bounds)
            }
            map.invalidateSize()
            setSelectedFeature(null)
        }, [selectedFeature])

    }

    //const displayedFeatures = isFiltered ? visibleFeatures.filter(f => filterableFIDs.includes(f.id)) : visibleFeatures
    const displayedFeatures = layers.flatMap(l => l.data.features)

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
            const nameKey = config.WFSnameKeys.find(key => feature.properties[key])
            const tooltipText = nameKey ? feature.properties[nameKey] : 'Feature'
            //console.log(config.WFSnameKeys)
            //console.log(feature.properties)
            //console.log(nameKey)
            //console.log(tooltipText)
            layer.bindTooltip(tooltipText)
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
            <Sidebar
                onLayerSelect={handleLayerSelect}
                onUrlChange={setWfsUrl}
                selectedLayer={metaLayer}
                onDataLoad={handleGeoJSONLoad}
                activeLayers={layers}
                removeLayer={removeLayer}
            />            
            <MapContainer
                center={[51.505, -0.39]}
                zoom={5}
                style={{ flex: 1 }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="© OpenStreetMap contributors"
                />
                {layers.map(layer => (
                    <GeoJSON
                        key={layer.id}
                        data={{ type:'FeatureCollection', features: displayedFeatures }}
                        onEachFeature={onEachFeature}
                    />
                ))}
                <MapController selectedFeature={selectedFeature}
                                selectedLayer={selectedLayer}
                                setSelectedFeature={setSelectedFeature}
                                setSelectedLayer={setSelectedLayer} 
                                geoData={layers}
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