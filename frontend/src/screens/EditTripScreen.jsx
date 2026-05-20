import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';
import { Loading } from '../atoms.jsx';
import MapPicker from '../components/MapPicker.jsx';

export default function EditTripScreen({ id, go }) {
  const [trip, setTrip] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getTrip(id).then(t => setTrip({
      ...t,
      team: t.team || [],
      gear: t.gear || [],
      hazards: t.hazards || [],
    }));
  }, [id]);

  if (!trip) return <Loading />;

  const update = (k, v) => setTrip(t => ({ ...t, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      const payload = { ...trip };
      delete payload.id; delete payload.created_by; delete payload.created_at;
      delete payload.updated_at; delete payload.cover_photo; delete payload.photos;
      delete payload.water_name; delete payload.water_region; delete payload.water_country;
      delete payload.difficulty; delete payload.photo_count;
      // Numerische Koordinaten erzwingen
      for (const k of ['put_in_lat','put_in_lng','take_out_lat','take_out_lng','distance_km','rating']) {
        if (payload[k] === '' || payload[k] == null) payload[k] = null;
        else payload[k] = Number(payload[k]);
      }
      await api.updateTrip(id, payload);
      go('detail', { id });
    } catch (e) {
      alert('Fehler: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!confirm('Diese Befahrung wirklich löschen? Alle Fotos werden mitgelöscht.')) return;
    await api.deleteTrip(id);
    go('feed');
  }

  const isRiver = trip.trip_type === 'river';

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Befahrung bearbeiten</h1>

      <label className="field-label">Titel</label>
      <input className="field mb-4" value={trip.title || ''} onChange={e => update('title', e.target.value)} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Datum</label>
          <input type="date" className="field" value={trip.date_from?.slice(0,10) || ''} onChange={e => update('date_from', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Bis</label>
          <input type="date" className="field" value={trip.date_to?.slice(0,10) || ''} onChange={e => update('date_to', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Strecke (km)</label>
          <input type="number" step="0.1" className="field" value={trip.distance_km || ''} onChange={e => update('distance_km', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Bewertung</label>
          <input type="number" min="0" max="5" className="field" value={trip.rating || ''} onChange={e => update('rating', e.target.value)} />
        </div>
      </div>

      <label className="field-label mt-4 block">Wetter</label>
      <input className="field mb-4" value={trip.weather || ''} onChange={e => update('weather', e.target.value)} />

      <label className="field-label">Notizen</label>
      <textarea className="field mb-4" rows={6} value={trip.notes || ''} onChange={e => update('notes', e.target.value)} />

      {isRiver && (
        <>
          <label className="field-label mt-2">Ein- &amp; Ausstieg</label>
          <div className="mb-6">
            <MapPicker
              mode="start_end"
              value={{
                start_lat: trip.put_in_lat,   start_lng: trip.put_in_lng,
                end_lat:   trip.take_out_lat, end_lng:   trip.take_out_lng,
              }}
              onChange={v => {
                update('put_in_lat',   v.start_lat ?? null);
                update('put_in_lng',   v.start_lng ?? null);
                update('take_out_lat', v.end_lat   ?? null);
                update('take_out_lng', v.end_lng   ?? null);
              }}
            />
          </div>
        </>
      )}

      <div className="flex justify-between gap-3 pt-5 border-t border-border">
        <button className="btn btn-danger" onClick={del}><Icon.Trash size={16}/> Löschen</button>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => go('detail', { id })}>Abbrechen</button>
          <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? <span className="spinner"/> : <><Icon.Check size={16}/> Speichern</>}</button>
        </div>
      </div>
    </div>
  );
}
