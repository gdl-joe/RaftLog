import { useEffect, useState, useRef } from 'react';
import { api, uploadPhotosParallel } from '../api.js';
import { Icon, TripTypeIcon, TRIP_TYPES } from '../icons.jsx';
import { Loading } from '../atoms.jsx';
import MapPicker from '../components/MapPicker.jsx';

const TYPE_TINT = {
  river:   'rgba(20,184,166,.15)',
  lake:    'rgba(59,130,246,.15)',
  cave:    'rgba(184,130,58,.15)',
  portage: 'rgba(132,204,22,.15)',
};

export default function NewScreen({ go, user }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    trip_type: '',
    water_id:  '',
    title:     '',
    date_from: new Date().toISOString().slice(0, 10),
    date_to:   '',
    start_time:'', end_time: '',
    distance_km:'',
    ww_grade:'', water_level:'',
    wind_beaufort:'', waves:'',
    wet:'', rope:'',
    portage_distance_m:'', carry_method:'',
    put_in_lat: null, put_in_lng: null,
    take_out_lat: null, take_out_lng: null,
    diff_t: 0, diff_k: 0, diff_p: 0, rating: 0,
    weather:'', notes:'',
    team: [], gear: [], hazards: [],
  });

  const update = (k, v) => setData(d => ({ ...d, [k]: v }));

  const next = () => setStep(s => Math.min(4, s + 1));
  const prev = () => setStep(s => Math.max(1, s - 1));

  // Saving
  const [saving, setSaving] = useState(false);
  const [savedTripId, setSavedTripId] = useState(null);
  const fileRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  async function save(files = []) {
    setSaving(true);
    try {
      const payload = { ...data };
      // numerische Felder casten
      for (const k of ['distance_km','diff_t','diff_k','diff_p','rating','wind_beaufort','portage_distance_m',
                       'put_in_lat','put_in_lng','take_out_lat','take_out_lng']) {
        if (payload[k] === '' || payload[k] == null) delete payload[k];
        else payload[k] = Number(payload[k]);
      }
      for (const k of ['date_to','start_time','end_time','ww_grade','water_level','waves','wet','rope','carry_method','weather','notes']) {
        if (payload[k] === '') payload[k] = null;
      }
      const trip = await api.createTrip(payload);

      if (files.length) {
        setUploadProgress({ done: 0, total: files.length });
        await uploadPhotosParallel(trip.id, files, {
          concurrency: 3,
          onProgress: (done, total) => setUploadProgress({ done, total }),
        });
      }
      setSavedTripId(trip.id);
    } catch (e) {
      alert('Speichern fehlgeschlagen: ' + e.message);
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  }

  if (savedTripId) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 bg-water rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-glow">
          <Icon.Check size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">Befahrung gespeichert</h2>
        <p className="text-text-dim mb-6">Du kannst weitere Fotos im Detail-Tab hinzufügen.</p>
        <div className="flex gap-3 justify-center">
          <button className="btn btn-secondary" onClick={() => go('feed')}>Zum Feed</button>
          <button className="btn btn-primary" onClick={() => go('detail', { id: savedTripId })}>Detail öffnen →</button>
        </div>
      </div>
    );
  }

  if (saving) {
    return (
      <div className="text-center py-12">
        <Loading label={uploadProgress ? `Lade Fotos ${uploadProgress.done}/${uploadProgress.total}…` : 'Speichere…'} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {[1,2,3,4].map(s => (
          <span key={s} className={'h-1 rounded flex-1 ' + (s <= step ? 'bg-water' : 'bg-bg-3')} />
        ))}
        <span className="text-xs text-text-dim mono ml-2 whitespace-nowrap">Schritt {step} / 4</span>
      </div>

      {step === 1 && <Step1 data={data} update={update} next={next} />}
      {step === 2 && <Step2 data={data} update={update} next={next} prev={prev} />}
      {step === 3 && <Step3 data={data} update={update} next={next} prev={prev} />}
      {step === 4 && <Step4 data={data} update={update} prev={prev} onSave={save} fileRef={fileRef} />}
    </div>
  );
}

