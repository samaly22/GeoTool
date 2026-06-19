import proj4 from 'proj4'
import config from '../config.json'

// Definiert das Koordinatenreferenzsystem ESPG:25833 (UTM Zone 33N) für die spätere Umrechnung
proj4.defs('EPSG:25833', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')

// Entfernt vorhandene WFS-Standardparamater aus der URL, um Konflikte beim Neuaufbau von Anfragen zu vermeiden
function cleanUrl(url) {
  const parsed = new URL (url)
  parsed.searchParams.delete("SERVICE")
  parsed.searchParams.delete("REQUEST")
  parsed.searchParams.delete("service")
  parsed.searchParams.delete("request")
  return parsed.toString()
}

// Wandelt alle Geometrien einer GeoJSON-FeatureCollection in das Standard-WGS84-System (ESPG:4326)
function reprojectGeoJSON(data, fromEPSG) {
  const from = `EPSG:${fromEPSG}`
  const to = 'EPSG:4326'
  const converted = data.features.map(feature => ({
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: reprojectCoords(feature.geometry.coordinates, from, to)
    }
  }))
  return { ...data, features: converted}
}

// Hilfsfunktion
function reprojectCoords(coords, from, to) {
  if (typeof coords[0] === 'number') {
    return proj4(from, to, coords)
  }
  return coords.map(c => reprojectCoords(c, from, to))
}

// Fragt die Capabilities eines WFS-Dienstes ab und extrahiert die verfügbaren Layer und JSON-Formate
export async function fetchCapabilities(url) {
  const newUrl = cleanUrl(url)
  const binding = (newUrl.includes('?')) ? '&' : '?'
  const capUrl = `${newUrl}${binding}SERVICE=WFS&REQUEST=GetCapabilities`
  //console.log(capUrl)
  const response = await fetch(capUrl)
  //console.log(response.status)
  const text = await response.text()
  //console.log(text)

  // Parst die Serverantowrt als XML-Dokument
  const parser = new DOMParser()
  const xml = parser.parseFromString(text, 'application/xml')
  //console.log(xml.getElementsByTagNameNS('*', 'Operation')[0])

  // Validiert, ob die Antwort ein gültiges WFS-XML-Format besitzt
  const isXml = xml.getElementsByTagNameNS('*', 'FeatureType').length > 0 || xml.getElementsByTagNameNS('*', 'WFS_Capabilities').length > 0
  if (!isXml) throw new Error('WRONG_FORMAT')

  // Sucht im XML nach allen Ausgabeformaten, die JSON enthalten
  const featureTypes = xml.getElementsByTagNameNS('*', 'FeatureType')
  const formats = new Set()
  const formatElements = xml.getElementsByTagNameNS('*', 'Format')
  const valueElements = xml.getElementsByTagNameNS('*', 'Value')
  for ( const el of formatElements ) {
    if (el.textContent.toLowerCase().includes('json')) formats.add(el.textContent)
  }
  for ( const el of valueElements ) {
    if (el.textContent.toLowerCase().includes('json')) formats.add(el.textContent)
  }

  // Extrahiert Metadaten (Name, Titel, BoundingBox) für jeden verfügbaren Layer
  const layers = []
  for (let i = 0; i < featureTypes.length; i++) {
    const name = featureTypes[i].getElementsByTagNameNS('*', 'Name')[0]?.textContent
    const title = featureTypes[i].getElementsByTagNameNS('*', 'Title')[0]?.textContent
    const abstract = featureTypes[i].getElementsByTagNameNS('*', 'Abstract')[0]?.textContent    
    const lowerCorner = featureTypes[i].getElementsByTagNameNS('*', 'LowerCorner')[0].textContent
    const upperCorner = featureTypes[i].getElementsByTagNameNS('*', 'UpperCorner')[0].textContent
    const boundingBox = { lowerCorner, upperCorner }
    // const outputFormatsElement = featureTypes[i].getElementsByTagNameNS('*', 'OutputFormats')[0]
    // const formatElements = outputFormatsElement?.getElementsByTagNameNS('*', 'Format')
    // const formats = new Set()
    // for ( let j = 0; j < formatElements?.length; j++) {
    //   formats.add(formatElements[j].textContent)
    // }
    if (name) layers.push({ name, title: title || name, boundingBox, abstract, formats })
  }
  return layers
}

// Lädt die eigentlichen Geodaten eines spezifischen Layers und korrigiert bei Bedarf das Koordinatensystem
export async function fetchFeatures(url, layerName, outputFormats) {
  const newUrl = cleanUrl(url)
  const binding = (newUrl.includes('?')) ? '&' : '?'
  //console.log([...outputFormats])
  //const format = outputFormats.includes('application/geo+json') ? 'application/geo%2Bjson' : 'application/json'

  // Wählt das erste verfügbare JSON-Formate
  const format = outputFormats.values().next().value.replace('+', '%2B')
  const featureUrl = `${newUrl}${binding}SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=${layerName}&outputFormat=${format}&SRSNAME=EPSG:4326&count=${config.initialFeaturesSize}`

  //console.log(featureUrl)
  const response = await fetch(featureUrl)
  const data = await response.json()

  // Prüft, das CRS der Antowrt und stößt die Umwandlung an, falls es nicht ESPG:4326 ist
  const crs =  data.crs?.properties?.name
  if (crs && !crs.includes('4326')) {
    const epsgCode = crs.split('::')[1]
    return reprojectGeoJSON(data, epsgCode)
  }

  return data
}