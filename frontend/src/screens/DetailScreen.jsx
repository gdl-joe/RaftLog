import { useEffect, useState, useRef } from 'react';
import { api, uploadPhotosParallel } from '../api.js';
import { Chip, DiffBars, Rating, Loading, formatDate, formatDuration, tripTypeLabel } from '../atoms.jsx';
import { Icon, TripTypeIcon } from '../icons.jsx';
import MapyMap from '../components/MapyMap.jsx';
import MapPicker from '../components/MapPicker.jsx';
import PhotoLightbox from '../components/PhotoLightbox.jsx';

const TABS = [
  { key: 'info',   label: 'Übersicht', icon: Icon.Info },
  { key: 'map',    label: 'Karte & Track', icon: Icon.Map },
  { key: 'photos', label: 'Fotos',     icon: Icon.Camera },
  { key: 'team',   label: 'Team',      icon: Icon.Team },
];

export default function DetailScreen({ id, go, user }) {
  const [trip, setTrip]     = useState(null);
  const [photos, setPhotos] = useState(null);
  const [tracks, setTracks] = useState(null);
  const [tab, setTab]       = useState('info');
  const [lightbox, setLightbox] = useState(-1);
  const [uploading, setUploading] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    setTrip(null);
    api.getTrip(id).then(setTrip).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (tab === 'photos' && !photos) api.listPhotos(id).then(setPhotos);
    if (tab === 'map'    && !tracks) api.listTracks(id).then(setTracks);
  }, [tab, id, photos, tracks]);

  if (!trip) return <Loading label="Lade Befahrung…" />;
  const isAdmin = user?.role === 'admin';
  const heroImage = trip.cover_photo_large || trip.cover_photo;
  const heroGrad  = heroGradient(trip.trip_type);

  async function onUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading({ done: 0, total: files.length, errors: [] });
    const results = await uploadPhotosParallel(id, files, {
      concurrency: 3,
      onProgress: (done, total) => setUploading(u => ({ ...u, done, total })),
    });
    const errors = results.filter(r => !r.ok);
    setUploading(null);
    if (errors.length) {
      const msg = errors.map(e => `• ${e.file.name}: ${e.error}`).join('\n');
      alert(`${errors.length} von ${files.length} Foto(s) sind fehlgeschlagen:\n\n${msg}`);
    }
    const fresh = await api.listPhotos(id);
    setPhotos(fresh);
    // input zurücksetzen, damit dieselbe Datei nochmal gewählt werden kann
    if (e.target) e.target.value = '';
  }

  async function onUploadGpx(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      await api.uploadGpx(id, f);
      const fresh = await api.listTracks(id);
      setTracks(fresh);
    } catch (ex) {
      alert('GPX-Upload fehlgeschlagen: ' + ex.message);
    }
  }

  return (
    <>
      {/* HERO */}
      <div className="relative -mx-4 lg:-mx-8 lg:rounded-none aspect-[16/9] lg:aspect-[21/9] mb-5 overflow-hidden"
           style={{ background: heroGrad }}>
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
            style={{ background: '#0a1116' }}
            loading="eager"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent pointer-events-none" />
        <div className="absolute bottom-4 left-5 right-5 z-10 text-white">
          <div className="flex gap-2 items-center mb-2 flex-wrap">
            <Chip solid type={trip.trip_type}>
              <TripTypeIcon type={trip.trip_type} size={14} />
              {tripTypeLabel(trip.trip_type)}
            </Chip>
            {trip.ww_grade && <Chip type={trip.trip_type} className="bg-water/30 border-white/40 text-white">{trip.ww_grade}</Chip>}
          </div>
          <h1 className="text-2xl lg:text-4xl font-bold leading-tight text-white drop-shadow-md">{trip.title}</h1>
          <div className="mono text-sm opacity-90 mt-1 drop-shadow">
            {trip.water_name && trip.water_name + ' · '}{formatDate(trip.date_from)}
            {trip.date_to && trip.date_to !== trip.date_from && ' – ' + formatDate(trip.date_to)}
          </div>
        </div>
        {isAdmin && (
          <button className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md text-white rounded-lg p-2 hover:bg-black/80" onClick={() => go('edit', { id })} aria-label="Bearbeiten">
            <Icon.Edit size={18} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <nav className="tab-bar mb-5">
        {TABS.map(t => (
          <button key={t.key} className={'tab ' + (tab === t.key ? 'active' : '')} onClick={() => setTab(t.key)}>
            <t.icon size={16} />
            {t.label}
            {t.key === 'photos' && trip.photos > 0 && ` · ${trip.photos}`}
          </button>
        ))}
      </nav>

      {tab === 'info'   && <TabInfo trip={trip} />}
      {tab === 'map'    && <TabMap trip={trip} tracks={tracks} onUploadGpx={onUploadGpx} isAdmin={isAdmin} onUpdateTrip={setTrip} />}
      {tab === 'photos' && <TabPhotos photos={photos} onOpen={setLightbox} onUpload={onUpload} uploading={uploading} isAdmin={isAdmin} fileRef={fileRef} trip={trip} onUpdateTrip={setTrip} />}
      {tab === 'team'   && <TabTeam trip={trip} />}

      {lightbox >= 0 && photos && (
        <PhotoLightbox photos={photos} index={lightbox} onClose={() => setLightbox(-1)} />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
function TabInfo({ trip }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
      <div>
        <h2 className="font-semibold text-sm uppercase tracking-wider text-text-faint mb-2">Notizen</h2>
        <div className="bg-bg-2 border border-border rounded-xl p-4 text-[0.94rem] leading-relaxed whitespace-pre-wrap">
          {trip.notes || <span className="text-text-faint italic">Keine Notizen</span>}
        </div>

        <h2 className="font-semibold text-sm uppercase tracking-wider text-text-faint mb-2 mt-6">Wetter</h2>
        <Row k="Bedingungen" v={trip.weather || '—'} />
        {trip.water_level && <Row k="Pegel" v={trip.water_level} />}
        {trip.wind_beaufort != null && <Row k="Wind" v={'Bf ' + trip.wind_beaufort + (trip.waves ? ', ' + trip.waves : '')} />}
      </div>

      <div>
        <h2 className="font-semibold text-sm uppercase tracking-wider text-text-faint mb-2">Eckdaten</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {trip.distance_km != null && <StatTile label="Strecke" value={Number(trip.distance_km).toFixed(1)} sub="Kilometer" highlight />}
          {trip.duration_min != null && <StatTile label="Dauer" value={formatDuration(trip.duration_min)} />}
          {trip.distance_km && trip.duration_min ? <StatTile label="Schnitt" value={(trip.distance_km / (trip.duration_min / 60)).toFixed(1)} sub="km/h" /> : null}
          {trip.rating > 0 && <StatTile label="Bewertung" value={<Rating value={trip.rating} />} sub={`${trip.rating} / 5`} />}
        </div>

        <h2 className="font-semibold text-sm uppercase tracking-wider text-text-faint mb-2 mt-4">Schwierigkeit</h2>
        <DifficultyLine label="Technisch"  value={trip.difficulty.t} />
        <DifficultyLine label="Körperlich" value={trip.difficulty.k} />
        <DifficultyLine label="Psychisch"  value={trip.difficulty.p} />

        {trip.trip_type === 'cave' && (
          <>
            <h2 className="font-semibold text-sm uppercase tracking-wider text-text-faint mb-2 mt-4">Höhle</h2>
            {trip.wet  && <Row k="Wasserführung" v={trip.wet} />}
            {trip.rope && <Row k="Seil" v={trip.rope} />}
          </>
        )}
        {trip.trip_type === 'portage' && (
          <>
            <h2 className="font-semibold text-sm uppercase tracking-wider text-text-faint mb-2 mt-4">Portage</h2>
            {trip.portage_distance_m != null && <Row k="Tragstrecke" v={trip.portage_distance_m + ' m'} />}
            {trip.carry_method && <Row k="Methode" v={trip.carry_method} />}
          </>
        )}
      </div>
    </div>
  );
}

function TabMap({ trip, tracks, onUploadGpx, isAdmin, onUpdateTrip }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    start_lat: trip.put_in_lat,    start_lng: trip.put_in_lng,
    end_lat:   trip.take_out_lat,  end_lng:   trip.take_out_lng,
  });
  const [saving, setSaving] = useState(false);

  // Wenn Trip neu lädt, draft synchronisieren
  useEffect(() => {
    setDraft({
      start_lat: trip.put_in_lat,    start_lng: trip.put_in_lng,
      end_lat:   trip.take_out_lat,  end_lng:   trip.take_out_lng,
    });
  }, [trip.id, trip.put_in_lat, trip.put_in_lng, trip.take_out_lat, trip.take_out_lng]);

  async function save() {
    setSaving(true);
    try {
      const payload = {
        put_in_lat:   draft.start_lat ?? null,
        put_in_lng:   draft.start_lng ?? null,
        take_out_lat: draft.end_lat   ?? null,
        take_out_lng: draft.end_lng   ?? null,
      };
      const updated = await api.updateTrip(trip.id, payload);
      onUpdateTrip(updated);
      setEditing(false);
    } catch (e) {
      alert('Fehler beim Speichern: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft({
      start_lat: trip.put_in_lat,    start_lng: trip.put_in_lng,
      end_lat:   trip.take_out_lat,  end_lng:   trip.take_out_lng,
    });
    setEditing(false);
  }

  if (!tracks) return <Loading label="Lade Track…" />;

  const hasPoints = trip.put_in_lat != null || trip.take_out_lat != null;
  const hasTrack  = tracks.length > 0;

  return (
    <div>
      {editing ? (
        <>
          <MapPicker mode="start_end" value={draft} onChange={setDraft} />
          <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
            <div className="text-xs text-text-dim">
              Klick auf die Karte setzt Ein- und Ausstieg. Marker können gezogen werden.
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={cancel} disabled={saving}>Abbrechen</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" /> : <><Icon.Check size={16} /> Speichern</>}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl overflow-hidden border border-border" style={{ height: 'min(60vh, 520px)' }}>
            <MapyMap trip={trip} tracks={tracks} />
          </div>
          <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
            <div className="text-sm text-text-dim mono">
              {hasTrack ? (
                <>{tracks.reduce((s, t) => s + Number(t.distance_km || 0), 0).toFixed(1)} km · {tracks.reduce((s, t) => s + (t.point_count || 0), 0)} Punkte</>
              ) : hasPoints ? (
                'Ein-/Ausstieg gesetzt — kein Track'
              ) : (
                'Keine Karten-Daten — auf "Punkte setzen" klicken'
              )}
            </div>
            {isAdmin && (
              <div className="flex gap-2 flex-wrap">
                <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                  <Icon.Pin size={16} /> {hasPoints ? 'Punkte ändern' : 'Punkte setzen'}
                </button>
                <label className="btn btn-secondary cursor-pointer">
                  <Icon.Upload size={16} /> GPX hochladen
                  <input type="file" accept=".gpx,application/gpx+xml" hidden onChange={onUploadGpx} />
                </label>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TabPhotos({ photos, onOpen, onUpload, uploading, isAdmin, fileRef, trip, onUpdateTrip }) {
  if (!photos) return <Loading label="Lade Fotos…" />;
  const hasGps = photos.filter(p => p.gps_lat).length;
  // Effektive Cover-ID: explizit gewählt oder erstes Foto in Liste
  const coverId = trip.cover_photo_id ?? photos[0]?.id;

  async function setCover(photoId) {
    try {
      const updated = await api.setCover(trip.id, photoId);
      onUpdateTrip(updated);
    } catch (e) {
      alert('Fehler: ' + e.message);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="text-lg font-semibold"><span className="text-water">{photos.length}</span> Fotos</div>
          {hasGps > 0 && <div className="text-sm text-text-dim">{hasGps} mit GPS-Position</div>}
        </div>
        {isAdmin && (
          <label className="btn btn-primary cursor-pointer">
            {uploading ? `Lade ${uploading.done}/${uploading.total}…` : (<><Icon.Upload size={16} /> Fotos hochladen</>)}
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onUpload} disabled={!!uploading} />
          </label>
        )}
      </div>

      {photos.length === 0 && !uploading && (
        <div className="text-center text-text-dim py-12">
          Noch keine Fotos für diese Befahrung.
        </div>
      )}

      {isAdmin && photos.length > 0 && (
        <p className="text-xs text-text-dim mb-3">
          Klick aufs Foto = Vollbild · Klick aufs <Icon.Star size={12} className="inline" />-Symbol = Als Titelbild setzen
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-2 lg:gap-2.5">
        {isAdmin && (
          <button
            type="button"
            className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-text-dim hover:border-water hover:text-water hover:bg-water-glow transition-all"
            onClick={() => fileRef.current?.click()}
          >
            <Icon.Upload size={28} />
            <span className="text-xs font-medium">Hochladen</span>
          </button>
        )}
        {photos.map((p, i) => {
          const isCover = p.id === coverId;
          return (
            <div
              key={p.id}
              className={'relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ' + (isCover ? 'border-water shadow-glow' : 'border-transparent hover:border-water')}
            >
              <button
                type="button"
                className="w-full h-full block cursor-zoom-in"
                onClick={() => onOpen(i)}
              >
                <img
                  src={p.thumb_path || p.path}
                  loading="lazy"
                  alt={p.caption || ''}
                  className="w-full h-full object-cover"
                />
              </button>
              {p.gps_lat && (
                <span className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm text-water-light rounded-md px-1.5 py-0.5 text-[0.6rem] inline-flex items-center gap-1 pointer-events-none">
                  <Icon.Pin size={10} /> GPS
                </span>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCover(p.id); }}
                  title={isCover ? 'Aktuelles Titelbild' : 'Als Titelbild setzen'}
                  className={'absolute top-1.5 left-1.5 rounded-md p-1 backdrop-blur-sm transition-all ' + (isCover ? 'bg-water text-white' : 'bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-water')}
                >
                  <Icon.Star size={14} />
                </button>
              )}
              {isCover && (
                <span className="absolute bottom-1.5 left-1.5 bg-water text-white text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider pointer-events-none">
                  Titelbild
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabTeam({ trip }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="font-semibold text-sm uppercase tracking-wider text-text-faint mb-3">Team</h2>
        {trip.team?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {trip.team.map(m => <span key={m} className="bg-bg-3 text-text px-3 py-1.5 rounded-lg text-sm">{m}</span>)}
          </div>
        ) : <p className="text-text-faint italic text-sm">Keine Teilnehmer erfasst</p>}
      </div>
      <div>
        <h2 className="font-semibold text-sm uppercase tracking-wider text-text-faint mb-3">Ausrüstung</h2>
        {trip.gear?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {trip.gear.map(g => <span key={g} className="bg-bg-3 text-text-dim px-2.5 py-1 rounded-md text-xs">{g}</span>)}
          </div>
        ) : <p className="text-text-faint italic text-sm">Keine Ausrüstung erfasst</p>}
      </div>
      {trip.hazards?.length > 0 && (
        <div className="lg:col-span-2">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-text-faint mb-3">Gefahren / Beobachtungen</h2>
          <ul className="bg-bg-2 border border-border rounded-xl p-4 space-y-2 text-sm">
            {trip.hazards.map(h => <li key={h}>• {h}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────
function Row({ k, v }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-border text-sm">
      <span className="text-text-dim">{k}</span>
      <span className="mono text-text">{v}</span>
    </div>
  );
}
function StatTile({ label, value, sub, highlight }) {
  return (
    <div className="bg-bg-2 border border-border rounded-xl p-3.5">
      <div className="text-[0.65rem] text-text-faint uppercase tracking-wider mb-1.5">{label}</div>
      <div className={'mono font-semibold text-xl ' + (highlight ? 'text-water' : 'text-text')}>{value}</div>
      {sub && <div className="text-xs text-text-dim mt-0.5">{sub}</div>}
    </div>
  );
}
function DifficultyLine({ label, value }) {
  return (
    <div className="flex items-center gap-3 py-2 text-sm">
      <span className="w-24 text-text-dim">{label}</span>
      <DiffBars value={value} />
      <span className="mono text-text-dim ml-auto">{value} / 5</span>
    </div>
  );
}
function heroGradient(type) {
  return {
    river:   'linear-gradient(135deg,#0d3b66,#14b8a6 60%,#90cdf4)',
    lake:    'linear-gradient(135deg,#1e3a8a,#3b82f6 50%,#bae6fd)',
    cave:    'linear-gradient(135deg,#3b2210,#7a4a1c 60%,#b8823a)',
    portage: 'linear-gradient(135deg,#1a3d1a,#588055 50%,#84cc16)',
  }[type] || 'linear-gradient(135deg,#1b2934,#2a3a47)';
}
