import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api.js';
import { Loading } from '../atoms.jsx';
import { Icon, TripTypeIcon } from '../icons.jsx';

const TILE_KEY = '';
const OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function MapScreen({ go }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const [trips, setTrips] = useState(null);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    api.listTrips({ limit: 200 }).then(r => setTrips(r.items));
  }, []);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current);
    mapRef.current = map;
    L.tileLayer(OSM, { attribution: '© OpenStreetMap', maxZoom: 18 }).addTo(map);
    map.setView([51.3, 9.5], 6);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !trips) return;
    map.eachLayer(l => { if (!l._url) map.removeLayer(l); });

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

  if (!trips) return <Loading />;

  return (
    <div className="h-[calc(100vh-160px)] lg:h-[calc(100vh-100px)] flex flex-col -m-4 lg:-m-8">
      <div className="filter-bar p-3 lg:p-4 bg-bg-2 border-b border-border m-0">
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
      <div ref={mapEl} className="flex-1" />
    </div>
  );
}

function colorFor(type) {
  return { river: '#14b8a6', lake: '#3b82f6', cave: '#b8823a', portage: '#84cc16' }[type] || '#888';
}
function escape(s) { return String(s).replace(/[<>&"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' }[c])); }
