import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

function HeatmapLayer({ points }) {
    const map =  useMap()

    useEffect(() => {
        if (!points || points.length === 0) return
        const heat = L.heatLayer(points, { radius: 25, blur: 15 })
        heat.addTo(map)
        return () => map.removeLayer(heat)
    }, [points, map])

    return null
}

export default HeatmapLayer