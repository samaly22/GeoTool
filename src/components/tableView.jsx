import { useState } from 'react'

function TableView({ layers, activeTableLayer, setActiveTableLayer }) {
    if (!layers) {
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
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
                {layers.map(layer => (
                    <button
                        key={layer.id}
                        onClick={() => setActiveTableLayer(layer.id)}
                        style={{ padding: '0.5rem 1rem', fontWeight: layer.id === currentLayer.id ? 'bold' : 'normal' }}
                    >
                        {layer.title}
                    </button>    
                ))}
            </div>
            <div style={{overflowY: 'auto', flex: 1}}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col} onClick={() => handleSort(col)} style={{ cursor: 'pointer', padding: '0.5rem', borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                                    {col} {sortKey === col ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((feature, index) => (
                            <tr key={index}>
                                {columns.map(col => (
                                    <td key={col} style={{ padding: '0.4rem', borderBottom:'1px solid #eee' }}>
                                        {feature.properties[col]}
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