import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Loading } from '../atoms.jsx';
import { TripTypeIcon } from '../icons.jsx';
import { tripTypeLabel } from '../atoms.jsx';

export default function StatsScreen() {
  const [s, setS] = useState(null);
  useEffect(() => { api.stats().then(setS); }, []);
  if (!s) return <Loading />;

  const yearMap = {};
  s.yearlyByType.forEach(r => {
    if (!yearMap[r.year]) yearMap[r.year] = { year: r.year, total: 0, byType: {} };
    yearMap[r.year].byType[r.trip_type] = Number(r.km);
    yearMap[r.year].total += Number(r.km);
  });
  const years = Object.values(yearMap).sort((a, b) => b.year - a.year);
  const maxKm = Math.max(...years.map(y => y.total), 1);

  return (
    <>
      <h1 className="page-title">Statistik</h1>
      <p className="page-subtitle">Alles auf einen Blick</p>

      {/* KPI-Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Tile label="Befahrungen total" value={s.kpi.total_trips} />
        <Tile label="Gewässer total" value={s.kpi.total_waters} />
        <Tile label="Kilometer total" value={Number(s.kpi.total_km).toFixed(1)} sub="km" highlight />
        <Tile label="Längster Trip" value={Number(s.kpi.longest_km).toFixed(1)} sub="km" />
      </div>

      {/* Jahre × Typen */}
      <h2 className="font-semibold text-sm uppercase tracking-wider text-text-faint mb-3">Kilometer pro Jahr</h2>
      <div className="bg-bg-2 border border-border rounded-xl p-4 mb-8">
        {years.map(y => (
          <div key={y.year} className="mb-3 last:mb-0">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="mono">{y.year}</span>
              <span className="mono font-semibold">{y.total.toFixed(1)} km</span>
            </div>
            <div className="flex h-4 rounded overflow-hidden bg-bg-3">
              {['river','lake','cave','portage'].map(t => {
                const km = y.byType[t] || 0;
                if (!km) return null;
                return <div key={t} title={`${tripTypeLabel(t)}: ${km.toFixed(1)} km`}
                            style={{ width: `${(km / maxKm) * 100}%`, background: `var(--c-type-${t})` }} />;
              })}
            </div>
          </div>
        ))}
        {!years.length && <div className="text-text-faint text-sm">Noch keine Daten.</div>}
      </div>

      {/* Top-Gewässer */}
      <h2 className="font-semibold text-sm uppercase tracking-wider text-text-faint mb-3">Top-Gewässer</h2>
      <div className="bg-bg-2 border border-border rounded-xl p-2 mb-8">
        {s.topWaters.map(w => (
          <div key={w.trip_type + w.water_id} className="flex items-center gap-3 p-3 border-b border-border last:border-b-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--c-water-glow)', color: `var(--c-type-${w.trip_type})` }}>
              <TripTypeIcon type={w.trip_type} size={18} />
            </div>
            <div className="flex-1">
              <div className="font-medium">{w.name}</div>
              <div className="text-xs text-text-dim mono">{tripTypeLabel(w.trip_type)} · {Number(w.km).toFixed(1)} km</div>
            </div>
            <div className="mono text-sm">{w.visits} ×</div>
          </div>
        ))}
        {!s.topWaters.length && <div className="text-text-faint text-sm p-4">Noch keine Daten.</div>}
      </div>

      {/* T/K/P-Verteilung */}
      <h2 className="font-semibold text-sm uppercase tracking-wider text-text-faint mb-3">Schwierigkeits-Verteilung</h2>
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {[['diff_t','Technisch'], ['diff_k','Körperlich'], ['diff_p','Psychisch']].map(([key, lbl]) => (
          <div key={key} className="bg-bg-2 border border-border rounded-xl p-4">
            <div className="text-sm font-medium mb-3">{lbl}</div>
            {[1,2,3,4,5].map(lv => {
              const row = s.tkpDist[key]?.find(r => r.level === lv);
              const count = row?.count || 0;
              const maxC = Math.max(...(s.tkpDist[key] || []).map(r => r.count), 1);
              return (
                <div key={lv} className="flex items-center gap-2 mb-1.5 text-xs mono">
                  <span className="w-3 text-text-dim">{lv}</span>
                  <div className="flex-1 h-3 bg-bg-3 rounded overflow-hidden">
                    <div className="h-full bg-water" style={{ width: `${(count / maxC) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-text-dim">{count}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <h2 className="font-semibold text-sm uppercase tracking-wider text-text-faint mb-3">Aktivität (365 Tage)</h2>
      <div className="bg-bg-2 border border-border rounded-xl p-4 overflow-x-auto">
        <Heatmap data={s.heatmap} />
      </div>
    </>
  );
}

function Tile({ label, value, sub, highlight }) {
  return (
    <div className="bg-bg-2 border border-border rounded-xl p-3.5">
      <div className="text-[0.65rem] text-text-faint uppercase tracking-wider mb-1.5">{label}</div>
      <div className={'mono font-semibold text-xl ' + (highlight ? 'text-water' : 'text-text')}>{value}</div>
      {sub && <div className="text-xs text-text-dim mt-0.5">{sub}</div>}
    </div>
  );
}

function Heatmap({ data }) {
  const dayMap = {};
  data.forEach(d => { dayMap[d.date] = d.count; });
  const max = Math.max(...data.map(d => d.count), 1);
  const today = new Date();
  const days = [];
  for (let i = 365; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: dayMap[key] || 0, dow: d.getDay() });
  }

  // Spalten (Wochen)
  const cols = [];
  let col = Array(7).fill(null);
  days.forEach(d => {
    const idx = (d.dow + 6) % 7; // Mo=0, So=6
    col[idx] = d;
    if (d.dow === 0) { // Sonntag = Wochenende
      cols.push(col);
      col = Array(7).fill(null);
    }
  });
  if (col.some(c => c)) cols.push(col);

  return (
    <div className="flex gap-[3px]">
      {cols.map((wk, i) => (
        <div key={i} className="flex flex-col gap-[3px]">
          {wk.map((d, j) => {
            if (!d) return <div key={j} className="w-3 h-3" />;
            const intensity = d.count / max;
            const bg = d.count === 0 ? 'var(--c-bg-3)'
                     : intensity < 0.34 ? 'rgba(20,184,166,.35)'
                     : intensity < 0.67 ? 'rgba(20,184,166,.65)'
                                        : 'var(--c-water)';
            return <div key={j} className="w-3 h-3 rounded-sm" style={{ background: bg }} title={`${d.date}: ${d.count} Trip${d.count === 1 ? '' : 's'}`} />;
          })}
        </div>
      ))}
    </div>
  );
}
