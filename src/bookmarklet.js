(function () {
  if (!window.Blob2ImageConverter || !window.Blob2ImageUI) {
    alert('Blob2Image: thiếu script.');
    return;
  }
  window.Blob2ImageUI.togglePanel();
})();
