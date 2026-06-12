import React from 'react'
import { useEffect, useState, useRef } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from 'react-leaflet'
import Sidebar from './components/sidebar'
import AttributesTable from './components/attributesTable'
import { fetchFeatures } from './services/wfs.js'
import CollapsiblePanel from './components/collapsiblePanel'
import TableView from './components/tableView.jsx'
import HeatmapLayer from './components/heatmapLayer.jsx'
import config from './config.json'

function MapController({ selectedFeature, selectedLayer, setSelectedFeature, setSelectedLayer, setVisibleFeatures, view, layers }) {
    const map = useMap()
    const hasZoomed = useRef(false)

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
        setTimeout(() => map.invalidateSize(), 30000)
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

    useEffect(() => {
        if (view !== "map") {
            hasZoomed.current = false
            return
        }
        if (hasZoomed.current) return
        setTimeout(() => {
            map.invalidateSize()
            const allFeatures = layers.flatMap(l => l.data?.features ?? [])
            if (allFeatures.length === 0) return
            const bounds = L.geoJSON({ type: 'FeatureCollection', features: allFeatures }).getBounds()
            map.fitBounds(bounds, { animate: true })
            hasZoomed.current = true
        }, 100)
    }, [view])
}


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

    const [theme, setTheme] = useState('dark')

    function toggleTheme() {
        const next = theme === 'dark' ? 'light' : 'dark'
        setTheme(next)
        document.documentElement.setAttribute('data-theme', next)
        }

    function addLayer(name, title, source, data, meta = null) {
        setLayers(prev => {
            if (prev.some(l => l.name === name)) return prev
            const id = `layer-${Date.now()}`
            const color = config.colors[prev.length % config.colors.length]
            const analysis = analyzeLayer(data)
            return [{ id, name, title, source, data, meta, color, analysis }, ...prev]
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
            if (!data.features || data.features.length === 0) {
                showNotification(`Layer "${layer.title}" enthält keine Features.`, true)
            }
            const analysis = analyzeLayer(data)
            addLayer(layer.name, layer.title, 'wfs', data, { ...layer, url: wfsUrl})
            if (analysis?.numericColumns?.length > 0  && ['Polygon', 'MultiPolygon'].includes(analysis.geometryType)) {
                showNotification(`Layer "${layer.title}" eignet sich für eine Choroplethenkarte.`, false)
            }
            if (analysis?.geometryType === 'Point' || analysis?.geometryType === 'MultiPolygon') {
                showNotification(`Layer "${layer.title}" eignet sich für eine Heatmap.`, false)
            }
            //console.log(layers)
            setVisibleFeatures(data.features)
        } catch (e) {
            console.error('Fehler beim Laden des Layers:', e)
        }
        // console.log('Gewählter Layer:', layer)
    }

    const displayedFeatures = isFiltered
        ? layers.flatMap(l => l.data?.features ?? []).filter(f => filterableFIDs.includes(f.id))
        : layers.flatMap(l => l.data?.features ?? [])

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

    function showNotification(message, isError) {
        const id = `notif-${Date.now()}`
        setNotification(prev => [...(prev || []), { id, message, isError }])
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
            <div style={{ flex: 1, position: 'relative', minWidth: 0, overflow: 'hidden' }}>
                <div className="toolbar">
                    <button onClick={() => setView('map')}>🌍︎</button>
                    <button onClick={() => setView('table')}>▦</button>
                    <button onClick={toggleTheme}>{theme === 'dark' ? '☀' : '🌙︎'}</button>
                </div>
                {view === 'map' && (
                    <>
                    <div className="notification-container">
                    {notification && notification.map(n => (
                        <div className="notification" key={n.id} style={{ borderLeft: n.isError ? "10px solid #f38ba8" : 'unset'}}>
                            {n.message}
                        </div>
                    ))}
                    </div>
                    <MapContainer
                        center={[51.505, -0.39]}
                        zoom={5}
                        style={{ height: '100vh' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="© OpenStreetMap contributors"
                        />
                        {[...layers].reverse().map((layer, index) => {
                            const choroplethColumn = choropleths[layer.id]
                            const features = layer.data.features
                            const values = choroplethColumn
                                ? features.map(f => f.properties[choroplethColumn]).filter(v => v != null)
                                : []
                            const min = Math.min(...values)
                            const max = Math.max(...values)

                            const isHeatmap = heatmaps[layer.id]
                            const points = isHeatmap
                                ? layer.data.features
                                .filter(f => f.geometry?.coordinates)
                                .map(f => [
                                    f.geometry.coordinates[1],
                                    f.geometry.coordinates[0]
                                ])
                                : []
                            return (
                                <React.Fragment key={`${layer.id}-${index}`}>
                                    {!isHeatmap &&  isFiltered && (
                                    <GeoJSON
                                        key={`${layer.id}-${layer.color}-${filterableFIDs.join()}`}
                                        data={{ type:'FeatureCollection',
                                                features: layer.data.features.filter(f => filterableFIDs.includes(f.id)) }}
                                        pointToLayer={(feature, latlng) => L.circleMarker(latlng, {
                                            radius: 6,
                                            color: layer.color,
                                            fillColor: layer.color,
                                            fillOpacity: 0.7
                                        })}
                                        style={feature => {
                                            if (!choroplethColumn) return { color: layer.color, fillColor: layer.color, fillOpacity: 0.4 }
                                            const value = feature.properties[choroplethColumn]
                                            const opacity = getChoroplethOpacity(value, min, max)
                                            return { color: layer.color, fillColor: layer.color, fillOpacity: opacity }
                                        }}
                                        onEachFeature={onEachFeature}
                                    />)}
                                    {!isHeatmap &&  !isFiltered && (
                                    <GeoJSON
                                        key={`${layer.id}-${layer.color}-${choroplethColumn}`}
                                        data={{ type:'FeatureCollection',
                                                features: layer.data.features }}
                                        pointToLayer={(feature, latlng) => L.circleMarker(latlng, {
                                            radius: 6,
                                            color: layer.color,
                                            fillColor: layer.color,
                                            fillOpacity: 0.7
                                        })}
                                        style={feature => {
                                            if (!choroplethColumn) return { color: layer.color, fillColor: layer.color, fillOpacity: 0.4 }
                                            const value = feature.properties[choroplethColumn]
                                            const opacity = getChoroplethOpacity(value, min, max)
                                            return { color: layer.color, fillColor: layer.color, fillOpacity: opacity }
                                        }}
                                        onEachFeature={onEachFeature}
                                    />)}
                                    {isHeatmap && <HeatmapLayer key={layer.id} points={points} />}
                                </React.Fragment>

                        )})}
                        <MapController selectedFeature={selectedFeature}
                                        selectedLayer={selectedLayer}
                                        setSelectedFeature={setSelectedFeature}
                                        setSelectedLayer={setSelectedLayer}
                                        setVisibleFeatures={setVisibleFeatures}
                                        view={view}
                                        layers={layers} />
                    </MapContainer>
                    <div style={{ position: 'absolute', bottom: '1rem', right: 0, zIndex: 1000 }}> 
                        <CollapsiblePanel hasData={layers.length > 0}>
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