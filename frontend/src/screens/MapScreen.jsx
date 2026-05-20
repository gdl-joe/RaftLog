import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api.js';
import { Loading } from '../atoms.jsx';
import { TripTypeIcon } from '../icons.jsx';

const OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function MapScreen({ go }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const [trips, setTrips] = useState(null);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    api.listTrips({ limit: 200 }).then(r => setTrips(r.items));
  }, []);

  // Map immer initialisieren — unabhängig von Trips
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current);
    mapRef.current = map;
    L.tileLayer(OSM, { attribution: '© OpenStreetMap', maxZoom: 18 }).addTo(map);
    map.setView([51.3, 9.5], 6);
    setTimeout(() => map.invalidateSize(), 50);
    setTimeout(() => map.invalidateSize(), 300);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Marker rendern wenn Trips/Filter ändert
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !trips) return;

    // Nur Marker und Polylines entfernen, Tile-Layer behalten
    map.eachLayer(l => {
      if (l instanceof L.Marker || l instanceof L.Polyline) {
        map.removeLayer(l);
      }
    });

    const bounds = L.latLngBounds([]);
    const filtered = filterType ? trips.filter(t => t.trip_type === filterType) : trips;

    filtered.forEach(t => {
      const lat = t.put_in_lat;
      const lng = t.put_in_lng;
      if (!lat || !lng) return;
      const color = colorFor(t.trip_type);
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
        iconAnchor: [8, 8],
      });
      const marker = L.marker([lat, lng], { icon }).addTo(map);
      marker.bindPopup(`<strong>${escape(t.title)}</strong><br>${escape(t.water_name || '')}<br>${t.date_from}`);
      marker.on('click', () => go('detail', { id: t.id }));
      bounds.extend([lat, lng]);
    });

    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
  }, [trips, filterType, go]);

  const tripCount = trips?.length || 0;
  const withGps   = trips?.filter(t => t.put_in_lat).length || 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div className="filter-bar !mb-0">
          {['', 'river', 'lake', 'cave', 'portage'].map(t => (
            <button key={t} className={'filter-chip ' + (filterType === t ? 'active' : '')} onClick={() => setFilterType(t)}>
              {t === '' ? 'Alle' : (
                <>
                  <TripTypeIcon type={t} size={14} style={{ color: colorFor(t) }} />
                  {{ river: 'Fluss', lake: 'See', cave: 'Höhle', portage: 'Portage' }[t]}
                </>
              )}
            </button>
          ))}
        </div>
        {trips && (
          <span className="text-xs text-text-dim mono">
            {withGps} von {tripCount} mit Karten-Punkt
          </span>
        )}
      </div>

      <div className="relative">
        <div
          ref={mapEl}
          className="rounded-xl overflow-hidden border border-border"
          style={{ height: 'min(75vh, 700px)', minHeight: 400 }}
        />
        {!trips && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/70 backdrop-blur-sm rounded-xl pointer-events-none">
            <Loading label="Lade Befahrungen…" />
          </div>
        )}
      </div>
    </div>
  );
}

function colorFor(type) {
  return { river: '#14b8a6', lake: '#3b82f6', cave: '#b8823a', portage: '#84cc16' }[type] || '#888';
}
function escape(s) { return String(s).replace(/[<>&"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' }[c])); }
