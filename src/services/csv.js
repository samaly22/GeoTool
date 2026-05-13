import wellknown from 'wellknown'

function findGeometryKey(obj) {
    return Object.keys(obj).find(key => {
        return obj[key].includes('POLYGON') ||
                obj[key].includes('POINT') ||
                obj[key].includes('LINESTRING')
    })
}

export async function readCSV(file) {

    if (!file) return null

    return new Promise((resolve, reject) => {
        const reader =  new FileReader()
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
                const geomKey = findGeometryKey(obj)
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
            resolve ({
                type: 'FeatureCollection',
                features: data
            })
        }
        reader.onerror = () => reject(new Error('Fehler beim Lesen'))
        reader.readAsText(file)
    })
}