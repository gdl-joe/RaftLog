// Lucide-style inline SVG icons. Stroke 2, 24×24.

const c = 'stroke-current fill-none';
const baseProps = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

function I({ size = 22, children, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...baseProps}>
      {children}
    </svg>
  );
}

export const Icon = {
  Home:    p => <I {...p}><path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/></I>,
  Map:     p => <I {...p}><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2Z"/><path d="M9 4v16M15 6v16"/></I>,
  Plus:    p => <I {...p}><path d="M12 5v14M5 12h14"/></I>,
  Waves:   p => <I {...p}>
    <path d="M2 6c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2"/>
    <path d="M2 12c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2"/>
    <path d="M2 18c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2"/>
  </I>,
  User:    p => <I {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></I>,
  Search:  p => <I {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></I>,
  Menu:    p => <I {...p}><path d="M4 6h16M4 12h16M4 18h16"/></I>,
  Back:    p => <I {...p}><path d="m15 18-6-6 6-6"/></I>,
  More:    p => <I {...p}><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></I>,
  X:       p => <I {...p}><path d="M18 6 6 18M6 6l12 12"/></I>,
  Check:   p => <I {...p}><path d="m5 12 5 5 9-12"/></I>,
  ChevronRight: p => <I {...p}><path d="m9 6 6 6-6 6"/></I>,
  River:   p => <I {...p}>
    <path d="M2 16c3 0 3-3 6-3s3 3 6 3 3-3 6-3 2 2 2 2"/>
    <path d="M2 9c3 0 3-3 6-3s3 3 6 3 3-3 6-3 2 2 2 2"/>
  </I>,
  Lake:    p => <I {...p}><ellipse cx="12" cy="14" rx="9" ry="5"/><path d="M5 11c2-3 5-4 7-4s5 1 7 4"/></I>,
  Cave:    p => <I {...p}><path d="M3 21V11a9 9 0 0 1 18 0v10"/><path d="M9 21v-5a3 3 0 0 1 6 0v5"/></I>,
  Portage: p => <I {...p}><path d="M3 20h18"/><path d="m7 20 5-12 5 12"/><circle cx="12" cy="5" r="2"/></I>,
  Stats:   p => <I {...p}><path d="M3 21V3"/><path d="M21 21H3"/><path d="M7 17v-5M12 17V9M17 17v-8"/></I>,
  Camera:  p => <I {...p}><path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="4"/></I>,
  Pin:     p => <I {...p}><path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></I>,
  Clock:   p => <I {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></I>,
  Calendar:p => <I {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></I>,
  Cloud:   p => <I {...p}><path d="M6 18a4 4 0 1 1 1-7.8 5 5 0 0 1 9.8 1.3A4 4 0 1 1 18 18Z"/></I>,
  Team:    p => <I {...p}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M14 20c0-2 2-4 5-4"/></I>,
  Settings:p => <I {...p}><circle cx="12" cy="12" r="3"/><path d="M20 12c0-.4 0-.8-.1-1.2l2-1.5-2-3.4-2.3.8a7 7 0 0 0-2.1-1.2L15 3h-4l-.5 2.5a7 7 0 0 0-2.1 1.2l-2.3-.8-2 3.4 2 1.5A7 7 0 0 0 6 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.8c.6.5 1.3.9 2.1 1.2L11 21h4l.5-2.5c.8-.3 1.5-.7 2.1-1.2l2.3.8 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/></I>,
  Info:    p => <I {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 12h1v5h1"/></I>,
  Upload:  p => <I {...p}><path d="M12 4v12M8 8l4-4 4 4"/><path d="M4 18h16"/></I>,
  Star:    p => <I {...p}><path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/></I>,
  Trash:   p => <I {...p}><path d="M3 6h18M8 6V4h8v2"/><path d="m5 6 1 14h12l1-14"/></I>,
  Edit:    p => <I {...p}><path d="M4 20h4l10-10-4-4L4 16v4Z"/></I>,
  Wind:    p => <I {...p}><path d="M2 8h13a3 3 0 1 0-3-3"/><path d="M2 13h17a3 3 0 1 1-3 3"/><path d="M2 18h9"/></I>,
  Logout:  p => <I {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5"/><path d="M5 12h12"/></I>,
  Grid:    p => <I {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></I>,
};

export function TripTypeIcon({ type, ...rest }) {
  if (type === 'river')   return <Icon.River {...rest}/>;
  if (type === 'lake')    return <Icon.Lake {...rest}/>;
  if (type === 'cave')    return <Icon.Cave {...rest}/>;
  if (type === 'portage') return <Icon.Portage {...rest}/>;
  return <Icon.Waves {...rest}/>;
}

export const TRIP_TYPES = [
  { key: 'river',   label: 'Fluss',   sub: 'Wildwasser, Strömung, WW-Grad' },
  { key: 'lake',    label: 'See',     sub: 'Stillwasser, Wind, Querung' },
  { key: 'cave',    label: 'Höhle',   sub: 'Packraft in Höhle, Tiefe' },
  { key: 'portage', label: 'Portage', sub: 'Tragen / Schieben, Übergang' },
];
