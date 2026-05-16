import { useEffect, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from 'react-leaflet'
import Sidebar from './components/sidebar'
import AttributesTable from './components/attributesTable'
import { fetchFeatures } from './services/wfs.js'
import CollapsiblePanel from './components/collapsiblePanel'
import TableView from './components/tableView.jsx'
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

    const [view, setView] = useState('map')
    const [activeTableLayer, setActiveTableLayer] = useState(null)

    function addLayer(name, title, source, data, meta = null) {
        setLayers(prev => {
            if (prev.some(l => l.name === name)) return prev
            const id = `layer-${Date.now()}`
            const color = config.colors[prev.length % config.colors.length]
            return [ ...prev, { id, name, title, source, data, meta, color }]
        })
    }

    function removeLayer(id) {
        setLayers(prev => prev.filter(l => l.id !== id))
    }

    function updateLayerColor(id, newColor) {
        setLayers(prev => {
            return prev.map(layer => layer.id === id ? { ...layer, color: newColor } : layer)
        })
    }

    function handleGeoJSONLoad(data, name, url, source = 'geojson') {
        //console.log(data)
        addLayer(name, name, source, data, { url })
        //console.log(layers)
        setVisibleFeatures(data.features)
        const bounds = L.geoJSON(data).getBounds()
        setSelectedLayer({ boundingBox: {lowerCorner: `${bounds.getWest()} ${bounds.getSouth()}`, upperCorner: `${bounds.getEast()} ${bounds.getNorth()}` }})
    }
    
    async function handleLayerSelect(layer) {
        try {
            setSelectedLayer(layer)
            //setMetaLayer({ ...layer, url: wfsUrl })
            const data = await fetchFeatures(wfsUrl, layer.name, layer.formats)
            addLayer(layer.name, layer.title, 'wfs', data, { ...layer, url: wfsUrl})
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
                const allFeatures = layers.flatMap(l => l.data.features ?? [])
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
    const displayedFeatures = layers.flatMap(l => l.data?.features ?? [])

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
                updateColor={updateLayerColor}
            />
            <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000 }}>
                    <button onClick={() => setView('map')}>🗺️</button>
                    <button onClick={() => setView('table')}>📋</button>
                </div>
                {view === 'map' && (
                    <>
                    <MapContainer
                        center={[51.505, -0.39]}
                        zoom={5}
                        style={{ height: '100vh' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="© OpenStreetMap contributors"
                        />
                        {layers.map(layer => (
                            <GeoJSON
                                key={`${layer.id}-${layer.color}`}
                                data={{ type:'FeatureCollection', features: layer.data.features }}
                                style={{ color: layer.color, fillColor: layer.color, fillOpacity: 0.4 }}
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
                    <div style={{ position: 'absolute', bottom: 0, right: 0, zIndex: 1000 }}> 
                        <CollapsiblePanel>
                            <AttributesTable features={displayedFeatures} handleOnClick={handleFeatureClick} filterableFIDs={filterableFIDs} setFilterableFIDs={setFilterableFIDs} isFiltered={isFiltered} setIsFiltered={setIsFiltered} change={change} selectAll={selectAll}/>
                        </CollapsiblePanel>
                    </div>

                    </>
                )}
                {view === 'table' && (
                    <div style={{ height: '100%', overflowY: 'auto'}} >
                        <TableView layers={layers} activeTableLayer={activeTableLayer} setActiveTableLayer={setActiveTableLayer} />
                    </div>
                )}
            </div>            

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