import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function createFinderMap(element, { onPin, onSelect, onTileError, popup }) {
  const map = L.map(element, { scrollWheelZoom: false }).setView([1.3521, 103.8198], 11);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).on('tileerror', onTileError).addTo(map);
  L.control.scale({ imperial: false }).addTo(map);

  const originLayer = L.layerGroup().addTo(map);
  const resultsLayer = L.layerGroup().addTo(map);
  const markers = new Map();
  let pinMode = false;

  const icon = (label, type) => L.divIcon({
    className: `finder-marker finder-marker-${type}`,
    html: label,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

  map.on('click', (event) => {
    if (pinMode) onPin([event.latlng.lat, event.latlng.lng]);
  });

  return {
    setPinMode(enabled) {
      pinMode = enabled;
      element.classList.toggle('picking-origin', enabled);
    },
    useCentre() {
      const centre = map.getCenter();
      onPin([centre.lat, centre.lng]);
    },
    drawOrigin(origin, radius) {
      originLayer.clearLayers();
      if (!origin) return;
      const circle = L.circle(origin.point, {
        radius: radius * 1000, color: '#28766f', weight: 2, fillOpacity: 0.08, interactive: false,
      }).addTo(originLayer);
      L.marker(origin.point, { icon: icon('◆', 'origin'), title: 'Search origin', zIndexOffset: 500 })
        .addTo(originLayer);
      map.fitBounds(circle.getBounds(), { padding: [20, 20], animate: false, maxZoom: 16 });
    },
    drawResults(results) {
      resultsLayer.clearLayers();
      markers.clear();
      results.forEach((option, index) => {
        const name = option.centre.name;
        const marker = index < 5
          ? L.marker(option.centre.point, { icon: icon(String(index + 1), 'rank'), title: name, alt: name, zIndexOffset: 250 - index })
          : L.circleMarker(option.centre.point, { radius: 5, weight: 1, color: '#284a59', fillOpacity: 0.75 });
        marker.addTo(resultsLayer).bindPopup(popup(option))
          .on('click', () => onSelect(option.code, index < 5));
        markers.set(option.code, marker);
      });
    },
    showResult(code) {
      markers.get(code)?.openPopup();
    },
  };
}
