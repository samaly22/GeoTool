import { useState } from 'react'

function TableView({ layers, activeTableLayer, setActiveTableLayer }) {
    if (!layers || layers.length === 0) {
        return (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <p>Keine Daten geladen. Wähle einen Datensatz aus.</p>
            </div>
        )
    }


    const [sortKey, setSortKey] = useState(null)
    const [sortDir, setSortDir] = useState('asc')
    const currentLayer = layers.find(l => l.id === activeTableLayer) ?? layers[0]
    const features = currentLayer.data.features
    const columns = features.length > 0 ? Object.keys(features[0].properties) : []
    const sorted = [...features].sort((a, b) => {
        if (!sortKey) return 0
        const valA = a.properties[sortKey]
        const valB = b.properties[sortKey]
        if (valA < valB) return sortDir === 'asc' ? -1 : 1
        if (valA > valB) return sortDir === 'asc' ? 1 : -1
        return 0
    })

    function handleSort(key) {
        if (sortKey === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDir('asc')
        }
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-sidebar)' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                {layers.map(layer => (
                    <button
                        key={layer.id}
                        onClick={() => setActiveTableLayer(layer.id)}
                        style={{
                            padding: '0.5rem 1rem',
                            fontWeight: layer.id === currentLayer.id ? 'bold' : 'normal',
                            borderBottom: layer.id === currentLayer.id ? '2px solid var(--accent)' : '2px solid transparent',
                            color: layer.id === currentLayer.id ? 'var(--accent)' : 'var(--text-secondary)' }}
                    >
                        {layer.title}
                    </button>    
                ))}
            </div>
            <div style={{overflowY: 'auto', flex: 1, padding: '0.5rem'}}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col} onClick={() => handleSort(col)} style={{ cursor: 'pointer' }}>
                                    {col} {sortKey === col ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((feature, index) => (
                            <tr key={index}>
                                {columns.map(col => (
                                    <td key={col}>
                                        {typeof feature.properties[col] === 'string' && feature.properties[col].startsWith('<')
                                            ? '[HTML]'
                                        : feature.properties[col]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    )
}

export default TableView