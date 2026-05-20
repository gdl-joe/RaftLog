import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from '../icons.jsx';

const OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const MAPY = (key) => `https://api.mapy.cz/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=${key}`;

function mapyKey() {
  const m = document.querySelector('meta[name="mapy-key"]');
  return m?.content || '';
}

const PIN_START = L.divIcon({
  className: '',
  html: '<div style="background:#22c55e;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5);font-size:13px;font-weight:700">A</div>',
  iconAnchor: [14, 14],
});
const PIN_END = L.divIcon({
  className: '',
  html: '<div style="background:#ef4444;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5);font-size:13px;font-weight:700">B</div>',
  iconAnchor: [14, 14],
});
const PIN_SINGLE = L.divIcon({
  className: '',
  html: '<div style="background:#14b8a6;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12Z"/></svg></div>',
  iconAnchor: [14, 28],
});

export default function MapPicker({ mode = 'start_end', value, onChange, defaultCenter = [51.3, 9.5], defaultZoom = 6 }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({ start: null, end: null, single: null });
  const lineRef = useRef(null);
  const [activeSlot, setActiveSlot] = useState(mode === 'single' ? 'single' : 'start');
  const [geocoding, setGeocoding] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  // Refs für aktuelle Werte — vermeidet veraltete Closures in map.on('click')
  const valueRef = useRef(value);
  const activeSlotRef = useRef(activeSlot);
  const onChangeRef = useRef(onChange);
  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { activeSlotRef.current = activeSlot; }, [activeSlot]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Map initialisieren (einmal)
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current);
    mapRef.current = map;

    const key = mapyKey();
    L.tileLayer(key ? MAPY(key) : OSM, {
      maxZoom: 18,
      attribution: key
        ? '© <a href="https://mapy.cz/">Mapy.cz</a>'
        : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.setView(defaultCenter, defaultZoom);

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      const v = { ...(valueRef.current || {}) };
      const slot = activeSlotRef.current;

      if (mode === 'single' || slot === 'single') {
        v.lat = round(lat); v.lng = round(lng);
        onChangeRef.current?.(v);
        return;
      }
      if (slot === 'start') {
        v.start_lat = round(lat); v.start_lng = round(lng);
        onChangeRef.current?.(v);
        // Wenn B noch nicht gesetzt, automatisch auf B umschalten
        if (v.end_lat == null) setActiveSlot('end');
      } else {
        v.end_lat = round(lat); v.end_lng = round(lng);
        onChangeRef.current?.(v);
      }
    });

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Marker bei value-Änderung neu zeichnen
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const v = value || {};
    const m = markersRef.current;

    if (m.start)  { map.removeLayer(m.start);  m.start  = null; }
    if (m.end)    { map.removeLayer(m.end);    m.end    = null; }
    if (m.single) { map.removeLayer(m.single); m.single = null; }
    if (lineRef.current) { map.removeLayer(lineRef.current); lineRef.current = null; }

    const bounds = L.latLngBounds([]);

    if (mode === 'single') {
      if (v.lat != null && v.lng != null) {
        m.single = L.marker([v.lat, v.lng], { icon: PIN_SINGLE, draggable: true })
          .on('dragend', (e) => {
            const ll = e.target.getLatLng();
            onChangeRef.current?.({ ...(valueRef.current || {}), lat: round(ll.lat), lng: round(ll.lng) });
          })
          .addTo(map);
        bounds.extend([v.lat, v.lng]);
      }
    } else {
      if (v.start_lat != null) {
        m.start = L.marker([v.start_lat, v.start_lng], { icon: PIN_START, draggable: true })
          .on('dragend', e => {
            const ll = e.target.getLatLng();
            onChangeRef.current?.({ ...(valueRef.current || {}), start_lat: round(ll.lat), start_lng: round(ll.lng) });
          })
          .addTo(map);
        bounds.extend([v.start_lat, v.start_lng]);
      }
      if (v.end_lat != null) {
        m.end = L.marker([v.end_lat, v.end_lng], { icon: PIN_END, draggable: true })
          .on('dragend', e => {
            const ll = e.target.getLatLng();
            onChangeRef.current?.({ ...(valueRef.current || {}), end_lat: round(ll.lat), end_lng: round(ll.lng) });
          })
          .addTo(map);
        bounds.extend([v.end_lat, v.end_lng]);
      }
      if (v.start_lat != null && v.end_lat != null) {
        lineRef.current = L.polyline(
          [[v.start_lat, v.start_lng], [v.end_lat, v.end_lng]],
          { color: '#14b8a6', weight: 3, dashArray: '6 6', opacity: 0.7 }
        ).addTo(map);
      }
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [value, mode]);

  async function search() {
    if (!searchQ.trim()) return;
    setGeocoding(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchQ)}&accept-language=de`);
      const data = await r.json();
      if (data.length) {
        const lat = Number(data[0].lat);
        const lng = Number(data[0].lon);
        mapRef.current?.setView([lat, lng], 13);
      }
    } finally {
      setGeocoding(false);
    }
  }

  function useGeolocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(p => {
      const { latitude: lat, longitude: lng } = p.coords;
      mapRef.current?.setView([lat, lng], 14);
    });
  }

  const v = value || {};
  const hasStart  = v.start_lat != null;
  const hasEnd    = v.end_lat != null;
  const hasSingle = v.lat != null;

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-bg-2">
      <div className="p-2.5 flex flex-wrap gap-2 items-center border-b border-border bg-bg-3">
        <input
          className="field flex-1 min-w-[180px] text-sm"
          style={{ minHeight: 38 }}
          placeholder="Ort suchen (Stadt, Fluss, ...)"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), search())}
        />
        <button type="button" className="btn btn-secondary" style={{ minHeight: 38, padding: '8px 14px' }} onClick={search} disabled={geocoding || !searchQ.trim()}>
          {geocoding ? <span className="spinner"/> : <Icon.Search size={16}/>} Suchen
        </button>
        <button type="button" className="btn btn-ghost" style={{ minHeight: 38, padding: '8px 12px' }} onClick={useGeolocation} title="Aktuellen Standort">
          <Icon.Pin size={16}/>
        </button>
      </div>

      {mode === 'start_end' && (
        <div className="px-3 py-2 flex flex-wrap gap-2 items-center border-b border-border text-xs">
          <button
            type="button"
            className={'px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 ' + (activeSlot === 'start' ? 'text-white' : 'bg-bg-3 text-text-dim hover:text-text')}
            style={activeSlot === 'start' ? { background: '#22c55e' } : {}}
            onClick={() => setActiveSlot('start')}
          >
            <span className="inline-block w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center" style={{ background: '#22c55e' }}>A</span>
            Start
            {hasStart && <span className="mono text-[10px] opacity-80 ml-1">✓</span>}
          </button>
          <button
            type="button"
            className={'px-2.5 py-1 rounded-md font-semibold flex items-center gap-1.5 ' + (activeSlot === 'end' ? 'text-white' : 'bg-bg-3 text-text-dim hover:text-text')}
            style={activeSlot === 'end' ? { background: '#ef4444' } : {}}
            onClick={() => setActiveSlot('end')}
          >
            <span className="inline-block w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center" style={{ background: '#ef4444' }}>B</span>
            Ziel
            {hasEnd && <span className="mono text-[10px] opacity-80 ml-1">✓</span>}
          </button>
          {(hasStart || hasEnd) && (
            <button type="button" className="ml-auto text-text-dim hover:text-danger text-xs" onClick={() => onChange?.({})}>
              Punkte löschen
            </button>
          )}
          <div className="basis-full text-text-faint">
            {activeSlot === 'start'
              ? (hasStart ? 'Klick auf die Karte → Startpunkt verschieben' : 'Klick auf die Karte → Startpunkt setzen')
              : (hasEnd   ? 'Klick auf die Karte → Zielpunkt verschieben'  : 'Klick auf die Karte → Zielpunkt setzen')}
            {' · Marker können gezogen werden'}
          </div>
        </div>
      )}

      {mode === 'single' && (
        <div className="px-3 py-2 flex flex-wrap gap-2 items-center border-b border-border text-xs text-text-dim">
          Klick auf die Karte zum Setzen · Marker ziehbar
          {hasSingle && (
            <button type="button" className="ml-auto text-text-dim hover:text-danger" onClick={() => onChange?.({})}>
              Löschen
            </button>
          )}
        </div>
      )}

      <div ref={mapEl} style={{ height: 360 }} />

      {(hasStart || hasEnd || hasSingle) && (
        <div className="px-3 py-2 border-t border-border text-xs mono text-text-dim flex flex-wrap gap-4">
          {hasSingle && <span>📍 {v.lat}, {v.lng}</span>}
          {hasStart && <span>A: {v.start_lat}, {v.start_lng}</span>}
          {hasEnd && <span>B: {v.end_lat}, {v.end_lng}</span>}
        </div>
      )}
    </div>
  );
}

function round(n) { return Math.round(n * 1e6) / 1e6; }
