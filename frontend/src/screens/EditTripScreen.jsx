import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Icon, TripTypeIcon } from '../icons.jsx';
import { Loading, tripTypeLabel } from '../atoms.jsx';
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
      // Backend-Felder rauswerfen die nicht editiert werden
      for (const k of ['id','created_by','created_at','updated_at','cover_photo','cover_photo_large','photos','water_name','water_region','water_country','difficulty','photo_count','trip_type','water_id']) {
        delete payload[k];
      }
      // Numerische Werte casten oder null
      for (const k of ['distance_km','diff_t','diff_k','diff_p','rating','wind_beaufort','portage_distance_m','put_in_lat','put_in_lng','take_out_lat','take_out_lng']) {
        if (payload[k] === '' || payload[k] == null) payload[k] = null;
        else payload[k] = Number(payload[k]);
      }
      // Leere Strings auf null
      for (const k of ['date_to','start_time','end_time','ww_grade','water_level','waves','wet','rope','carry_method','weather','notes']) {
        if (payload[k] === '') payload[k] = null;
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
    if (!confirm('Diese Befahrung wirklich löschen? Alle Fotos und Tracks werden mitgelöscht.')) return;
    await api.deleteTrip(id);
    go('feed');
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <TripTypeIcon type={trip.trip_type} size={22} style={{ color: `var(--c-type-${trip.trip_type})` }} />
        <h1 className="text-2xl font-bold">Befahrung bearbeiten</h1>
        <span className="text-xs text-text-dim mono ml-auto">{trip.id}</span>
      </div>

      {/* Basis */}
      <Section title="Basis">
        <Field label="Titel" full>
          <input className="field" value={trip.title || ''} onChange={e => update('title', e.target.value)} />
        </Field>
        <Field label="Datum von">
          <input type="date" className="field" value={trip.date_from?.slice(0,10) || ''} onChange={e => update('date_from', e.target.value)} />
        </Field>
        <Field label="Datum bis (Mehrtages)">
          <input type="date" className="field" value={trip.date_to?.slice(0,10) || ''} onChange={e => update('date_to', e.target.value)} />
        </Field>
        <Field label="Start">
          <input type="time" className="field" value={trip.start_time?.slice(0,5) || ''} onChange={e => update('start_time', e.target.value)} />
        </Field>
        <Field label="Ende">
          <input type="time" className="field" value={trip.end_time?.slice(0,5) || ''} onChange={e => update('end_time', e.target.value)} />
        </Field>
        <Field label="Strecke (km)">
          <input type="number" step="0.1" className="field" value={trip.distance_km ?? ''} onChange={e => update('distance_km', e.target.value)} />
        </Field>
        <Field label="Bewertung (1–5)">
          <input type="number" min="0" max="5" className="field" value={trip.rating ?? ''} onChange={e => update('rating', e.target.value)} />
        </Field>
      </Section>

      {/* Typ-spezifisch */}
      {trip.trip_type === 'river' && (
        <Section title="Fluss-Daten">
          <Field label="WW-Grad">
            <select className="field" value={trip.ww_grade || ''} onChange={e => update('ww_grade', e.target.value)}>
              <option value="">—</option>
              {['WW I','WW I–II','WW II','WW II–III','WW III','WW III–IV','WW IV','WW V','WW VI','X'].map(g => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Pegel / Wasserstand">
            <input className="field" value={trip.water_level || ''} onChange={e => update('water_level', e.target.value)} placeholder="z.B. 120 cm" />
          </Field>
        </Section>
      )}

      {trip.trip_type === 'lake' && (
        <Section title="See-Daten">
          <Field label="Wind (Beaufort 0–12)">
            <input type="number" min="0" max="12" className="field" value={trip.wind_beaufort ?? ''} onChange={e => update('wind_beaufort', e.target.value)} />
          </Field>
          <Field label="Wellen">
            <input className="field" value={trip.waves || ''} onChange={e => update('waves', e.target.value)} placeholder="glatt / Wellen / Schwell" />
          </Field>
        </Section>
      )}

      {trip.trip_type === 'cave' && (
        <Section title="Höhlen-Daten">
          <Field label="Wasserführung">
            <select className="field" value={trip.wet || ''} onChange={e => update('wet', e.target.value)}>
              <option value="">—</option><option>Trocken</option><option>Teilweise</option><option>Nass</option>
            </select>
          </Field>
          <Field label="Seil">
            <select className="field" value={trip.rope || ''} onChange={e => update('rope', e.target.value)}>
              <option value="">—</option><option>Ohne</option><option>Mit Seil</option><option>SRT</option>
            </select>
          </Field>
        </Section>
      )}

      {trip.trip_type === 'portage' && (
        <Section title="Portage-Daten">
          <Field label="Tragstrecke (m)">
            <input type="number" className="field" value={trip.portage_distance_m ?? ''} onChange={e => update('portage_distance_m', e.target.value)} />
          </Field>
          <Field label="Methode">
            <input className="field" value={trip.carry_method || ''} onChange={e => update('carry_method', e.target.value)} placeholder="Rollen / Schultern" />
          </Field>
        </Section>
      )}

      {/* Schwierigkeit */}
      <Section title="Schwierigkeit">
        <Rater label="Technisch"  value={trip.diff_t || 0} onChange={v => update('diff_t', v)} />
        <Rater label="Körperlich" value={trip.diff_k || 0} onChange={v => update('diff_k', v)} />
        <Rater label="Psychisch"  value={trip.diff_p || 0} onChange={v => update('diff_p', v)} />
      </Section>

      {/* Wetter & Notizen */}
      <Section title="Wetter & Notizen">
        <Field label="Wetter" full>
          <input className="field" value={trip.weather || ''} onChange={e => update('weather', e.target.value)} placeholder="z.B. Bedeckt, 14 °C" />
        </Field>
        <Field label="Notizen" full>
          <textarea className="field" rows={6} value={trip.notes || ''} onChange={e => update('notes', e.target.value)} />
        </Field>
      </Section>

      {/* Karte */}
      <Section title="Ein- und Ausstieg">
        <div className="col-span-2">
          <MapPicker
            mode="start_end"
            value={{
              start_lat: trip.put_in_lat,    start_lng: trip.put_in_lng,
              end_lat:   trip.take_out_lat,  end_lng:   trip.take_out_lng,
            }}
            onChange={v => {
              update('put_in_lat',   v.start_lat ?? null);
              update('put_in_lng',   v.start_lng ?? null);
              update('take_out_lat', v.end_lat   ?? null);
              update('take_out_lng', v.end_lng   ?? null);
            }}
          />
        </div>
      </Section>

      {/* Team */}
      <Section title="Team">
        <div className="col-span-2">
          <TagInput
            value={trip.team || []}
            onChange={v => update('team', v)}
            placeholder="Name eintippen, Enter zum Hinzufügen"
          />
        </div>
      </Section>

      {/* Ausrüstung */}
      <Section title="Ausrüstung">
        <div className="col-span-2">
          <TagInput
            value={trip.gear || []}
            onChange={v => update('gear', v)}
            placeholder="z.B. Packraft Anfibio, Helm, PFD"
            small
          />
        </div>
      </Section>

      {/* Gefahren */}
      <Section title="Gefahren / Beobachtungen">
        <div className="col-span-2">
          <TagInput
            value={trip.hazards || []}
            onChange={v => update('hazards', v)}
            placeholder="z.B. Wehr bei km 12, niedrige Brücke"
            small
          />
        </div>
      </Section>

      {/* Footer */}
      <div className="flex justify-between gap-3 mt-8 pt-5 border-t border-border sticky bottom-0 bg-bg py-4 -mx-4 px-4 lg:-mx-8 lg:px-8 z-10">
        <button className="btn btn-danger" onClick={del}><Icon.Trash size={16}/> Löschen</button>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => go('detail', { id })}>Abbrechen</button>
          <button className="btn btn-primary" disabled={saving} onClick={save}>
            {saving ? <span className="spinner"/> : <><Icon.Check size={16}/> Speichern</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── kleine Helpers ──────────────────────────────────────

function Section({ title, children }) {
  return (
    <details open className="mb-3 bg-bg-2 border border-border rounded-xl overflow-hidden">
      <summary className="cursor-pointer px-4 py-3 font-semibold text-sm uppercase tracking-wider text-text-faint hover:bg-bg-3 select-none flex items-center justify-between">
        <span>{title}</span>
        <Icon.ChevronRight size={16} className="text-text-dim" />
      </summary>
      <div className="grid grid-cols-2 gap-4 p-4">
        {children}
      </div>
    </details>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={full ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function Rater({ label, value, onChange }) {
  return (
    <div className="col-span-2 flex items-center gap-3 py-1.5">
      <span className="w-24 text-sm text-text-dim">{label}</span>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(v => {
          const on = v <= value;
          return (
            <button key={v} type="button" onClick={() => onChange(value === v ? 0 : v)}>
              <span className={'block h-2.5 w-6 rounded ' + (on ? 'bg-water' : 'bg-bg-3 hover:bg-border')} />
            </button>
          );
        })}
      </div>
      <span className="text-xs text-text-dim mono ml-auto">{value} / 5</span>
    </div>
  );
}

function TagInput({ value, onChange, placeholder, small }) {
  const [draft, setDraft] = useState('');
  return (
    <>
      <div className="flex gap-2 mb-2">
        <input
          className="field flex-1"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const v = draft.trim();
              if (v && !value.includes(v)) onChange([...value, v]);
              setDraft('');
            }
          }}
          placeholder={placeholder}
        />
        <button type="button" className="btn btn-secondary" onClick={() => {
          const v = draft.trim();
          if (v && !value.includes(v)) onChange([...value, v]);
          setDraft('');
        }}>+</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((v, i) => (
          <span key={v + i} className={(small ? 'bg-bg-3 text-text-dim px-2.5 py-1 rounded-md text-xs' : 'bg-bg-3 text-text px-3 py-1.5 rounded-lg text-sm') + ' inline-flex items-center gap-1.5'}>
            {v}
            <button type="button" className="hover:text-danger" onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <Icon.X size={12} />
            </button>
          </span>
        ))}
      </div>
    </>
  );
}
