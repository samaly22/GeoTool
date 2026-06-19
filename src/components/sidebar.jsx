import { useState } from 'react'
import { fetchCapabilities } from '../services/wfs.js'
import { fetchGeoJSON } from '../services/geojson.js'
import MetaData from './metaData.jsx'
import { readCSV } from '../services/csv.js'

// Verwaltet die Seitenleiste zum Laden von WFS, GeoJSON und CSV sowie zur Layer-Steuerung
function Sidebar({ onLayerSelect, onUrlChange, selectedLayer, onDataLoad, activeLayers, removeLayer, updateColor, choropleths, setChoropleth, heatmaps, toggleHeatmap, moveLayer }) {
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
    let success = false
    if (activeTab === 'geoJSON') {
      try {
        //console.log('handleLoad aufgerufen', url)
        const result = await fetchGeoJSON(url)
        onDataLoad(result.geojson, result.title ?? url, url, 'geojson')
        success = true
      } catch (e) {
        if (e.message === 'WRONG_FORMAT') {
          setError('Diese URL scheint keine GeoJSON-Daten zu sein. Prüfe das Format.')
        } else {
          setError('Verbindung fehlgeschlagen. Prüfe die URL.')
        }
      }
    } else if (activeTab === 'wfs'){
      try {
        const result = await fetchCapabilities(url)
        setLayers(result)
        if (result.length === 1) {
          onLayerSelect(result[0])
        }
        success = true
      } catch (e) {
        if (e.message === 'WRONG_FORMAT') {
          setError('Diese URL scheint kein WFS-Dienst zu sein. Prüfe das Format.')
        } else {
          setError('Verbindung fehlgeschlagen. Prüfe die URL.')
        }
      }
    }
    setLoading(false)
    if (success) setUrl('')
  }

  const tabStyle = (tab) => ({
    padding: '0.4rem 0.8rem',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
    background: 'transparent',
    color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontWeight: activeTab === tab ? 'bold' : 'normal'
  })

  //console.log(activeLayers)
  return (
    <div style={{
              width: '300px',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              background: 'var(--bg-sidebar)',
              color: 'var(--text-primary)',
              borderRight: '1px solid var(--border)' }}>
        <div style={{ padding: '1rem 1rem 0.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', color: 'var(--accent)', fontSize: '1.1rem', letterSpacing: '0.05em'}}>
            GeoDataExplorer
          </h2>

          {/* Tab-Navigation für die drei unterstützten Datenquellen */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '0.75rem'}}>
            <button style={tabStyle('wfs')} onClick={() => { setActiveTab('wfs'); setUrl('') }}>WFS</button>
            <button style={tabStyle('geoJSON')} onClick={() => { setActiveTab('geoJSON'); setUrl('') }}>GeoJSON</button>
            <button style={tabStyle('csv')} onClick={() => setActiveTab('csv')}>CSV</button>
          </div>

      {/* Laden für Netzwerk-URLs (WFS /  GeoJSON) */}
      {(activeTab === 'wfs'  || activeTab === 'geoJSON') && (
        <div>
          <input
            type="text"
            placeholder={ activeTab === 'wfs' ? "WFS URL eingeben..." : "GeoJSON URL eingeben..." }
            value={url}
            onChange={e => {
                setUrl(e.target.value)
                onUrlChange(e.target.value)
            }}
          />
        <button className="primary" onClick={handleLoad} disabled={loading}>
          {loading ? 'Lade...' : 'Laden'}
        </button>
        {error && <p style={{ color: '#f38ba8', fontSize: '0.85rem', marginTop: '0.4rem' }}>{error}</p>}
      </div>
      )}

      {/* Laden von CSV-Dateien */}
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
          {error && <p style={{ color: '#f38ba8', fontSize: '0.85rem' }}>{error}</p>}
      </div> 
      }

      {/* Anzeige aller auf der Karte geladenen Layer */}
      {activeLayers.length > 0 && (
        <div style={{ marginBottom: '1rem'}}>
          <div onClick={() => setShowActiveLayers(p => !p)} style={{
            cursor: 'pointer',
            fontWeight: 'bold',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '0.4rem 0' }}
          >
            {showActiveLayers ? '▾' : '▸'} Ausgewählte Layer
          </div>
          {showActiveLayers && activeLayers.map(layer => (
            <div key={layer.id} style={{ borderRadius: '6px', background: 'var(--bg-sidebar-item)', marginBottom: '0.4rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: layer.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{layer.title || layer.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                  <button className="icon-btn" onClick={() => moveLayer(layer.id, 'up')}>▲</button>
                  <button className="icon-btn" onClick={() => moveLayer(layer.id, 'down')}>▼</button>
                  <label style={{ width: '16px', height: '16px', borderRadius: '50%', background: layer.color, cursor: 'pointer', flexSchrink: 0, display: 'inline-böock' }}>
                    <input type="color" value={layer.color} onChange={(e) => updateColor(layer.id, e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}/>
                  </label>
                  <button className="icon-btn" onClick={() => setExpandedMeta(prev => ({ ...prev, [layer.id]: !prev[layer.id] }))}>ℹ</button>
                  <button className="icon-btn" onClick={() => removeLayer(layer.id)}>✕</button>
                </div>
              </div>

              {layer.analysis?.numericColumns.length > 0 &&
                ['Polygon', 'MultiPolygon'].includes(layer.analysis?.geometryType) && (
                <div style={{ padding: '0.3rem 0.6rem' }}>
                  <select onChange={(e) => setChoropleth(layer.id, e.target.value)} defaultValue="">
                    <option value="" disabled>Spalte wählen...</option>
                    {layer.analysis.numericColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              )}

              {['Point', 'MultiPoint'].includes(layer.analysis?.geometryType) && (
                <div style={{ padding: '0.3rem 0.6rem' }}>
                  <button onClick={() => toggleHeatmap(layer.id)} style={{ 
                    width: '100%',
                    background: heatmaps[layer.id] ? 'var(--accent)' : undefined,
                    color: heatmaps[layer.id] ? '#fff' : undefined }}
                  >
                    {heatmaps[layer.id] ? 'Heatmap deaktivieren' : 'Heatmap aktivieren'}
                  </button>
                </div>
              )}

              {expandedMeta[layer.id] && <MetaData layer={layer} />}
            </div> 
          ))}
        </div>
      )}

      {/* Anzeige aller Layer der zuletzt geladenen WFS-Datei */}
      {layers.length > 0 &&
        <div>
          <div onClick={() => setShowAllLayers(p => !p)} style={{
            cursor: 'pointer',
            fontWeight: 'bold',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '0.4rem 0' }}
          >
            {showAllLayers ? '▾' : '▸'} Alle Layer
          </div>
          {showAllLayers && layers.map((layer, index) => (
            <div key={index} onClick={() => onLayerSelect(layer)} style={{ 
              cursor: 'pointer',
              padding: '0.4rem 0.6rem',
              borderRadius: '4px',
              marginBottom: '0.2rem',
              background: 'var(--bg-sidebar-item)',
              border: '1px solid var(--border)',
              fontSize: '0.85rem' }} >
              {layer.title}
            </div> 
          ))}
        </div>
      }
      </div>
    </div>
  )
}

export default Sidebar