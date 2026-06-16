# Blob Tools

Browser tools convert blob URL và ghép PDF từ Google Drive.

## Cấu trúc

```
src/
  blob2image/     # TikTok blob → image (bookmarklet)
  drive2pdf/      # Google Drive → PDF (console script)
public/
  index.html      # trang chủ
  blob2image/     # trang cài bookmarklet
  drive2pdf/      # trang copy console script
  dist/           # build output (generated)
scripts/
  build-blob2image.js
  build-drive2pdf.js
docs/
  drive2pdf.md    # tài liệu kỹ thuật Drive2PDF
```

## Setup

```bash
npm install
npm run build:all
npm run serve
```

Mở `http://localhost:3000`

## Blob2Image (TikTok)

1. Vào `/blob2image/` → copy bookmarklet
2. Trên TikTok: click bookmark → paste blob URL → download

## Drive2PDF (Google Drive)

1. Vào `/drive2pdf/` → **Copy script (Console)**
2. Mở PDF trên Drive → F12 → Console → dán → Enter
3. **Quét trang** → **Tải PDF**

## License

MIT
