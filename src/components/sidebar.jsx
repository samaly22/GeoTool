import { useState } from 'react'
import { fetchCapabilities } from '../services/wfs.js'
import { fetchGeoJSON } from '../services/geojson.js'
import MetaData from './metaData.jsx'
import { readCSV } from '../services/csv.js'

function Sidebar({ onLayerSelect, onUrlChange, selectedLayer, onDataLoad }) {
  const [url, setUrl] = useState('')
  const [layers, setLayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('wfs')

  async function handleLoad() {
    setLoading(true)
    setError(null)
    //console.log(url)
    if (activeTab === 'geoJSON') {
      try {
        console.log('handleLoad aufgerufen', url)
        const result = await fetchGeoJSON(url)
        onDataLoad(result)
      } catch (e) {
        setError('Verbindung fehlgeschlagen. Prüfe die URL.')
      }
    } else if (activeTab === 'wfs'){
      try {
        const result = await fetchCapabilities(url)
        setLayers(result)
      } catch (e) {
        setError('Verbindung fehlgeschlagen. Prüfe die URL.')
      }
    }
    setLoading(false)
  }

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
            const result = await readCSV(e.target.files[0])
            onDataLoad(result)
          } catch (e) {
            setError(e.message)
          }
          setLoading(false)
          }} />
          {error && <p style={{ color: 'red' }}>{error}</p>}
      </div> 
      }


      <MetaData layer={selectedLayer} />
      <ul style={{ marginTop: '1rem', paddingLeft: 0, listStyle: 'none' }}>
        {layers.map((layer, index) => (
          <li
            key={index}
            onClick={() => onLayerSelect(layer)}
            style={{ cursor: 'pointer', padding: '0.4rem', borderBottom: '1px solid #ccc' }}
          >
            {layer.title}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Sidebar