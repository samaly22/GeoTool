function AttributesTable({ geoJson, handleOnClick }) {
    if (!geoJson) {
        return null
    }

    return (
        <div style={{ width: '300px', padding: '1rem', overflowY: 'auto', background: '#f4f4f4' }}>
            <h2>Übersicht</h2>
            {geoJson.features.map((feature, index) =>
                <div key={index}
                    onClick={() => {
                        console.log('Klick')
                        handleOnClick(feature)}}
                    style={{ marginbottom: '0.75rem',
                                        background: '#ffffff',
                                        padding: '0.75rem',
                                        background: '#f4f4f4',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08'}}>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '0.25rem', color: '#666' }}>Key</th>
                                <th style={{ textAlign: 'left', padding: '0.25rem', color: '#666' }}>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            { (Object.entries(feature.properties)).map(([key, value]) =>
                            <tr key={key}>
                                <td style={{ padding: '0.25rem', color: '#444', fontWeight: 'bold' }}>{key}</td>
                                <td style={{ padding: '0.25rem', color: '#666' }}>{value}</td>
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