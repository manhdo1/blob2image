# Blob2Image

Convert `blob:https://www.tiktok.com/...` sang file ảnh trên cùng tab TikTok.

## Setup

```bash
npm install
npm run build
npm run serve
```

Mở `http://localhost:3000` → **Copy URL** hoặc kéo **Blob2Image** vào bookmark bar.

URL bookmark phải bắt đầu bằng `javascript:`, không phải `http://localhost`.

## Dùng trên TikTok

1. DevTools → Elements → copy `src` của `<img>` (`blob:https://...`)
2. Click bookmark **Blob2Image**
3. Bấm **Paste** (hoặc Ctrl+V) → chọn format → **Convert & Download**

Đóng ảnh full/lightbox TikTok trước nếu không gõ được vào input.

## Output

Giữ gốc / PNG / JPEG / WebP (quality slider cho JPEG & WebP).

## Structure

```
src/converter.js   # fetch blob, convert, download
src/ui.js          # panel UI
src/bookmarklet.js # toggle entry
scripts/build-bookmarklet.js
```

## License

MIT
