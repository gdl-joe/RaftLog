import { Icon, TripTypeIcon } from './icons.jsx';

// ─── Chip ─────────────────────────────────────────────────
export function Chip({ type, solid, children, className = '' }) {
  return (
    <span className={'chip ' + (solid ? 'solid ' : '') + className} data-type={type}>
      {children}
    </span>
  );
}

// ─── Difficulty Bars (T/K/P) ──────────────────────────────
export function DiffBars({ value = 0, max = 5 }) {
  return (
    <span className="diff-bars">
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={'diff-seg' + (i < value ? ' on' : '')} />
      ))}
    </span>
  );
}

export function DifficultyRow({ label, value }) {
  return (
    <div className="flex items-center gap-2 text-text-dim mono text-xs">
      <span>{label}</span>
      <DiffBars value={value} />
    </div>
  );
}

// ─── Star Rating (anzeigend) ──────────────────────────────
export function Rating({ value = 0 }) {
  return (
    <span className="text-sand text-base tracking-wider" title={`Bewertung ${value}/5`}>
      {'★'.repeat(value) + '☆'.repeat(5 - value)}
    </span>
  );
}

// ─── Filter-Chip ──────────────────────────────────────────
export function FilterChip({ active, children, onClick }) {
  return (
    <button className={'filter-chip ' + (active ? 'active' : '')} onClick={onClick}>
      {children}
    </button>
  );
}

// ─── Loading-State ────────────────────────────────────────
export function Loading({ label = 'Lade…' }) {
  return (
    <div className="flex items-center gap-3 text-text-dim p-6 justify-center">
      <span className="spinner" /> <span>{label}</span>
    </div>
  );
}

// ─── Empty-State ──────────────────────────────────────────
export function EmptyState({ icon: I = Icon.Info, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 text-text-dim gap-3">
      <I size={48} className="opacity-50" />
      <div className="text-text font-medium text-base">{title}</div>
      {hint && <div className="text-sm max-w-sm">{hint}</div>}
      {action}
    </div>
  );
}

// ─── Trip-Card (Feed) ─────────────────────────────────────
export function TripCard({ trip, onClick }) {
  const heroBg = trip.cover_photo
    ? `url(${trip.cover_photo})`
    : heroGradient(trip.trip_type);

  return (
    <article className="trip-card" onClick={onClick} tabIndex={0} role="button">
      <div className="trip-hero" style={{ backgroundImage: heroBg }}>
        <div className="trip-hero-info">
          <Chip type={trip.trip_type}>
            <TripTypeIcon type={trip.trip_type} size={14} />
            {tripTypeLabel(trip.trip_type)}
          </Chip>
          {trip.ww_grade && <Chip type={trip.trip_type} className="bg-water/20">{trip.ww_grade}</Chip>}
          {trip.wind_beaufort && <Chip type={trip.trip_type}>Bf {trip.wind_beaufort}</Chip>}
          {trip.wet && <Chip type={trip.trip_type}>{trip.wet}</Chip>}
          <span className="meta-date">{formatDate(trip.date_from)}</span>
        </div>
      </div>
      <div className="trip-body">
        <h3 className="trip-title">{trip.title}</h3>
        <div className="trip-meta">
          {trip.water_name}
          {trip.distance_km != null && ' · ' + Number(trip.distance_km).toFixed(1) + ' km'}
          {trip.duration_min != null && ' · ' + formatDuration(trip.duration_min)}
        </div>
        <div className="trip-footer">
          <div className="flex gap-3 flex-wrap">
            <DifficultyRow label="T" value={trip.difficulty?.t || 0} />
            <DifficultyRow label="K" value={trip.difficulty?.k || 0} />
            <DifficultyRow label="P" value={trip.difficulty?.p || 0} />
          </div>
          {trip.rating > 0 && <Rating value={trip.rating} />}
        </div>
      </div>
    </article>
  );
}

// ─── Helpers ──────────────────────────────────────────────
export function tripTypeLabel(type) {
  return { river: 'Fluss', lake: 'See', cave: 'Höhle', portage: 'Portage' }[type] || type;
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDuration(min) {
  if (!min) return '';
  const h = Math.floor(min / 60), m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function heroGradient(type) {
  return {
    river:   'linear-gradient(135deg,#0d3b66,#14b8a6 60%,#90cdf4)',
    lake:    'linear-gradient(135deg,#1e3a8a,#3b82f6 50%,#bae6fd)',
    cave:    'linear-gradient(135deg,#3b2210,#7a4a1c 60%,#b8823a)',
    portage: 'linear-gradient(135deg,#1a3d1a,#588055 50%,#84cc16)',
  }[type] || 'linear-gradient(135deg,#1b2934,#2a3a47)';
}
