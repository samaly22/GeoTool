# GeoDataExplorer

Ein webbasierter Explorer für Geodaten aus WFS-Diensten, GeoJSON-Quellen und CSV-Dateien.

## Voraussetzungen

- [Node.js](https://nodejs.org/) Version 22 oder höher

## Installation und Start

```bash
# Abhängigkeiten installieren
npm install

#Entwicklungsserver starten
npm run dev
```

Die Anwendung ist danach unter `http://localhost:5173` erreichbar.

## Beispieldateien

[Wetterdaten](https://maps.dwd.de/geoserver/dwd/ows)

[Bahnhöfe in Dresden](https://kommisdd.dresden.de/net3/public/ogcsl.ashx?nodeid=62&service=wfs&request=getcapabilities)

[Elbe-Überschwemmfläche](https://kommisdd.dresden.de/net3/public/ogcsl.ashx?nodeid=1371&service=wfs&request=getcapabilities)

[Arbeitslosigkeit Dresden](https://kommisdd.dresden.de/net3/public/ogcsl.ashx?nodeid=541&service=wfs&request=getcapabilities)

[Barrierefreie Haltestellen Dresden](https://kommisdd.dresden.de/net3/public/ogcsl.ashx?nodeid=1593&service=wfs&request=getcapabilities)

## Unterstützte Datenquellen

**WFS (Web Feature Service)**
URL eines WFS-Dienstes eingeben und auf Load klicken. Die verfügbaren Layer werden aufgelistet und können einzeln oder automatisch (bei nur einem Layer) geladen werden.

**GeoJSON**
URL einer GeoJSON-Datei oder eines OGC API Features Endpunktes eingeben. Der Titel wird automatisch ausgelesen wenn vorhanden.

**CSV**
Lokale CSV-Datei hochladen. EIne Spalte mit WKT-Geometrien wird automatisch erkannt und in GeoJSON umgewandelt.

## Funktionen

- Mehrere Layer gleichzeitig aus unterschiedlichen Quellen anzeigen
- Layer einzeln entfernen, einfärben und Reihenfolge verändern
- Metadaten pro Layer ausklappbar in der Sidebar
- Visualisierungsformen und deren Erkennung [Choropleth und Heatmap]
- (dynamische) Attributstabelle mit Filterung und Zoom auf Feature
- Tabellenansicht mit Sortierung pro Layer
- Dark/Light Mode

## Bekannte Einschränkungen

- Keine Zusammenfassung pro Spalte Datensatz

---

## Verwendete Bibliotheken

| Bibliothek | Lizenz |
|---|---|
| [React](https://react.dev/) | MIT |
| [Vite](https://vitejs.dev/) | MIT |
| [Leaflet](https://leafletjs.com/) | BSD-2-Clause |
| [react-leaflet](https://react-leaflet.js.org/) | MIT |
| [Proj4js](https://github.com/proj4js/proj4js) | MIT |
| [proj4leaflet](https://github.com/kartena/Proj4Leaflet) | MIT |
| [wellknown](https://github.com/mapbox/wellknown) | MIT |
| [leaflet.heat](https://github.com/Leaflet/Leaflet.heat) | MIT |

---

---

# GeoDataExplorer

A web-based explorer for geodata from WFS services, GeoJSON sources, and CSV files.

## Prerequisites

- [Node.js](https://nodejs.org/) version 22 or higher

## Installation and Startup

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The application is then accessible at `http://localhost:5173`.

## Sample Files

[Weather data](https://maps.dwd.de/geoserver/dwd/ows)

[Train stations in Dresden](https://kommisdd.dresden.de/net3/public/ogcsl.ashx?nodeid=62&service=wfs&request=getcapabilities)

[Elbe floodplain](https://kommisdd.dresden.de/net3/public/ogcsl.ashx?nodeid=1371&service=wfs&request=getcapabilities)

[Unemployment in Dresden](https://kommisdd.dresden.de/net3/public/ogcsl.ashx?nodeid=541&service=wfs&request=getcapabilities)

[Accessible bus stops in Dresden](https://kommisdd.dresden.de/net3/public/ogcsl.ashx?nodeid=1593&service=wfs&request=getcapabilities)

Translated with DeepL.com (free version)

## Supported Data Sources

**WFS (Web Feature Service)**
Enter the URL of a WFS service and click Load. The available layers are listed and can be loaded individually or automatically (if there is only one layer).

**GeoJSON**
Enter the URL of a GeoJSON file or an OGC API Features endpoint. The title is automatically extracted if available.

**CSV**
Upload a local CSV file. A column containing WKT geometries is automatically detected and converted to GeoJSON.

## Features

- Display multiple layers simultaneously from different sources
- Remove, color, and reorder layers individually
- Expandable metadata for each layer in the sidebar
- Visualization types and their recognition [Choropleth and Heatmap]
- (Dynamic) attribute table with filtering and zoom to feature
- Table view with sorting by layer
- Dark/Light Mode

## Known Limitations

- No summary per column in the dataset

---

## Libraries Used

| Library | License |
|---|---|
| [React](https://react.dev/) | MIT |
| [Vite](https://vitejs.dev/) | MIT |
| [Leaflet](https://leafletjs.com/) | BSD-2-Clause |
| [react-leaflet](https://react-leaflet.js.org/) | MIT |
| [Proj4js](https://github.com/proj4js/proj4js) | MIT |
| [proj4leaflet](https://github.com/kartena/Proj4Leaflet) | MIT |
| [wellknown](https://github.com/mapbox/wellknown) | MIT |
| [leaflet.heat](https://github.com/Leaflet/Leaflet.heat) | MIT |