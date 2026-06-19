import config from '../config.json'

// Lädt GeoJSON-Daten von einer URL. Untersützt zwei Fälle: direkte FeatureCollections und OGC-API-Antworten mit Links.
// Im zweiten Fall wird der items-Endpunkt ermittelt und rekursiv abgerufen.
// Gibt ein Objekt mit geojson und title zurück.
export async function fetchGeoJSON(url) {
    const response = await fetch(url)
    let data

    // Versuch Antwort als JSON zu parsen; bricht ab, bei Fehlschlag und wirft Fehler 
    try {
        data = await response.json()
    } catch (e) {
        throw new Error('WRONG_FORMAT')
    }

    if (!data.features && !data.links) throw new Error('WRONG_FORMAT')

    // Wenn direkte Features enthalten sindm wird das GeoJSON direkt zurückgegeben
    if (data.features) {
        return { geojson: data, title: null }
    // Wenn Links vorhanden sind, wird nach dem eigentlichen GeoJSON-Endpunkt gesucht
    } else if (data.links) {
        const title = data.title ?? null
        const itemsLink = data.links.find(link => link.rel === 'items' && link.type === 'application/geo+json')

        // Wenn GeoJSON-Link existiert, wird die URL mit dem Limit aus der Config aufgerufen
        if (itemsLink) {
            const itemsURL = new URL(itemsLink.href)
            itemsURL.searchParams.set('limit', config.initialFeaturesSize)
            const result = await fetchGeoJSON(itemsURL.toString())
            return { geojson: result.geojson, title: result.title ?? title }
        }
    }
}