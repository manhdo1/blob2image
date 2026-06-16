(function () {
  if (!window.Drive2PDF || !window.jspdf) {
    console.error('Drive2PDF: thiếu script. Chạy npm run build:drive.');
    return;
  }
  window.Drive2PDF.open();
})();
