'use strict';
const root = document.documentElement;
const themeButton = document.getElementById('theme-toggle');
function updateTheme(value) {
  root.dataset.theme = value;
  const light = value === 'light';
  themeButton.setAttribute('aria-pressed', String(light));
  themeButton.setAttribute('aria-label', light ? '切换为深色主题' : '切换为浅色主题');
  themeButton.querySelector('.theme-icon').textContent = light ? '☾' : '☼';
  themeButton.querySelector('.theme-label').textContent = light ? '深色' : '浅色';
  document.querySelector('meta[name="theme-color"]').content = light ? '#f3f1e9' : '#061321';
  try { localStorage.setItem('lightweaver-theme', value); } catch {}
}
updateTheme(root.dataset.theme);
themeButton.addEventListener('click', () => updateTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
const dialog = document.getElementById('video-dialog');
const video = document.getElementById('gameplay-video');
let opener;
document.querySelectorAll('[data-watch]').forEach(button => button.addEventListener('click', () => {
  opener = button;
  dialog.showModal();
  document.body.classList.add('modal-open');
  video.play().catch(() => {});
}));
document.getElementById('close-video').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  video.pause();
  document.body.classList.remove('modal-open');
  opener?.focus();
});

// This public manifest is edited only after an explicit release receipt.
// A successful HTTP response never changes the game's review status.
const publicAssets = new Set([
  'assets/hero.webp', 'assets/logo.webp', 'assets/icon.png',
  'assets/screenshots/01-wing.webp', 'assets/screenshots/01-wing.png',
  'assets/screenshots/02-camp.webp', 'assets/screenshots/02-camp.png',
  'assets/screenshots/03-workshop.webp', 'assets/screenshots/03-workshop.png',
  'assets/lightweaver-r68-gameplay-29s.mp4',
  'assets/lightweaver-morning-tide-workshop-720p.mp4'
]);
let publicRevision = '';
let adoptedVideoIdentity = '';
const adoptedAssetVersions = new Map();
const publicStateURL = new URL('site-state.json', document.baseURI);
function assetURL(path, version) {
  const url = new URL(path, document.baseURI);
  url.searchParams.set('v', version);
  return url.href;
}
function publicAssetPath(value) {
  const url = new URL(value, document.baseURI);
  if (url.origin !== location.origin) return null;
  return [...publicAssets].find(path => new URL(path, document.baseURI).pathname === url.pathname) || null;
}
function replaceVideoSource(url) {
  const state = { time: video.currentTime, paused: video.paused, volume: video.volume, muted: video.muted, rate: video.playbackRate };
  const source = video.querySelector('source');
  if (!source || source.src === url) return;
  source.src = url;
  video.addEventListener('loadedmetadata', () => {
    video.currentTime = Math.min(state.time, Number.isFinite(video.duration) ? Math.max(0, video.duration - .05) : state.time);
    video.volume = state.volume; video.muted = state.muted; video.playbackRate = state.rate;
    if (!state.paused && dialog.open) video.play().catch(() => {});
  }, { once: true });
  video.load();
}
function adoptPublicVideo(media) {
  if (!media || !publicAssets.has(media.path) || !media.path.endsWith('.mp4') || typeof media.version !== 'string' || !/^[a-zA-Z0-9._-]{1,80}$/.test(media.version)) return;
  const fields = ['watchLabel', 'caption', 'detail', 'dialogMeta', 'note'];
  if (fields.some(key => typeof media[key] !== 'string' || media[key].length > 300) || typeof media.ariaLabel !== 'string') return;
  fields.forEach(key => document.querySelectorAll(`[data-public-video="${key}"]`).forEach(node => {
    if (node.textContent !== media[key]) node.textContent = media[key];
  }));
  const poster = document.querySelector('.video-poster');
  if (poster.getAttribute('aria-label') !== media.ariaLabel) poster.setAttribute('aria-label', media.ariaLabel);
  const url = assetURL(media.path, media.version);
  document.querySelectorAll('[data-public-video-link]').forEach(link => { if (link.href !== url) link.href = url; });
  const identity = `${media.path}@${media.version}`;
  if (identity !== adoptedVideoIdentity) {
    if (video.readyState > 0 || !video.paused) replaceVideoSource(url);
    else { video.querySelector('source').src = url; video.load(); }
    adoptedVideoIdentity = identity;
  }
}
function adoptPublicState(state) {
  if (state.schemaVersion !== 1 || typeof state.revision !== 'string' || state.revision === publicRevision) return;
  if (!state.status || !['review_pending', 'available'].includes(state.status.phase)) return;
  const fields = ['summary', 'availability', 'note'];
  if (fields.some(key => typeof state.status[key] !== 'string' || state.status[key].length > 400)) return;
  const statusURL = new URL(state.status.url);
  if (statusURL.protocol !== 'https:') return;
  fields.forEach(key => document.querySelectorAll(`[data-public-status="${key}"]`).forEach(node => {
    if (node.textContent !== state.status[key]) node.textContent = state.status[key];
  }));
  document.querySelectorAll('[data-public-status-link]').forEach(link => {
    if (link.href !== statusURL.href) link.href = statusURL.href;
  });
  for (const [path, version] of Object.entries(state.assetVersions || {})) {
    if (!publicAssets.has(path) || typeof version !== 'string' || !/^[a-zA-Z0-9._-]{1,80}$/.test(version) || adoptedAssetVersions.get(path) === version) continue;
    if (state.video && path.endsWith('.mp4')) { adoptedAssetVersions.set(path, version); continue; }
    const url = assetURL(path, version);
    document.querySelectorAll('img[src], link[rel="icon"][href], a[href], video[poster]').forEach(node => {
      const attr = node.tagName === 'IMG' ? 'src' : node.tagName === 'VIDEO' ? 'poster' : 'href';
      if (publicAssetPath(node.getAttribute(attr)) === path && node.getAttribute(attr) !== url) node.setAttribute(attr, url);
    });
    if (path === 'assets/hero.webp') document.querySelector('.play-section').style.backgroundImage = `url("${url}")`;
    if (path.endsWith('.mp4')) {
      if (video.readyState > 0 || !video.paused) replaceVideoSource(url);
      else { video.querySelector('source').src = url; video.load(); }
    }
    adoptedAssetVersions.set(path, version);
  }
  adoptPublicVideo(state.video);
  publicRevision = state.revision;
}
let publicStateCheckRunning = false;
async function checkPublicState() {
  if (publicStateCheckRunning) return;
  publicStateCheckRunning = true;
  try {
    const url = new URL(publicStateURL); url.searchParams.set('_', Date.now());
    const response = await fetch(url, { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(6000) });
    if (response.ok) adoptPublicState(await response.json());
  } catch { /* Keep the current page usable offline; retry without a UI interruption. */ }
  finally { publicStateCheckRunning = false; }
}
checkPublicState();
setInterval(checkPublicState, 8000);
window.addEventListener('online', checkPublicState);
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkPublicState(); });
