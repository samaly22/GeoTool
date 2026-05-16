function TableView({ layers, activeTableLayer, setActiveTableLayer }) {
    if (!layers) {
        return (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <p>Keine Daten geladen. Wähle einen Datensatz aus.</p>
            </div>
        )
    }

    const currentLayer = layers.find(l => l.id === activeTableLayer) ?? layers[0]

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
                Tabelle für {currentLayer.title}
            </div>

        </div>
    )
}

export default TableView