// ─────── Schritt 1: Typ ────────────
function Step1({ data, update, next }) {
  return (
    <>
      <h1 className="text-2xl font-bold mb-1">Welcher Typ?</h1>
      <p className="text-text-dim mb-6">Wähle aus — die folgenden Schritte passen sich an.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        {TRIP_TYPES.map(t => {
          const sel = data.trip_type === t.key;
          return (
            <button
              key={t.key}
              className="aspect-square border-2 rounded-2xl flex flex-col items-center justify-center gap-2 p-4 transition-all hover:-translate-y-0.5"
              style={{
                borderColor: sel ? `var(--c-type-${t.key})` : 'var(--c-border)',
                background: sel ? TYPE_TINT[t.key] : 'var(--c-surface)',
                boxShadow: sel ? `0 0 0 4px ${TYPE_TINT[t.key]}` : 'none',
              }}
              onClick={() => update('trip_type', t.key)}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                   style={{ background: TYPE_TINT[t.key], color: `var(--c-type-${t.key})` }}>
                <TripTypeIcon type={t.key} size={36} />
              </div>
              <div className="font-semibold">{t.label}</div>
              <div className="text-xs text-text-dim text-center">{t.sub}</div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end mt-8 pt-5 border-t border-border">
        <button className="btn btn-primary" disabled={!data.trip_type} onClick={next}>Weiter →</button>
      </div>
    </>
  );
}

// ─────── Schritt 2: Gewässer + Titel ────────────
function Step2({ data, update, next, prev }) {
  const [waters, setWaters] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [newCoords, setNewCoords] = useState({});  // {lat,lng} oder {start_lat,...,end_lat,...}

  useEffect(() => {
    api.listWaters(data.trip_type).then(setWaters);
  }, [data.trip_type]);

  async function createWater() {
    if (!newName.trim()) return;
    const payload = { name: newName.trim(), region: newRegion.trim() || null };
    // Koordinaten je Typ ans Backend mapnen
    if (data.trip_type === 'lake' || data.trip_type === 'cave') {
      if (newCoords.lat != null) { payload.lat = newCoords.lat; payload.lng = newCoords.lng; }
    } else if (data.trip_type === 'portage') {
      if (newCoords.start_lat != null) {
        payload.start_lat = newCoords.start_lat; payload.start_lng = newCoords.start_lng;
      }
      if (newCoords.end_lat != null) {
        payload.end_lat = newCoords.end_lat; payload.end_lng = newCoords.end_lng;
      }
    }
    // Für 'river' werden Koordinaten beim Trip selbst gesetzt (put_in/take_out), nicht am Gewässer
    const w = await api.createWater(data.trip_type, payload);
    setWaters([...waters, { ...w, trip_count: 0 }]);
    update('water_id', w.id);
    setShowNew(false); setNewName(''); setNewRegion(''); setNewCoords({});
  }

  const pickerMode = (data.trip_type === 'portage') ? 'start_end' : 'single';
  const showPicker = data.trip_type !== 'river'; // für Fluss: Koordinaten kommen beim Trip (put_in/take_out)

  const typeLabel = TRIP_TYPES.find(t => t.key === data.trip_type)?.label;

  return (
    <>
      <h1 className="text-2xl font-bold mb-1">Wo?</h1>
      <p className="text-text-dim mb-6">{typeLabel} wählen oder neu anlegen.</p>

      {!waters && <Loading />}
      {waters && (
        <>
          <div className="max-h-80 overflow-y-auto border border-border rounded-xl mb-4">
            {waters.map(w => (
              <label key={w.id} className={'flex items-center gap-3 p-3 cursor-pointer border-b border-border last:border-b-0 hover:bg-bg-3 ' + (data.water_id === w.id ? 'bg-water-glow' : '')}>
                <input type="radio" name="water" checked={data.water_id === w.id} onChange={() => update('water_id', w.id)} className="accent-water" />
                <span className="flex-1">
                  <span className="block font-medium">{w.name}</span>
                  {(w.region || w.country) && <span className="block text-xs text-text-dim mono">{[w.region, w.country].filter(Boolean).join(' · ')}</span>}
                </span>
                {w.trip_count > 0 && <span className="text-xs text-text-dim mono">{w.trip_count} ×</span>}
              </label>
            ))}
            {waters.length === 0 && <div className="p-6 text-center text-text-dim text-sm">Noch keine {typeLabel}-Einträge.</div>}
          </div>

          {!showNew && (
            <button className="btn btn-secondary mb-4" onClick={() => setShowNew(true)}>
              <Icon.Plus size={16} /> Neuen Eintrag anlegen
            </button>
          )}
          {showNew && (
            <div className="bg-bg-2 border border-border rounded-xl p-4 mb-4">
              <label className="field-label">Name</label>
              <input className="field mb-3" value={newName} onChange={e => setNewName(e.target.value)} placeholder={typeLabel + '-Name'} />
              <label className="field-label">Region (optional)</label>
              <input className="field mb-3" value={newRegion} onChange={e => setNewRegion(e.target.value)} placeholder="z.B. Niedersachsen" />
              {showPicker && (
                <>
                  <label className="field-label">
                    {data.trip_type === 'portage' ? 'Start- und Endpunkt auf Karte setzen' : 'Position auf Karte setzen (optional)'}
                  </label>
                  <div className="mb-3">
                    <MapPicker mode={pickerMode} value={newCoords} onChange={setNewCoords} />
                  </div>
                </>
              )}
              <div className="flex gap-2 justify-end">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowNew(false)}>Abbrechen</button>
                <button className="btn btn-primary" disabled={!newName.trim()} onClick={createWater}>Anlegen</button>
              </div>
            </div>
          )}

          <label className="field-label">Titel der Befahrung</label>
          <input className="field mb-4" value={data.title} onChange={e => update('title', e.target.value)} placeholder="z.B. Aller-Etappe Verden → Achim" />
        </>
      )}

      <div className="flex justify-between mt-6 pt-5 border-t border-border">
        <button className="btn btn-secondary" onClick={prev}>← Zurück</button>
        <button className="btn btn-primary" disabled={!data.water_id || !data.title.trim()} onClick={next}>Weiter →</button>
      </div>
    </>
  );
}

// ─────── Schritt 3: Daten + typ-spezifisch ────────────
function Step3({ data, update, next, prev }) {
  return (
    <>
      <h1 className="text-2xl font-bold mb-1">Eckdaten</h1>
      <p className="text-text-dim mb-6">Datum, Strecke, Schwierigkeit.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Datum</label>
          <input type="date" className="field" value={data.date_from} onChange={e => update('date_from', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Bis (optional, Mehrtages)</label>
          <input type="date" className="field" value={data.date_to} onChange={e => update('date_to', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Start</label>
          <input type="time" className="field" value={data.start_time} onChange={e => update('start_time', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Ende</label>
          <input type="time" className="field" value={data.end_time} onChange={e => update('end_time', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Strecke (km)</label>
          <input type="number" step="0.1" className="field" value={data.distance_km} onChange={e => update('distance_km', e.target.value)} placeholder="z.B. 18.4" />
        </div>
      </div>

      {/* Typ-spezifisch */}
      {data.trip_type === 'river' && <>
        <h3 className="font-semibold text-sm uppercase tracking-wider text-text-faint mt-6 mb-3">Fluss</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">WW-Grad</label>
            <select className="field" value={data.ww_grade} onChange={e => update('ww_grade', e.target.value)}>
              <option value="">—</option>
              {['WW I','WW I–II','WW II','WW II–III','WW III','WW III–IV','WW IV','WW V','WW VI','X'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Pegel / Wasserstand</label>
            <input className="field" value={data.water_level} onChange={e => update('water_level', e.target.value)} placeholder="z.B. 120 cm" />
          </div>
        </div>
        <label className="field-label mt-4 block">Ein- &amp; Ausstieg auf Karte setzen</label>
        <MapPicker
          mode="start_end"
          value={{
            start_lat: data.put_in_lat,   start_lng: data.put_in_lng,
            end_lat:   data.take_out_lat, end_lng:   data.take_out_lng,
          }}
          onChange={v => {
            update('put_in_lat',   v.start_lat ?? null);
            update('put_in_lng',   v.start_lng ?? null);
            update('take_out_lat', v.end_lat   ?? null);
            update('take_out_lng', v.end_lng   ?? null);
          }}
        />
      </>}

      {data.trip_type === 'lake' && <>
        <h3 className="font-semibold text-sm uppercase tracking-wider text-text-faint mt-6 mb-3">See</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Wind (Beaufort 0–12)</label>
            <input type="number" min="0" max="12" className="field" value={data.wind_beaufort} onChange={e => update('wind_beaufort', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Wellen</label>
            <input className="field" value={data.waves} onChange={e => update('waves', e.target.value)} placeholder="glatt / Wellen / Schwell" />
          </div>
        </div>
      </>}

      {data.trip_type === 'cave' && <>
        <h3 className="font-semibold text-sm uppercase tracking-wider text-text-faint mt-6 mb-3">Höhle</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Wasserführung</label>
            <select className="field" value={data.wet} onChange={e => update('wet', e.target.value)}>
              <option value="">—</option><option>Trocken</option><option>Teilweise</option><option>Nass</option>
            </select>
          </div>
          <div>
            <label className="field-label">Seil</label>
            <select className="field" value={data.rope} onChange={e => update('rope', e.target.value)}>
              <option value="">—</option><option>Ohne</option><option>Mit Seil</option><option>SRT</option>
            </select>
          </div>
        </div>
      </>}

      {data.trip_type === 'portage' && <>
        <h3 className="font-semibold text-sm uppercase tracking-wider text-text-faint mt-6 mb-3">Portage</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Tragstrecke (m)</label>
            <input type="number" className="field" value={data.portage_distance_m} onChange={e => update('portage_distance_m', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Methode</label>
            <input className="field" value={data.carry_method} onChange={e => update('carry_method', e.target.value)} placeholder="Rollen / Schultern" />
          </div>
        </div>
      </>}

      {/* T/K/P + Rating */}
      <h3 className="font-semibold text-sm uppercase tracking-wider text-text-faint mt-6 mb-3">Schwierigkeit</h3>
      <div className="space-y-3">
        <Rater label="Technisch"  value={data.diff_t} onChange={v => update('diff_t', v)} />
        <Rater label="Körperlich" value={data.diff_k} onChange={v => update('diff_k', v)} />
        <Rater label="Psychisch"  value={data.diff_p} onChange={v => update('diff_p', v)} />
        <Rater label="Bewertung"  value={data.rating} onChange={v => update('rating', v)} max={5} stars />
      </div>

      <div className="flex justify-between mt-8 pt-5 border-t border-border">
        <button className="btn btn-secondary" onClick={prev}>← Zurück</button>
        <button className="btn btn-primary" onClick={next}>Weiter →</button>
      </div>
    </>
  );
}

// ─────── Schritt 4: Team, Gear, Notizen, Fotos ────────────
function Step4({ data, update, prev, onSave, fileRef }) {
  const [files, setFiles] = useState([]);
  const [teamInput, setTeamInput] = useState('');
  const [gearInput, setGearInput] = useState('');

  const addTeam = () => { if (teamInput.trim()) { update('team', [...data.team, teamInput.trim()]); setTeamInput(''); } };
  const addGear = () => { if (gearInput.trim()) { update('gear', [...data.gear, gearInput.trim()]); setGearInput(''); } };

  return (
    <>
      <h1 className="text-2xl font-bold mb-1">Details &amp; Fotos</h1>
      <p className="text-text-dim mb-6">Team, Ausrüstung, Notizen — und beliebig viele Fotos.</p>

      <label className="field-label">Wetter</label>
      <input className="field mb-4" value={data.weather} onChange={e => update('weather', e.target.value)} placeholder="z.B. Bedeckt, 14 °C, leichter SW-Wind" />

      <label className="field-label">Notizen</label>
      <textarea className="field mb-4" rows={4} value={data.notes} onChange={e => update('notes', e.target.value)} placeholder="Wie war's? Besonderheiten, Erinnerungen…" />

      <label className="field-label">Team-Mitglieder</label>
      <div className="flex gap-2 mb-2">
        <input className="field flex-1" value={teamInput} onChange={e => setTeamInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTeam())} placeholder="Name eintippen, Enter zum Hinzufügen" />
        <button type="button" className="btn btn-secondary" onClick={addTeam}>+</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {data.team.map((m, i) => (
          <span key={m + i} className="bg-bg-3 text-text px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-2">
            {m}
            <button type="button" className="text-text-dim hover:text-danger" onClick={() => update('team', data.team.filter((_, j) => j !== i))}><Icon.X size={14}/></button>
          </span>
        ))}
      </div>

      <label className="field-label">Ausrüstung (Tags)</label>
      <div className="flex gap-2 mb-2">
        <input className="field flex-1" value={gearInput} onChange={e => setGearInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addGear())} placeholder="z.B. Packraft Anfibio, PFD, Helm…" />
        <button type="button" className="btn btn-secondary" onClick={addGear}>+</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {data.gear.map((g, i) => (
          <span key={g + i} className="bg-bg-3 text-text-dim px-2.5 py-1 rounded-md text-xs inline-flex items-center gap-1.5">
            {g}
            <button type="button" className="hover:text-danger" onClick={() => update('gear', data.gear.filter((_, j) => j !== i))}><Icon.X size={12}/></button>
          </span>
        ))}
      </div>

      <label className="field-label">Fotos hinzufügen</label>
      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center mb-4 hover:border-water hover:bg-water-glow transition-all">
        <input ref={fileRef} type="file" multiple accept="image/*" hidden onChange={e => setFiles([...e.target.files])} />
        <button type="button" onClick={() => fileRef.current?.click()} className="text-text-dim hover:text-water inline-flex flex-col items-center gap-2">
          <Icon.Upload size={32} />
          {files.length > 0 ? <span><strong className="text-water">{files.length}</strong> Foto{files.length === 1 ? '' : 's'} ausgewählt</span> : <span>Klicken oder Drag & Drop</span>}
        </button>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-4">
          {files.map((f, i) => (
            <div key={i} className="aspect-square rounded overflow-hidden bg-bg-3 relative">
              <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="" />
              <button type="button" className="absolute top-1 right-1 bg-black/60 text-white rounded p-0.5" onClick={() => setFiles(files.filter((_, j) => j !== i))}><Icon.X size={12}/></button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-8 pt-5 border-t border-border">
        <button className="btn btn-secondary" onClick={prev}>← Zurück</button>
        <button className="btn btn-primary" onClick={() => onSave(files)}>
          <Icon.Check size={16}/> Speichern{files.length ? ` & ${files.length} Foto${files.length === 1 ? '' : 's'} hochladen` : ''}
        </button>
      </div>
    </>
  );
}

function Rater({ label, value, onChange, max = 5, stars }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-sm text-text-dim">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => {
          const v = i + 1;
          const on = v <= value;
          return (
            <button key={v} type="button" onClick={() => onChange(value === v ? 0 : v)} className="cursor-pointer">
              {stars ? (
                <span className={'text-2xl ' + (on ? 'text-sand' : 'text-text-faint')}>★</span>
              ) : (
                <span className={'block h-2.5 w-5 rounded ' + (on ? 'bg-water' : 'bg-bg-3 hover:bg-border')} />
              )}
            </button>
          );
        })}
      </div>
      <span className="text-xs text-text-dim mono ml-auto">{value} / {max}</span>
    </div>
  );
}
