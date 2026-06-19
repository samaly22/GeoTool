import { useState } from 'react'

// Zeigt eine filterbare und selktiertbare Liste von GeoJSON-Features mit deren Attributen in Tabellenform.
// Einzelne Features können per Checkbox markiert und anschließend als Kartenfilter gesetzt werden.
function AttributesTable({ features, handleOnClick, filterableFIDs, setFilterableFIDs, isFiltered, setIsFiltered, change, selectAll }) {

    if (!features) {
        return null
    }

    return (
        <div style={{
            width: '350px',
            maxHeight: '75vh',
            overflowY: 'auto',
            background: 'var(--bg-sidebar)',
            border: '1px solid var(--border)',
            padding: '0.75rem' }}>
            <h2>Übersicht</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox"
                        checked={(filterableFIDs.length === features.length)} // Kontrolliert den Zustand
                        onChange={(e) => selectAll()} // Behandelt Änderungen
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Alle</span>
                </div>
                <button onClick={() => {if (filterableFIDs.length != 0) setIsFiltered(!isFiltered)}}>
                    {isFiltered ? 'Filter auflösen' : 'Filtern'}
                </button>
            </div>
            {features.map((feature, index) =>
                <div key={index}
                    onClick={() => {
                        //console.log('Klick')
                        handleOnClick(feature)}}
                    style={{marginBottom: '0.75rem',
                            padding: '0.75rem',
                            background: 'var(--bg-sidebar-item)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem' }}
                >
                    <div onClick={(e) => e.stopPropagation()} style={{ paddingTop: '0.2rem' }}>
                        <input
                        type="checkbox"
                        checked={filterableFIDs.includes(feature.id)} // Kontrolliert den Zustand
                        onChange={(e) => change(feature.id)} // Behandelt Änderungen
                        />
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Key</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            { (Object.entries(feature.properties)).map(([key, value]) =>
                            <tr key={key}>
                                <td style={{ fontWeight: 'bold' }}>{key}</td>
                                <td>{value}</td>
                            </tr>
                            )}            
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default AttributesTable