export async function fetchCapabilities(url) {
  const capUrl = `${url}?SERVICE=WFS&REQUEST=GetCapabilities`
  const response = await fetch(capUrl)
  const text = await response.text()
  const parser = new DOMParser()
  const xml = parser.parseFromString(text, 'application/xml')
  const featureTypes = xml.getElementsByTagName('FeatureType')
  const layers = []
  for (let i = 0; i < featureTypes.length; i++) {
    const name = featureTypes[i].getElementsByTagName('Name')[0]?.textContent
    const title = featureTypes[i].getElementsByTagName('Title')[0]?.textContent
    const lowerCorner = featureTypes[i].getElementsByTagNameNS('*', 'LowerCorner')[0].textContent
    const upperCorner = featureTypes[i].getElementsByTagNameNS('*', 'UpperCorner')[0].textContent
    const boundingBox = { lowerCorner, upperCorner }
    if (name) layers.push({ name, title: title || name, boundingBox })
  }
  return layers
}

export async function fetchFeatures(url, layerName) {
  const featureUrl = `${url}?SERVICE=WFS&REQUEST=GetFeature&TYPENAMES=${layerName}&outputFormat=application/json&count=500`
  const response = await fetch(featureUrl)
  const data = await response.json()
  console.log(data)
  return data
}