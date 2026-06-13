(function initBlob2ImageUI() {
  if (window.Blob2ImageUI) return;

  const C = () => window.Blob2ImageConverter;
  const PANEL_ID = 'blob2image-panel';
  const STYLES_ID = 'blob2image-styles';

  const CSS = `
    #${PANEL_ID}{position:fixed;top:16px;right:16px;z-index:2147483647;width:360px;max-width:calc(100vw - 32px);font:14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#111827;box-sizing:border-box;isolation:isolate}
    #${PANEL_ID} *{box-sizing:border-box}
    #${PANEL_ID} .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 20px 40px rgba(15,23,42,.18);overflow:hidden}
    #${PANEL_ID} .head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:linear-gradient(135deg,#111827,#1f2937);color:#fff}
    #${PANEL_ID} .title{font-size:15px;font-weight:700;margin:0}
    #${PANEL_ID} .close{border:0;background:rgba(255,255,255,.12);color:#fff;width:28px;height:28px;border-radius:999px;cursor:pointer;font-size:16px}
    #${PANEL_ID} .body{padding:16px;display:grid;gap:12px}
    #${PANEL_ID} label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:6px}
    #${PANEL_ID} .url-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end}
    #${PANEL_ID} input[type=text],#${PANEL_ID} select{display:block;width:100%;min-height:40px;border:1px solid #d1d5db!important;border-radius:8px;padding:10px 12px!important;font:inherit!important;background:#fff!important;color:#111827!important;-webkit-text-fill-color:#111827!important;opacity:1!important;caret-color:#111827!important;pointer-events:auto!important;user-select:text!important}
    #${PANEL_ID} input::placeholder{color:#9ca3af!important;-webkit-text-fill-color:#9ca3af!important}
    #${PANEL_ID} input:focus,#${PANEL_ID} select:focus{outline:2px solid #93c5fd!important;border-color:#2563eb!important}
    #${PANEL_ID} input[type=range]{width:100%}
    #${PANEL_ID} .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    #${PANEL_ID} .quality{display:none}
    #${PANEL_ID} .quality.on{display:block}
    #${PANEL_ID} .preview{border:1px dashed #d1d5db;border-radius:8px;min-height:120px;display:flex;align-items:center;justify-content:center;background:#f9fafb;overflow:hidden}
    #${PANEL_ID} .preview img{max-width:100%;max-height:220px;display:block}
    #${PANEL_ID} .preview-empty{font-size:12px;color:#6b7280;padding:16px;text-align:center}
    #${PANEL_ID} .actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    #${PANEL_ID} .btn{border:0;border-radius:8px;padding:10px 12px;font-size:13px;font-weight:600;cursor:pointer}
    #${PANEL_ID} .btn-primary{background:#2563eb;color:#fff}
    #${PANEL_ID} .btn-secondary{background:#eef2ff;color:#1e3a8a}
    #${PANEL_ID} .status{min-height:18px;font-size:12px;color:#6b7280}
    #${PANEL_ID} .status.err{color:#dc2626}
    #${PANEL_ID} .status.ok{color:#059669}
  `;

  function injectStyles() {
    if (document.getElementById(STYLES_ID)) return;
    const el = document.createElement('style');
    el.id = STYLES_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  function setUrlInput(input, text) {
    const v = (text || '').trim();
    input.value = v;
    input.setAttribute('value', v);
  }

  function createPanel() {
    injectStyles();

    const existing = document.getElementById(PANEL_ID);
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="card">
        <div class="head">
          <h2 class="title">Blob2Image</h2>
          <button type="button" class="close" aria-label="Close">×</button>
        </div>
        <div class="body">
          <div>
            <label for="b2i-url">Blob URL</label>
            <div class="url-row">
              <input id="b2i-url" type="text" placeholder="blob:https://www.tiktok.com/..." autocomplete="off" spellcheck="false" />
              <button type="button" class="btn btn-secondary" id="b2i-paste">Paste</button>
            </div>
          </div>
          <div class="row">
            <div>
              <label for="b2i-format">Định dạng</label>
              <select id="b2i-format">
                <option value="original">Giữ gốc</option>
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
            <div class="quality" id="b2i-quality-wrap">
              <label for="b2i-quality">Quality: <span id="b2i-q-val">0.92</span></label>
              <input id="b2i-quality" type="range" min="0.1" max="1" step="0.01" value="0.92" />
            </div>
          </div>
          <div>
            <label for="b2i-filename">Tên file</label>
            <input id="b2i-filename" type="text" value="${C().defaultFilename('tiktok-image')}" />
          </div>
          <div>
            <label>Preview</label>
            <div class="preview" id="b2i-preview"><div class="preview-empty">Paste blob URL để xem preview</div></div>
          </div>
          <div class="actions">
            <button type="button" class="btn btn-secondary" id="b2i-preview-btn">Preview</button>
            <button type="button" class="btn btn-primary" id="b2i-download">Convert & Download</button>
          </div>
          <div class="status" id="b2i-status"></div>
        </div>
      </div>`;

    document.body.appendChild(panel);

    const $ = (sel) => panel.querySelector(sel);
    const urlInput = $('#b2i-url');
    const status = $('#b2i-status');
    const preview = $('#b2i-preview');
    const format = $('#b2i-format');
    const qualityWrap = $('#b2i-quality-wrap');
    const quality = $('#b2i-quality');
    const qVal = $('#b2i-q-val');
    let previewSrc = null;

    const setStatus = (msg, type) => {
      status.textContent = msg;
      status.className = 'status' + (type === 'error' ? ' err' : type === 'success' ? ' ok' : '');
    };

    const resetPreview = () => {
      if (previewSrc) URL.revokeObjectURL(previewSrc);
      previewSrc = null;
      preview.innerHTML = '<div class="preview-empty">Paste blob URL để xem preview</div>';
    };

    const toggleQuality = () => {
      const on = format.value === 'jpeg' || format.value === 'webp';
      qualityWrap.classList.toggle('on', on);
    };

    const pasteUrl = async () => {
      let text = '';
      try {
        text = await navigator.clipboard.readText();
      } catch {
        setStatus('Không đọc được clipboard. Dùng Ctrl+V hoặc cấp quyền.', 'error');
        return;
      }
      text = text.trim();
      if (!C().isValidBlobUrl(text)) {
        setStatus('Clipboard không có blob URL hợp lệ.', 'error');
        return;
      }
      setUrlInput(urlInput, text);
      setStatus('Đã paste blob URL.', 'success');
    };

    urlInput.addEventListener('paste', (e) => {
      const text = e.clipboardData?.getData('text')?.trim();
      if (!text || !C().isValidBlobUrl(text)) return;
      e.preventDefault();
      setUrlInput(urlInput, text);
      setStatus('Đã paste blob URL.', 'success');
    });

    $('#b2i-paste').addEventListener('click', pasteUrl);

    format.addEventListener('change', toggleQuality);
    quality.addEventListener('input', () => { qVal.textContent = Number(quality.value).toFixed(2); });

    $('#b2i-preview-btn').addEventListener('click', async () => {
      const url = urlInput.value.trim();
      if (!C().isValidBlobUrl(url)) return setStatus('URL phải bắt đầu bằng blob:https://...', 'error');
      setStatus('Đang tải preview...');
      try {
        resetPreview();
        previewSrc = await C().previewUrl(url);
        preview.innerHTML = `<img src="${previewSrc}" alt="Preview" />`;
        setStatus('Preview thành công.', 'success');
      } catch (err) {
        resetPreview();
        setStatus(err.message || 'Không thể tạo preview.', 'error');
      }
    });

    $('#b2i-download').addEventListener('click', async () => {
      const url = urlInput.value.trim();
      if (!C().isValidBlobUrl(url)) return setStatus('URL phải bắt đầu bằng blob:https://...', 'error');
      setStatus('Đang convert...');
      try {
        const fmt = format.value;
        const result = await C().convertAndDownload({
          url,
          format: fmt,
          quality: Number(quality.value),
          filename: $('#b2i-filename').value.trim(),
        });
        const note = fmt === 'webp' && result.format === 'png' ? ' (fallback PNG)' : '';
        setStatus(`Đã tải xuống: ${result.filename}${note}`, 'success');
      } catch (err) {
        setStatus(err.message || 'Convert thất bại.', 'error');
      }
    });

    $('.close').addEventListener('click', () => {
      resetPreview();
      panel.remove();
    });

    toggleQuality();
  }

  function togglePanel() {
    if (document.getElementById(PANEL_ID)) {
      document.getElementById(PANEL_ID).remove();
      return;
    }
    createPanel();
  }

  window.Blob2ImageUI = { createPanel, togglePanel };
})();
