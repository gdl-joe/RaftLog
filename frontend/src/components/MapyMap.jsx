import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// mapy.cz Outdoor-Tiles. Key wird im Backend in config.php gesetzt
// und im Frontend zur Laufzeit aus dem `<meta name="mapy-key">` gelesen (gesetzt vom HTML).
// Vorerst Fallback auf OSM, wenn kein Key gesetzt ist.
const MAPY_TILE = (key) => `https://api.mapy.cz/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=${key}`;
const OSM_TILE  = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

function getMapyKey() {
  const m = document.querySelector('meta[name="mapy-key"]');
  return m ? m.content : '';
}

export default function MapyMap({ trip, tracks = [] }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapEl.current) return;
    if (mapRef.current) return;

    const map = L.map(mapEl.current, { zoomControl: true });
    mapRef.current = map;

    const key = getMapyKey();
    const url = key ? MAPY_TILE(key) : OSM_TILE;
    L.tileLayer(url, {
      maxZoom: 18,
      attribution: key
        ? '© <a href="https://mapy.cz/">Mapy.cz</a>, ©&nbsp;Seznam.cz, a.s.'
        : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Wenn der Container vorher nicht sichtbar war (Tab-Wechsel), kennt Leaflet
    // die Größe noch nicht — kurz nach Mount neu berechnen
    setTimeout(() => map.invalidateSize(), 50);
    setTimeout(() => map.invalidateSize(), 300);

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Inhalte (Tracks + Marker) bei jeder Änderung neu zeichnen
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Alte Layer entfernen (außer Tile-Layer)
    map.eachLayer(l => {
      if (l._url) return; // Tile-Layer behalten
      map.removeLayer(l);
    });

    const bounds = L.latLngBounds([]);

    // Tracks als Polylinien
    tracks.forEach(t => {
      const pts = t.points || (t.points_json ? JSON.parse(t.points_json) : []);
      if (!pts.length) return;
      const latlngs = pts.map(p => [p.lat, p.lng]);
      L.polyline(latlngs, {
        color: '#14b8a6', weight: 4, opacity: 0.9, lineJoin: 'round',
      }).addTo(map);
      latlngs.forEach(ll => bounds.extend(ll));
    });

    // Ein-/Ausstieg-Marker
    const startIcon = L.divIcon({
      className: '', html: '<div style="background:#22c55e;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);font-size:11px;font-weight:600">A</div>',
      iconAnchor: [12, 12],
    });
    const endIcon = L.divIcon({
      className: '', html: '<div style="background:#ef4444;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);font-size:11px;font-weight:600">B</div>',
      iconAnchor: [12, 12],
    });
    if (trip.put_in_lat) {
      L.marker([trip.put_in_lat, trip.put_in_lng], { icon: startIcon }).addTo(map);
      bounds.extend([trip.put_in_lat, trip.put_in_lng]);
    }
    if (trip.take_out_lat) {
      L.marker([trip.take_out_lat, trip.take_out_lng], { icon: endIcon }).addTo(map);
      bounds.extend([trip.take_out_lat, trip.take_out_lng]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] });
    } else {
      map.setView([51.5, 10], 6); // Deutschland-Mitte
    }
  }, [trip, tracks]);

  return <div ref={mapEl} className="w-full h-full" />;
}
