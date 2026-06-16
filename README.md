# Blob2Image

Convert `blob:https://www.tiktok.com/...` sang file ảnh trên cùng tab TikTok.

## Setup

```bash
npm install
npm run build
npm run serve
```

Mở `http://localhost:3000` → **Copy URL** hoặc kéo **Blob2Image** vào bookmark bar.

## Dùng trên TikTok

1. DevTools → Elements → copy `src` của `<img>` (`blob:https://...`)
2. Click bookmark **Blob2Image**
3. Bấm **Paste** → chọn format → **Convert & Download**

## Drive2PDF (Google Drive)

Google Drive không hỗ trợ bookmarklet — chỉ dùng **Console**.

```bash
npm run build:drive
npm run serve
```

Mở `http://localhost:3000/drive-index.html` → **Copy script (Console)** → dán vào Console trên Google Drive.

## Structure

```
src/converter.js, ui.js, bookmarklet.js   # Blob2Image (TikTok)
src/drive/app.js, entry.js                # Drive2PDF (console)
scripts/build-bookmarklet.js
scripts/build-drive-console.js
```

## License

MIT
