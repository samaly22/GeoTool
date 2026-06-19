import wellknown from 'wellknown'

// Sucht im Objekt nach dem Schlüssel, der WKT-Geometriedaten (Polygon, Punkt, Linie) enthält
function findGeometryKey(obj) {
    return Object.keys(obj).find(key => {
        return obj[key].includes('POLYGON') ||
                obj[key].includes('POINT') ||
                obj[key].includes('LINESTRING')
    })
}

// Liest eine CSV-Datei asynchron ein und konvertiert sie in ein GeoJSON-Format jeden Datensatz in ein GeoJSON-Feature um.  
// Zeilen ohne Geometriespalte werden übersprungen.
// Gibt eine FeatureCollection zurück oder wirft einen Fehler, wenn keine darstellbaren Geodaten gefunden wurden.
export async function readCSV(file) {

    if (!file) return null

    return new Promise((resolve, reject) => {
        const reader =  new FileReader()

        // Verarbeitet den Dateiinhalt nach erfolgreichem Einlesen
        reader.onload = () => {
            const text = reader.result
            const rows = text.split(/\r?\n/).filter(r => r.trim() !== '')
            const headers = rows[0].split(';').map(h => h.trim().replace(/"/g, ''))
            const data = rows.slice(1).map(r => {
                const values = r.split(/;(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/"/g, ''))
                const obj = {}
                headers.forEach((h, i) => {
                    obj[h] = values[i]
                });

                // Identifiziert die Spalte mit Geometriedaten; bricht ab, falls keine existiert
                const geomKey = findGeometryKey(obj)
                if (!geomKey) return null

                const wkt = obj[geomKey].replace(/^SRID=\d+;/, '')
                const geometry = wellknown.parse(wkt)

                const properties = { ...obj}
                delete properties[geomKey]
                return {
                    type: 'Feature',
                    geometry,
                    properties
                }
            })
            //console.log(data)
            const features = data.filter(f => f !== null)
            //console.log(features)

            // Wirft einen Fehler, wenn keine gültigen Geodaten gefunden wurden
            if (features.length === 0) {
                reject(new Error('Datei enthält keine darstellbaren Geodaten!'))
                return
            }
            
            // Gibt die finale GeoJSON FeatureCollection zurück
            resolve ({
                type: 'FeatureCollection',
                features: features
            })
        }

        // Behandelt Fehler beim Einlesen der Datei
        reader.onerror = () => reject(new Error('Fehler beim Lesen'))
        reader.readAsText(file)
    })
}