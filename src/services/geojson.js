import config from '../config.json'

export async function fetchGeoJSON(url) {
    const response = await fetch(url)
    let data
    try {
        data = await response.json()
    } catch (e) {
        throw new Error('WRONG_FORMAT')
    }

    if (!data.features && !data.links) throw new Error('WRONG_FORMAT')

    if (data.features) {
        return { geojson: data, title: null }
    } else if (data.links) {
        const title = data.title ?? null
        const itemsLink = data.links.find(link => link.rel === 'items' && link.type === 'application/geo+json')
        if (itemsLink) {
            const itemsURL = new URL(itemsLink.href)
            itemsURL.searchParams.set('limit', config.initialFeaturesSize)
            const result = await fetchGeoJSON(itemsURL.toString())
            return { geojson: result.geojson, title: result.title ?? title }
        }
    }
}