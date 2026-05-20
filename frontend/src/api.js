// RaftLog API-Client — credentials: 'include' für Cookie-Sessions

const API = '/api';

let csrfToken = null;

async function ensureCsrf() {
  if (csrfToken) return csrfToken;
  const r = await fetch(API + '/auth/csrf', { credentials: 'include' });
  const j = await r.json();
  csrfToken = j.csrf;
  return csrfToken;
}

async function call(path, opts = {}) {
  const isMutate = opts.method && opts.method !== 'GET';
  const isFormData = opts.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(opts.headers || {}),
  };
  if (isMutate) {
    headers['X-CSRF-Token'] = await ensureCsrf();
  }
  const r = await fetch(API + path, {
    ...opts,
    credentials: 'include',
    headers,
  });
  if (r.status === 204) return null;
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(j.error || 'Netzwerkfehler');
    err.status = r.status;
    throw err;
  }
  return j;
}

export const api = {
  // Auth
  me:       ()              => call('/auth/me'),
  login:    (email, pwd)    => call('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: pwd }) }).then(r => { csrfToken = r.csrf; return r.user; }),
  logout:   ()              => call('/auth/logout', { method: 'POST' }).then(() => { csrfToken = null; }),

  // Trips
  listTrips: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return call('/trips' + (q ? '?' + q : ''));
  },
  getTrip:   (id)         => call('/trips?id=' + encodeURIComponent(id)),
  createTrip:(data)       => call('/trips', { method: 'POST', body: JSON.stringify(data) }),
  updateTrip:(id, data)   => call('/trips?id=' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTrip:(id)         => call('/trips?id=' + encodeURIComponent(id), { method: 'DELETE' }),

  // Waters (rivers/lakes/caves/portages)
  listWaters:(type)       => call('/waters?type=' + type),
  getWater:  (type, id)   => call('/waters?type=' + type + '&id=' + encodeURIComponent(id)),
  createWater:(type, data)=> call('/waters?type=' + type, { method: 'POST', body: JSON.stringify(data) }),
  updateWater:(type, id, data) => call('/waters?type=' + type + '&id=' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(data) }),
  deleteWater:(type, id)  => call('/waters?type=' + type + '&id=' + encodeURIComponent(id), { method: 'DELETE' }),

  // Photos
  listPhotos:(tripId)     => call('/photos?trip_id=' + encodeURIComponent(tripId)),
  deletePhoto:(id)        => call('/photos?id=' + encodeURIComponent(id), { method: 'DELETE' }),
  setCover:  (tripId, photoId) => call('/trips?id=' + encodeURIComponent(tripId), { method: 'PATCH', body: JSON.stringify({ cover_photo_id: photoId }) }),
  uploadPhoto:async (tripId, file, caption = '') => {
    await ensureCsrf();
    const fd = new FormData();
    fd.append('trip_id', tripId);
    fd.append('photo', file);
    if (caption) fd.append('caption', caption);
    return call('/upload', { method: 'POST', body: fd });
  },

  // Tracks (GPX)
  listTracks:(tripId)     => call('/tracks?trip_id=' + encodeURIComponent(tripId)),
  getTrack:  (id)         => call('/tracks?id=' + id),
  uploadGpx: async (tripId, file) => {
    await ensureCsrf();
    const fd = new FormData();
    fd.append('trip_id', tripId);
    fd.append('gpx', file);
    return call('/tracks', { method: 'POST', body: fd });
  },
  saveLiveTrack: (tripId, points) => call('/tracks', { method: 'POST', body: JSON.stringify({ trip_id: tripId, points }) }),
  deleteTrack:(id)        => call('/tracks?id=' + id, { method: 'DELETE' }),

  // Stats / Users
  stats:    ()            => call('/stats'),
  listUsers:()            => call('/users'),
  updateMe: (data)        => call('/users', { method: 'PATCH', body: JSON.stringify(data) }),
};

// Parallel-Upload-Pool für viele Fotos
export async function uploadPhotosParallel(tripId, files, { concurrency = 3, onProgress } = {}) {
  const results = [];
  let done = 0;
  const queue = [...files];
  const workers = Array.from({ length: Math.min(concurrency, files.length) }, async () => {
    while (queue.length) {
      const f = queue.shift();
      if (!f) break;
      try {
        const r = await api.uploadPhoto(tripId, f);
        results.push({ ok: true, file: f, result: r });
      } catch (e) {
        results.push({ ok: false, file: f, error: e.message });
      } finally {
        done++;
        onProgress?.(done, files.length);
      }
    }
  });
  await Promise.all(workers);
  return results;
}
