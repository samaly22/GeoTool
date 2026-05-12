function MetaData ({ layer }) {
    if (!layer) return null

    //console.log(layer.metadataURL)

    return (
        <div>
            <table>
                <tbody>
                    <tr>
                        <td>Name:</td>
                        <td>{layer.name}</td>
                    </tr>
                    <tr>
                        <td>Titel:</td>
                        <td>{layer.title}</td>
                    </tr>
                    <tr>
                        <td>Beschreibung:</td>
                        <td>{layer.abstract}</td>
                    </tr>
                    <tr>
                        <td>Grenzen:</td>
                        <td>{layer.boundingBox.lowerCorner} / {layer.boundingBox.upperCorner}</td>
                    </tr>
                    <tr>
                        <td>URL:</td>
                        <td><a href={layer.url} target="_blank">{layer.url}</a></td>
                    </tr>
                    <tr>
                        <td>Formate:</td>
                        <td>{[...layer.formats].join('; ')}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )

}

export default MetaData