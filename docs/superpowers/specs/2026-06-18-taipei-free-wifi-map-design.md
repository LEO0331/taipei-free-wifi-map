# Taipei Free Wi-Fi Map Design

## Architecture

The browser is a static client. It fetches `/data/wifi-hotspots.json` and `/data/wifi-summary.json`, then keeps language, active section, filters, and optional user location in React state. Pure utilities handle filtering, translation fallback, distance, URL construction, and summary generation.

Local TypeScript scripts own external data access. The fetch script stores the official CSV and provenance metadata. Conversion reads a supplied path or the newest raw CSV, emits normalized hotspot records and a conversion report, and the summary script regenerates aggregate JSON.

## Interface

The design uses a civic-cartography visual system: paper-colored panels, deep navy text, strong blue controls, vermilion location accents, restrained borders, and clear condensed labels. Mobile uses a sticky header, horizontally scrollable section tabs, compact filters, a tall map, and single-column results. Desktop expands to a two-column map-and-results composition.

## Components

The requested component names are implemented where they create a useful boundary. Closely coupled chart variants share one dashboard file to avoid component boilerplate. Leaflet marker creation and popups stay inside the map feature because they share lifecycle and cluster state.

## Data and errors

CSV parsing supports BOM, quoted fields, escaped quotes, commas, and line breaks. Missing and outlier coordinates are recorded without crashing. Fetch failures preserve existing raw files. Browser data-load and geolocation failures render bilingual user-facing messages.

## Testing

Small Node tests cover CSV parsing, normalization, coordinate validation, category mapping, filters, distance formatting, and summary totals. Production verification runs data conversion, tests, and `npm run build`, followed by browser checks at mobile and desktop sizes.

