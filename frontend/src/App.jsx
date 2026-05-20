import { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import { Icon } from './icons.jsx';

import LoginScreen   from './screens/LoginScreen.jsx';
import FeedScreen    from './screens/FeedScreen.jsx';
import DetailScreen  from './screens/DetailScreen.jsx';
import NewScreen     from './screens/NewScreen.jsx';
import EditTripScreen from './screens/EditTripScreen.jsx';
import MapScreen     from './screens/MapScreen.jsx';
import WatersScreen  from './screens/WatersScreen.jsx';
import StatsScreen   from './screens/StatsScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';

const NAV_ITEMS = [
  { key: 'feed',    label: 'Feed',     icon: Icon.Home,  pos: 0 },
  { key: 'map',     label: 'Karte',    icon: Icon.Map,   pos: 1 },
  { key: 'new',     label: 'Neu',      icon: Icon.Plus,  pos: 2, fab: true },
  { key: 'waters',  label: 'Gewässer', icon: Icon.Waves, pos: 3 },
  { key: 'profile', label: 'Profil',   icon: Icon.User,  pos: 4 },
];

const SIDEBAR_ITEMS = [
  { key: 'feed',    label: 'Feed',         icon: Icon.Home },
  { key: 'map',     label: 'Karte',        icon: Icon.Map },
  { key: 'waters',  label: 'Gewässer',     icon: Icon.Waves },
  { key: 'stats',   label: 'Statistik',    icon: Icon.Stats },
];

export default function App() {
  const [user, setUser]     = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [view, setView]     = useState({ name: 'feed', params: {} });
  const [theme, setTheme]   = useState(() => localStorage.getItem('rl_theme') || 'dark');

  // Theme persistieren
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rl_theme', theme);
  }, [theme]);

  // Auth-Check beim Start
  useEffect(() => {
    api.me().then(setUser).catch(() => {}).finally(() => setAuthChecked(true));
  }, []);

  // URL-Query → Initial-View
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('new') === '1') setView({ name: 'new' });
    else if (p.get('screen')) setView({ name: p.get('screen') });
  }, []);

  const go = useCallback((name, params = {}) => {
    setView({ name, params });
    window.scrollTo(0, 0);
  }, []);

  if (!authChecked) return null;
  if (!user)        return <LoginScreen onLogin={setUser} />;

  const isAdmin = user.role === 'admin';
  const showFab = isAdmin;

  const renderView = () => {
    switch (view.name) {
      case 'feed':    return <FeedScreen go={go} />;
      case 'detail':  return <DetailScreen id={view.params.id} go={go} user={user} />;
      case 'new':     return <NewScreen go={go} user={user} />;
      case 'edit':    return <EditTripScreen id={view.params.id} go={go} />;
      case 'map':     return <MapScreen go={go} />;
      case 'waters':  return <WatersScreen go={go} initialType={view.params.type} />;
      case 'stats':   return <StatsScreen go={go} />;
      case 'profile': return <ProfileScreen user={user} onLogout={() => { setUser(null); api.logout(); }} onUpdate={setUser} setTheme={setTheme} theme={theme} />;
      default:        return <FeedScreen go={go} />;
    }
  };

  // Aktiver Nav-Key (Detail / Edit fallback auf Feed)
  const activeNav = ['detail','edit'].includes(view.name) ? 'feed' : view.name;

  return (
    <div className="app">
      {/* Sidebar (Desktop) */}
      <aside className="sidebar">
        <div className="flex items-center gap-2.5 px-2 pb-5 font-bold text-lg">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-water to-water-dark text-white">
            <Icon.Waves size={16} />
          </span>
          RaftLog
        </div>

        {SIDEBAR_ITEMS.map(item => (
          <SideItem key={item.key} item={item} active={activeNav === item.key} onClick={() => go(item.key)} />
        ))}

        {isAdmin && (
          <button
            className="mt-2 inline-flex items-center justify-center gap-2 bg-water text-white rounded-xl px-3 py-2.5 font-semibold hover:bg-water-light transition-all shadow-glow"
            onClick={() => go('new')}
          >
            <Icon.Plus size={18} />
            Neue Befahrung
          </button>
        )}

        <div className="text-xs uppercase tracking-wider text-text-faint px-3 pt-5 pb-1.5">Konto</div>
        <SideItem item={{ label: 'Profil', icon: Icon.User }} active={view.name === 'profile'} onClick={() => go('profile')} />
      </aside>

      {/* Header */}
      <header className="app-header">
        {['detail','edit','new'].includes(view.name) ? (
          <button className="w-10 h-10 rounded-lg inline-flex items-center justify-center text-text-dim hover:bg-bg-3 hover:text-text transition-all" onClick={() => history.length > 1 ? go('feed') : go('feed')}>
            <Icon.Back size={22} />
          </button>
        ) : (
          <div className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-water to-water-dark text-white">
            <Icon.Waves size={16} />
          </div>
        )}
        <div className="font-semibold text-base">{titleFor(view, user)}</div>
        <div className="flex-1" />
        <button className="w-10 h-10 rounded-lg inline-flex items-center justify-center text-text-dim hover:bg-bg-3 hover:text-text transition-all" aria-label="Suchen">
          <Icon.Search size={22} />
        </button>
      </header>

      {/* Main */}
      <main className="app-main">{renderView()}</main>

      {/* Bottom-Nav (Mobile) */}
      <nav className="bottom-nav lg:hidden">
        {NAV_ITEMS.map(item => {
          const Active = activeNav === item.key;
          if (item.fab) {
            if (!showFab) return <div key={item.key} />;
            return (
              <button key={item.key} className="relative flex flex-col items-center justify-center" onClick={() => go('new')}>
                <span className="absolute -top-4 w-13 h-13 rounded-full bg-water flex items-center justify-center shadow-glow" style={{ width: 52, height: 52 }}>
                  <Icon.Plus size={26} className="text-white" />
                </span>
              </button>
            );
          }
          return (
            <button key={item.key} className={'flex flex-col items-center justify-center gap-0.5 ' + (Active ? 'text-water' : 'text-text-dim')} onClick={() => go(item.key)}>
              <item.icon size={22} />
              <span className="text-[0.65rem] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function SideItem({ item, active, onClick }) {
  const Cls = 'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all font-medium text-sm ';
  return (
    <a
      className={Cls + (active ? 'bg-water-glow text-water' : 'text-text-dim hover:bg-bg-3 hover:text-text')}
      onClick={onClick}
    >
      <item.icon size={20} />
      {item.label}
    </a>
  );
}

function titleFor(view, user) {
  if (view.name === 'feed')    return 'RaftLog';
  if (view.name === 'map')     return 'Karte';
  if (view.name === 'waters')  return 'Gewässer';
  if (view.name === 'stats')   return 'Statistik';
  if (view.name === 'profile') return 'Profil';
  if (view.name === 'new')     return 'Neue Befahrung';
  if (view.name === 'detail')  return view.params?.title || 'Befahrung';
  if (view.name === 'edit')    return 'Bearbeiten';
  return 'RaftLog';
}
