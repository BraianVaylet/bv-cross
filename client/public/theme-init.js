// Aplica el tema antes del primer paint para evitar parpadeo (FOUC).
(function () {
  try {
    var saved = localStorage.getItem('bv-theme');
    var dark = saved
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#191B16' : '#F7F8F3');
  } catch (e) {
    /* sin acceso a storage: tema claro por defecto */
  }
})();
