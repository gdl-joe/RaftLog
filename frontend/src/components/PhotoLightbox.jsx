import { useEffect, useState } from 'react';
import { Icon } from '../icons.jsx';

export default function PhotoLightbox({ photos, index: initial, onClose }) {
  const [i, setI] = useState(initial);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI(v => Math.min(photos.length - 1, v + 1));
      if (e.key === 'ArrowLeft')  setI(v => Math.max(0, v - 1));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [photos.length, onClose]);

  const photo = photos[i];
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <button className="absolute top-4 right-4 text-white/80 hover:text-white p-2" onClick={onClose} aria-label="Schließen">
        <Icon.X size={28} />
      </button>

      <div className="absolute top-4 left-4 text-white/80 mono text-sm">{i + 1} / {photos.length}</div>

      <button
        className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white inline-flex items-center justify-center disabled:opacity-30"
        onClick={(e) => { e.stopPropagation(); setI(v => Math.max(0, v - 1)); }}
        disabled={i === 0}
        aria-label="Vorheriges Foto"
      >
        <Icon.Back size={22} />
      </button>

      <img
        src={photo.large_path || photo.path}
        alt={photo.caption || ''}
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      <button
        className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white inline-flex items-center justify-center disabled:opacity-30"
        onClick={(e) => { e.stopPropagation(); setI(v => Math.min(photos.length - 1, v + 1)); }}
        disabled={i === photos.length - 1}
        aria-label="Nächstes Foto"
      >
        <Icon.ChevronRight size={22} />
      </button>

      {photo.caption && (
        <div className="absolute bottom-6 left-6 right-6 text-center text-white/90 text-sm">{photo.caption}</div>
      )}
    </div>
  );
}
