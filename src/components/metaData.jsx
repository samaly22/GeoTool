function MetaData (layer) {
    if (!layer) return null

    return (
        <div>
            <table>
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
                    <td>{layer.abtract}</td>
                </tr>
                <tr>
                    <td>Geo-Eingrenzung:</td>
                    <td>{layer.boundingBox}</td>
                </tr>
                <tr>
                    <td>Formate:</td>
                    <td>{layer.formats}</td>
                </tr>
            </table>
        </div>
    )

}

export default MetaData