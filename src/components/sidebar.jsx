import { useState } from 'react'
import { fetchCapabilities } from '../services/wfs.js'
import MetaData from './metaData.jsx'

function Sidebar({ onLayerSelect, onUrlChange, selectedLayer }) {
  const [url, setUrl] = useState('')
  const [layers, setLayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleLoad() {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchCapabilities(url)
      setLayers(result)
    } catch (e) {
      setError('Verbindung fehlgeschlagen. Prüfe die URL.')
    }
    setLoading(false)
  }

  return (
    <div style={{ width: '300px', padding: '1rem', overflowY: 'auto', background: '#f4f4f4' }}>
      <h2>WFS Explorer</h2>
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