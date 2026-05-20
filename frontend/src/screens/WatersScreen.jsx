import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Loading, EmptyState } from '../atoms.jsx';
import { Icon, TripTypeIcon } from '../icons.jsx';

const TYPES = [
  { key: 'river',   label: 'Flüsse' },
  { key: 'lake',    label: 'Seen' },
  { key: 'cave',    label: 'Höhlen' },
  { key: 'portage', label: 'Portage' },
];

export default function WatersScreen({ go, initialType = 'river' }) {
  const [type, setType] = useState(initialType);
  const [items, setItems] = useState(null);

  useEffect(() => {
    setItems(null);
    api.listWaters(type).then(setItems);
  }, [type]);

  return (
    <>
      <h1 className="page-title">Gewässer</h1>
      <p className="page-subtitle">{items ? `${items.length} ${TYPES.find(t => t.key === type).label}` : 'Lade…'}</p>

      <div className="filter-bar mb-5">
        {TYPES.map(t => (
          <button key={t.key} className={'filter-chip ' + (type === t.key ? 'active' : '')} onClick={() => setType(t.key)}>
            <TripTypeIcon type={t.key} size={14} style={{ color: `var(--c-type-${t.key})` }} />
            {t.label}
          </button>
        ))}
      </div>

      {!items && <Loading />}
      {items && items.length === 0 && (
        <EmptyState icon={Icon.Waves} title={`Noch keine ${TYPES.find(t => t.key === type).label}`} hint="Beim Anlegen einer Befahrung kannst du neue Gewässer anlegen." />
      )}

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {items?.map(w => (
          <button
            key={w.id}
            className="bg-surface border border-border rounded-xl p-3.5 flex items-center gap-3.5 hover:border-water-dark hover:-translate-y-0.5 hover:shadow-md transition-all text-left"
            onClick={() => {/* TODO: Detail-Ansicht des Gewässers */}}
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: `var(--c-water-glow)`, color: `var(--c-type-${type})` }}>
              <TripTypeIcon type={type} size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{w.name}</div>
              <div className="text-xs text-text-dim mono mt-0.5 truncate">
                {[w.region, w.country].filter(Boolean).join(' · ')}
                {w.length_km && ` · ${w.length_km} km`}
                {w.area_km2 && ` · ${w.area_km2} km²`}
                {w.depth_m && ` · −${w.depth_m} m`}
                {w.distance_m && ` · ${w.distance_m} m`}
              </div>
            </div>
            <div className="bg-bg-3 rounded-lg px-3 py-1.5 text-center min-w-[60px]">
              <div className="mono font-semibold">{w.trip_count}</div>
              <div className="text-[0.65rem] text-text-dim">{w.trip_count === 1 ? 'Trip' : 'Trips'}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
