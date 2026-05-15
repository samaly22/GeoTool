export async function fetchGeoJSON(url) {
    const response = await fetch(url)
    const data = await response.json()

    if (data.features) {
        return { geojson: data, title: null }
    } else if (data.links) {
        const title = data.title ?? null
        const itemsLink = data.links.find(link => link.rel === 'items' && link.type === 'application/geo+json')
        if (itemsLink) {
            const result = await fetchGeoJSON(itemsLink.href)
            return { geojson: result.geojson, title: result.title ?? title }
        }
    }
}