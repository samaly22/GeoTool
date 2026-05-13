export async function fetchGeoJSON(url) {
    const response = await fetch(url)
    const data = await response.json()

    if (data.features) {
        return data
    } else if (data.links) {
        const itemsLink = data.links.find(link => link.rel === 'items' && link.type === 'application/geo+json')
        if (itemsLink) {
            return await fetchGeoJSON(itemsLink.href)
        }
    }
}