(function initBlob2ImageConverter() {
  if (window.Blob2ImageConverter) return;

  const BLOB_URL = /^blob:https?:\/\//i;
  const MIME = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
  const EXT = { original: '', png: 'png', jpeg: 'jpg', webp: 'webp' };

  function isValidBlobUrl(url) {
    return typeof url === 'string' && BLOB_URL.test(url.trim());
  }

  function defaultFilename(prefix = 'blob-image') {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${prefix}-${ts}`;
  }

  function mimeToExt(mime) {
    if (!mime) return 'bin';
    if (mime.includes('png')) return 'png';
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
    if (mime.includes('webp')) return 'webp';
    if (mime.includes('gif')) return 'gif';
    return 'bin';
  }

  function outputFilename(name, format, blob) {
    const base = (name || defaultFilename()).trim().replace(/[<>:"/\\|?*]+/g, '-').replace(/\.(png|jpe?g|webp|gif|bin)$/i, '');
    if (format === 'original') return `${base}.${mimeToExt(blob.type)}`;
    return `${base}.${EXT[format]}`;
  }

  async function fetchBlob(url) {
    const trimmed = url.trim();
    if (!isValidBlobUrl(trimmed)) throw new Error('URL phải bắt đầu bằng blob:https://...');

    let res;
    try {
      res = await fetch(trimmed);
    } catch {
      throw new Error('Không thể fetch blob URL. Hãy chạy tool trên cùng tab đã tạo blob.');
    }

    if (!res.ok) throw new Error('Blob không còn tồn tại hoặc đã hết hạn.');
    const blob = await res.blob();
    if (!blob?.size) throw new Error('Blob rỗng hoặc không hợp lệ.');
    return blob;
  }

  function loadImage(blob) {
    return new Promise((resolve, reject) => {
      const src = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(src); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(src); reject(new Error('Không thể đọc ảnh từ blob.')); };
      img.src = src;
    });
  }

  function toCanvasBlob(canvas, mime, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(`Không hỗ trợ xuất ${mime}.`))), mime, quality);
    });
  }

  async function convertBlob(blob, format, quality = 0.92) {
    if (format === 'original') return blob;

    const mime = MIME[format];
    if (!mime) throw new Error(`Định dạng không hỗ trợ: ${format}`);

    const img = await loadImage(blob);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas không khả dụng.');

    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);

    try {
      return await toCanvasBlob(canvas, mime, quality);
    } catch (err) {
      if (format === 'webp') return toCanvasBlob(canvas, MIME.png, quality);
      throw err;
    }
  }

  function download(blob, filename) {
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  async function convertAndDownload({ url, format = 'original', quality = 0.92, filename = '' }) {
    const source = await fetchBlob(url);
    let output = source;
    let usedFormat = format;

    try {
      output = await convertBlob(source, format, quality);
    } catch (err) {
      if (format !== 'webp') throw err;
      output = await convertBlob(source, 'png', quality);
      usedFormat = 'png';
    }

    const name = outputFilename(filename || defaultFilename('tiktok-image'), usedFormat, source);
    download(output, name);
    return { filename: name, format: usedFormat };
  }

  async function previewUrl(url) {
    return URL.createObjectURL(await fetchBlob(url));
  }

  window.Blob2ImageConverter = {
    isValidBlobUrl,
    defaultFilename,
    convertAndDownload,
    previewUrl,
  };
})();
