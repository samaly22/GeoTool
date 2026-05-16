import { useState } from 'react'
import { fetchCapabilities } from '../services/wfs.js'
import { fetchGeoJSON } from '../services/geojson.js'
import MetaData from './metaData.jsx'
import { readCSV } from '../services/csv.js'

function Sidebar({ onLayerSelect, onUrlChange, selectedLayer, onDataLoad, activeLayers, removeLayer, updateColor, choropleths, setChoropleth }) {
  const [url, setUrl] = useState('')
  const [layers, setLayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('wfs')
  const [showActiveLayers, setShowActiveLayers] = useState(true)
  const [showAllLayers, setShowAllLayers] = useState(true)
  const [expandedMeta, setExpandedMeta] = useState({})

  async function handleLoad() {
    setLoading(true)
    setError(null)
    //console.log(url)
    if (activeTab === 'geoJSON') {
      try {
        console.log('handleLoad aufgerufen', url)
        const result = await fetchGeoJSON(url)
        onDataLoad(result.geojson, result.title ?? url, url, 'geojson')
      } catch (e) {
        setError('Verbindung fehlgeschlagen. Prüfe die URL.')
      }
    } else if (activeTab === 'wfs'){
      try {
        const result = await fetchCapabilities(url)
        setLayers(result)
        if (result.length === 1) {
          onLayerSelect(result[0])
        }
      } catch (e) {
        setError('Verbindung fehlgeschlagen. Prüfe die URL.')
      }
    }
    setLoading(false)
  }

  //console.log(activeLayers)
  return (
    <div style={{ width: '300px', padding: '1rem', overflowY: 'auto', background: '#f4f4f4' }}>
      <h2>GeoDataExplorer</h2>



      <button onClick={() => {
        setActiveTab('wfs')
        setUrl('')
        }}>WFS</button>
      <button onClick={() => {
        setActiveTab('geoJSON')
        setUrl('')
        }}>GeoJSON</button>
      <button onClick={() => setActiveTab('csv')}>CSV</button>
      {activeTab === 'wfs' &&
      <div>
        <input
          type="text"
          placeholder="WFS URL eingeben..."
          value={url}
          onChange={e => {
              setUrl(e.target.value)
              onUrlChange(e.target.value)
          }}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        <button onClick={handleLoad} disabled={loading}>
          {loading ? 'Lade...' : 'Load'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
      }
      {activeTab === 'geoJSON' &&
      <div>
        <input
          type="text"
          placeholder="GeoJSON URL eingeben..."
          value={url}
          onChange={e => {
              setUrl(e.target.value)
              onUrlChange(e.target.value)
          }}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        <button onClick={handleLoad} disabled={loading}>
          {loading ? 'Lade...' : 'Load'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
      }
      {activeTab === 'csv' &&
      <div>
        <input type="file" accept=".csv" onChange={async (e) => {
          try {
            setLoading(true)
            setError(null)
            const file = e.target.files[0]
            const result = await readCSV(file)
            onDataLoad(result, file.name, null, 'csv')
          } catch (e) {
            setError(e.message)
          }
          setLoading(false)
          }} />
          {error && <p style={{ color: 'red' }}>{error}</p>}
      </div> 
      }

      {activeLayers.length > 0 && (
        <div>
          <div onClick={() => setShowActiveLayers(p => !p)} style={{ cursor: 'pointer', fontWeight: 'bold' }} >
            {showActiveLayers ? '▾' : '▸'} Ausgewählte Layer
          </div>
          {showActiveLayers && activeLayers.map(layer => (
            <div key={layer.id} style={{ borderBottom: '1px solid #ccc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem' }}>
                <span>{layer.name}</span>
                <div>
                  <input type="color" value={layer.color} onChange={(e) => updateColor(layer.id, e.target.value)}></input>
                  <button onClick={() => setExpandedMeta(prev => ({ ...prev, [layer.id]: !prev[layer.id] }))}>ℹ</button>
                  <button onClick={() => removeLayer(layer.id)}>✕</button>
                </div>
              </div>
              {layer.analysis?.numericColumns.length > 0 &&
              ['Polygon', 'MultiPolygon'].includes(layer.analysis?.geometryType) && (
                <div style={{ padding: '0.4rem' }}>
                  <select onChange={(e) => setChoropleth(layer.id, e.target.value)} defaultValue="">
                    <option value="" disabled>Spalte wählen...</option>
                    {layer.analysis.numericColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div> 
              )}
              {expandedMeta[layer.id] && <MetaData layer={layer} />}
            </div> 
          ))}
        </div>
      )}

      {layers.length > 0 &&
        <div>
          <div onClick={() => setShowAllLayers(p => !p)} style={{ cursor: 'pointer', fontWeight: 'bold' }} >
            {showAllLayers ? '▾' : '▸'} Alle Layer
          </div>
          {showAllLayers && layers.map((layer, index) => (
            <li key={index} onClick={() => onLayerSelect(layer)} style={{ cursor: 'pointer', padding: '0.4rem', borderBottom: '1px solid #ccc', listStyle: 'none' }} >
              {layer.title}
            </li> 
          ))}
        </div>
      }
    </div>
  )
}

export default Sidebar