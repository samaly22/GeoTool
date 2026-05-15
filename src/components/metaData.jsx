function MetaData ({ layer }) {
    if (!layer) return null

    const meta = layer.meta

    //console.log(layer.metadataURL)

    return (
        <div>
            <table>
                <tbody>
                    {meta?.name && <tr><td>Name:</td><td>{meta.name}</td></tr>}
                    {meta?.title && <tr><td>Titel:</td><td>{meta.title}</td></tr>}
                    {meta?.abstract && <tr><td>Beschreibung:</td><td>{meta.abstract}</td></tr>}
                    {meta?.boundingBox && <tr><td>Grenzen:</td><td>{meta.boundingBox.lowerCorner} / {meta.boundingBox.upperCorner}</td></tr>}
                    {layer.source && <tr><td>Quelle:</td><td>{layer.source.toUpperCase()}</td></tr>}
                    {layer.source === 'csv'
                        ? <tr><td>Datei:</td><td>{layer.name}</td></tr>
                        : <tr><td>URL:</td><td>{meta?.url ?? layer.name}</td></tr>
                    }
                    {meta?.formats && <tr><td>Formate:</td><td>{[ ...meta.formats].join('; ')}</td></tr>}
                </tbody>
            </table>
        </div>
    )

}

export default MetaData