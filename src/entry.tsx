// Separate entry points: Pages never starts account/API functionality.
if (import.meta.env.VITE_GITHUB_PAGES === 'true') {
  void import('./pages/PagesDemo');
} else {
  void import('./main');
}
