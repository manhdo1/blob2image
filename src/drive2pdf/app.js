(function initDrive2PDF() {
  if (window.Drive2PDF) return;

  const PANEL_ID = 'drive2pdf-panel';
  const POSITION_TOLERANCE = 5;
  const PX_TO_MM = 25.4 / 96;

  function pdfFilename() {
    const title = document.title?.replace(/\s*-\s*Google Drive\s*$/i, '').trim() || 'drive-document';
    const safe = title.replace(/[<>:"/\\|?*]+/g, '-').replace(/\.pdf$/i, '').slice(0, 120);
    return `${safe || 'drive-document'}.pdf`;
  }

  function scanPages() {
    const roots = [
      document.querySelector('[role="document"]'),
      document.querySelector('.ndfHFb-c4SOm-wrapper')?.closest('[role="main"]'),
      document.body,
    ].filter(Boolean);

    const pages = [];
    const seenSrc = new Set();
    const seenTop = [];

    for (const root of roots) {
      root.querySelectorAll('img[src^="blob:"]').forEach((img) => {
        const rect = img.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0 || seenSrc.has(img.src)) return;
        const top = rect.top + window.scrollY;
        if (seenTop.some((y) => Math.abs(y - top) < POSITION_TOLERANCE)) return;
        seenSrc.add(img.src);
        seenTop.push(top);
        pages.push({ type: 'img', element: img, top });
      });
    }

    for (const root of roots) {
      root.querySelectorAll('canvas').forEach((canvas) => {
        if (canvas.width < 10 || canvas.height < 10) return;
        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const top = rect.top + window.scrollY;
        if (seenTop.some((y) => Math.abs(y - top) < POSITION_TOLERANCE)) return;
        seenTop.push(top);
        pages.push({ type: 'canvas', element: canvas, top });
      });
    }

    return pages.sort((a, b) => a.top - b.top);
  }

  function rasterize(el, type) {
    const width = type === 'img' ? el.naturalWidth || el.width : el.width;
    const height = type === 'img' ? el.naturalHeight || el.height : el.height;
    if (!width || !height) throw new Error('Ảnh chưa load xong. Cuộn tới trang đó rồi quét lại.');

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas không khả dụng.');
    ctx.drawImage(el, 0, 0, width, height);

    try {
      return { dataUrl: canvas.toDataURL('image/jpeg', 0.92), width, height };
    } catch {
      return { dataUrl: canvas.toDataURL('image/png'), width, height };
    }
  }

  async function extractPages(sources, onProgress) {
    const pages = [];
    for (let i = 0; i < sources.length; i += 1) {
      onProgress?.(i + 1, sources.length);
      const source = sources[i];
      if (!source.element?.isConnected) {
        throw new Error('Trang không còn trên DOM. Cuộn lại và quét trang mới.');
      }
      pages.push(rasterize(source.element, source.type));
    }
    return pages;
  }

  function compilePdf(pages, onProgress) {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) throw new Error('jsPDF chưa được nạp.');
    if (!pages.length) throw new Error('Không có trang để ghép PDF.');

    let pdf = null;
    pages.forEach((page, index) => {
      onProgress?.(index + 1, pages.length);
      const w = page.width * PX_TO_MM;
      const h = page.height * PX_TO_MM;
      const format = page.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      const orientation = w > h ? 'l' : 'p';

      if (index === 0) pdf = new jsPDF({ orientation, unit: 'mm', format: [w, h] });
      else pdf.addPage([w, h], orientation);

      pdf.addImage(page.dataUrl, format, 0, 0, w, h, undefined, 'FAST');
    });

    pdf.save(pdfFilename());
  }

  function el(tag, text, styles) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (styles) Object.assign(node.style, styles);
    return node;
  }

  function setStatus(node, message, type) {
    node.textContent = message || '';
    Object.assign(node.style, {
      color: type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#6b7280',
    });
  }

  function openPanel() {
    document.getElementById(PANEL_ID)?.remove();

    const panel = el('div', null, {
      position: 'fixed', top: '16px', right: '16px', zIndex: '2147483647',
      width: '360px', maxWidth: 'calc(100vw - 32px)',
      font: '14px/1.4 system-ui,sans-serif', color: '#111827', boxSizing: 'border-box',
    });
    panel.id = PANEL_ID;

    const card = el('div', null, {
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
      boxShadow: '0 20px 40px rgba(15,23,42,.18)', overflow: 'hidden',
    });

    const head = el('div', null, {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', background: 'linear-gradient(135deg,#1a73e8,#1557b0)', color: '#fff',
    });
    const closeBtn = el('button', '×', {
      border: '0', background: 'rgba(255,255,255,.12)', color: '#fff',
      width: '28px', height: '28px', borderRadius: '999px', cursor: 'pointer', fontSize: '16px',
    });
    closeBtn.type = 'button';
    head.appendChild(el('h2', 'Drive2PDF', { fontSize: '15px', fontWeight: '700', margin: '0' }));
    head.appendChild(closeBtn);

    const body = el('div', null, { padding: '16px', display: 'grid', gap: '12px' });
    const hint = el('p', 'Cuộn tài liệu để load trang, bấm Quét trang (ảnh lưu ngay). Cuộn thêm và quét lại nếu cần.', {
      fontSize: '12px', color: '#6b7280', margin: '0', lineHeight: '1.5',
    });
    const count = el('p', 'Chưa quét trang.', { fontSize: '13px', fontWeight: '600', color: '#1e3a8a', margin: '0' });
    const status = el('div', null, { minHeight: '18px', fontSize: '12px', color: '#6b7280' });

    const btnStyle = {
      border: '0', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    };
    const actions = el('div', null, { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' });
    const scanBtn = el('button', 'Quét trang', { ...btnStyle, background: '#eef2ff', color: '#1e3a8a' });
    const downloadBtn = el('button', 'Tải PDF', { ...btnStyle, background: '#1a73e8', color: '#fff', opacity: '0.55' });
    scanBtn.type = 'button';
    downloadBtn.type = 'button';
    downloadBtn.disabled = true;
    actions.appendChild(scanBtn);
    actions.appendChild(downloadBtn);

    body.appendChild(hint);
    body.appendChild(count);
    body.appendChild(actions);
    body.appendChild(status);
    card.appendChild(head);
    card.appendChild(body);
    panel.appendChild(card);
    document.body.appendChild(panel);

    let extracted = [];
    let busy = false;

    const setBusy = (value) => {
      busy = value;
      scanBtn.disabled = value;
      downloadBtn.disabled = value || !extracted.length;
      scanBtn.style.opacity = value ? '0.55' : '1';
      downloadBtn.style.opacity = value || !extracted.length ? '0.55' : '1';
      downloadBtn.style.cursor = value || !extracted.length ? 'not-allowed' : 'pointer';
    };

    closeBtn.addEventListener('click', () => panel.remove());

    scanBtn.addEventListener('click', async () => {
      if (busy) return;
      setBusy(true);
      extracted = [];
      setStatus(status, 'Đang quét trang...');

      try {
        const sources = scanPages();
        if (!sources.length) {
          count.textContent = 'Không tìm thấy trang.';
          setStatus(status, 'Không có ảnh. Mở PDF trên Drive và cuộn để load trang.', 'error');
          return;
        }
        extracted = await extractPages(sources, (current, total) => {
          setStatus(status, `Đang trích xuất ${current}/${total}...`);
        });
        count.textContent = `Đã lưu ${extracted.length} trang.`;
        setStatus(status, 'Sẵn sàng tải PDF.', 'success');
      } catch (err) {
        extracted = [];
        count.textContent = 'Trích xuất thất bại.';
        setStatus(status, err.message || 'Quét trang thất bại.', 'error');
      } finally {
        setBusy(false);
      }
    });

    downloadBtn.addEventListener('click', () => {
      if (busy || !extracted.length) return;
      setBusy(true);
      setStatus(status, 'Đang ghép PDF...');
      try {
        compilePdf(extracted, (current, total) => setStatus(status, `Đang ghép PDF ${current}/${total}...`));
        setStatus(status, `Đã tải xuống: ${pdfFilename()}`, 'success');
      } catch (err) {
        setStatus(status, err.message || 'Tải PDF thất bại.', 'error');
      } finally {
        setBusy(false);
      }
    });
  }

  window.Drive2PDF = { open: openPanel };
})();
