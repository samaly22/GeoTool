import { useEffect, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from 'react-leaflet'
import Sidebar from './components/sidebar'
import AttributesTable from './components/attributesTable'
import { fetchFeatures } from './services/wfs.js'
import CollapsiblePanel from './components/collapsiblePanel'
import TableView from './components/tableView.jsx'
import HeatmapLayer from './components/heatmapLayer.jsx'
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

    const [notification, setNotification] =  useState(null)
    const [choropleths, setChoropleths] = useState({})
    const [heatmaps, setHeatmaps] = useState({})

    function addLayer(name, title, source, data, meta = null) {
        setLayers(prev => {
            if (prev.some(l => l.name === name)) return prev
            const id = `layer-${Date.now()}`
            const color = config.colors[prev.length % config.colors.length]
            const analysis = analyzeLayer(data)
            return [ ...prev, { id, name, title, source, data, meta, color, analysis }]
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
            const analysis = analyzeLayer(data)
            addLayer(layer.name, layer.title, 'wfs', data, { ...layer, url: wfsUrl})
            if (analysis.numericColumns.length > 0  && ['Polygon', 'MultiPolygon'].includes(analysis.geometryType)) {
                showNotification(`Layer "${layer.title}" eignet sich für eine Choroplethenkarte.`)
            }
            if (analysis?.geometryType === 'Point' || analysis?.geometryType === 'MultiPolygon') {
                showNotification(`Layer "${layer.title}" eignet sich für eine Heatmap.`)
            }
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

    function analyzeLayer(data) {
        const feature = data.features[0]
        if (!feature) return null
        const geometryType = feature.geometry.type
        const numericColumns = Object.entries(feature.properties)
            .filter(([key, value]) => typeof value === 'number')
            .map(([key]) => key)
        return { geometryType, numericColumns }
    }

    function showNotification(message) {
        const id = Date.now()
        setNotification(prev => [...(prev || []), { id, message }])
        setTimeout(() => setNotification(prev => prev.filter(n => n.id !== id)), 5000)
    }

    function setChoropleth(layerId, column) {
        setChoropleths(prev => ({ ...prev, [layerId]: column}))
    }

    function getChoroplethOpacity(value, min, max) {
        if (max === min) return 0.7
        return 0.05 + 0.9 * ((value - min) / (max - min))
    }

    function toggleHeatmap(layerId) {
        setHeatmaps(prev => ({ ...prev, [layerId]: !prev[layerId] }))
    }

    function moveLayer(id, direction) {
        setLayers(prev => {
            const index = prev.findIndex(l => l.id === id)
            if (direction === 'up' && index === 0) return prev
            if (direction === 'down' && index === prev.length - 1) return prev
            const newLayers = [...prev]
            const swapIndex = direction === 'up' ? index - 1 : index + 1
            ;[newLayers[index], newLayers[swapIndex]] = [newLayers[swapIndex], newLayers[index]]
            return newLayers
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
                choropleths={choropleths}
                setChoropleth={setChoropleth}
                heatmaps={heatmaps}
                toggleHeatmap={toggleHeatmap}
                moveLayer={moveLayer}
            />
            <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000 }}>
                    <button onClick={() => setView('map')}>🗺️</button>
                    <button onClick={() => setView('table')}>📋</button>
                </div>
                {view === 'map' && (
                    <>
                    {notification && notification.map(n => (
                        <div key={n.id} style={{ position: 'absolute', top: '4rem', right: '1rem', zIndex: 1000, background: '#f4c430', padding: '0.75rem 1rem', borderRadius: '6px' }}>
                            {n.message}
                        </div>
                    ))}
                    <MapContainer
                        center={[51.505, -0.39]}
                        zoom={5}
                        style={{ height: '100vh' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="© OpenStreetMap contributors"
                        />
                        {layers.map(layer => {
                            const choroplethColumn = choropleths[layer.id]
                            const features = layer.data.features
                            const values = choroplethColumn
                                ? features.map(f => f.properties[choroplethColumn]).filter(v => v != null)
                                : []
                            const min = Math.min(...values)
                            const max = Math.max(...values)

                            const isHeatmap = heatmaps[layer.id]
                            const points = isHeatmap
                                ? layer.data.features.map(f => [
                                    f.geometry.coordinates[1],
                                    f.geometry.coordinates[0]
                                ])
                                : []
                            return (
                                <>
                                    {!isHeatmap &&  
                                    <GeoJSON
                                        key={`${layer.id}-${layer.color}-${choroplethColumn}`}
                                        data={{ type:'FeatureCollection', features: layer.data.features }}
                                        style={feature => {
                                            if (!choroplethColumn) return { color: layer.color, fillColor: layer.color, fillOpacity: 0.4 }
                                            const value = feature.properties[choroplethColumn]
                                            const opacity = getChoroplethOpacity(value, min, max)
                                            return { color: layer.color, fillColor: layer.color, fillOpacity: opacity }
                                        }}
                                        onEachFeature={onEachFeature}
                                    />}
                                    {isHeatmap && <HeatmapLayer key={layer.id} points={points} />}
                                </>

                        )})}
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