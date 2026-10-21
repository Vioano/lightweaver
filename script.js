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
