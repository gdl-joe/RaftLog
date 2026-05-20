import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { TripCard, FilterChip, Loading, EmptyState } from '../atoms.jsx';
import { TripTypeIcon, Icon } from '../icons.jsx';

const TYPE_FILTERS = [
  { key: '',        label: 'Alle' },
  { key: 'river',   label: 'Fluss',   icon: 'river' },
  { key: 'lake',    label: 'See',     icon: 'lake' },
  { key: 'cave',    label: 'Höhle',   icon: 'cave' },
  { key: 'portage', label: 'Portage', icon: 'portage' },
];

const YEARS = (() => {
  const y = new Date().getFullYear();
  return [y, y - 1, y - 2];
})();

export default function FeedScreen({ go }) {
  const [type, setType]   = useState('');
  const [year, setYear]   = useState('');
  const [data, setData]   = useState(null);
  const [err, setErr]     = useState('');

  useEffect(() => {
    setData(null); setErr('');
    const params = { limit: 50 };
    if (type) params.type = type;
    if (year) params.year = year;
    api.listTrips(params).then(setData).catch(e => setErr(e.message));
  }, [type, year]);

  const trips = data?.items ?? [];

  return (
    <>
      <h1 className="page-title">Befahrungen</h1>
      <p className="page-subtitle">
        {data ? `${data.total} ${data.total === 1 ? 'Befahrung' : 'Befahrungen'}` : 'Lade…'}
        {year && ` · ${year}`}
      </p>

      <div className="filter-bar">
        {TYPE_FILTERS.map(f => (
          <FilterChip key={f.key} active={type === f.key} onClick={() => setType(f.key)}>
            {f.icon && <TripTypeIcon type={f.icon} size={14} style={{ color: `var(--c-type-${f.icon})` }} />}
            {f.label}
          </FilterChip>
        ))}
        {YEARS.map(y => (
          <FilterChip key={y} active={year === String(y)} onClick={() => setYear(year === String(y) ? '' : String(y))}>
            {y}
          </FilterChip>
        ))}
      </div>

      {err && <div className="text-sm text-danger p-3 bg-danger/10 border border-danger/30 rounded-lg">{err}</div>}
      {!data && !err && <Loading />}
      {data && trips.length === 0 && (
        <EmptyState
          icon={Icon.Waves}
          title="Noch keine Befahrungen"
          hint={type || year ? 'Versuche andere Filter.' : 'Lege deine erste Befahrung an.'}
        />
      )}

      {trips.length > 0 && (
        <div className="feed-grid">
          {trips.map(t => (
            <TripCard key={t.id} trip={t} onClick={() => go('detail', { id: t.id, title: t.title })} />
          ))}
        </div>
      )}
    </>
  );
}
