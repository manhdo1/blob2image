# TÀI LIỆU MÔ TẢ KỸ THUẬT: GOOGLE DRIVE PDF DOWNLOADER EXTENSION

## 1. Kiến trúc tổng quan (Architecture Overview)

Ứng dụng được xây dựng dưới dạng **Chrome Extension (Manifest V3)** để có đầy đủ quyền can thiệp vào tài nguyên mạng và DOM của trang web một cách hợp lệ.

Giải pháp gồm 3 thành phần chính:

* **Content Script:** Chạy trực tiếp trong ngữ cảnh của trang Google Drive. Nhiệm vụ: Tự động cuộn trang (Auto-scroll), lắng nghe DOM để thu thập dữ liệu ảnh, và chèn giao diện điều khiển (UI) bằng phương thức an toàn (Safe DOM).
* **Background Script (Service Worker):** Chạy ngầm để xử lý các tác vụ nặng hoặc tải dữ liệu nếu gặp rào cản CORS (ở phiên bản này chủ yếu xử lý qua Content Script nhờ cùng Origin).
* **Thư viện đóng gói (Client-side Library):** Tích hợp `jsPDF` để gộp các file ảnh thu thập được thành file PDF hoàn chỉnh ngay tại trình duyệt của người dùng.

---

## 2. Quy trình xử lý chi tiết (Technical Workflow)

### Bước 1: Khởi tạo UI an toàn (Bypass Trusted Types)

Để tránh lỗi `TrustedHTML assignment`, Extension tuyệt đối không sử dụng `innerHTML` để tạo nút bấm hoặc bảng điều khiển.

* **Giải pháp:** Sử dụng API `document.createElement()` và gán thuộc tính trực tiếp.
* **Mẫu triển khai (Code snippet):**

```javascript
function injectDownloadButton() {
    // Tạo container chính
    const btnContainer = document.createElement('div');
    btnContainer.id = 'gdrive-downloader-ui';
    btnContainer.style.position = 'fixed';
    btnContainer.style.bottom = '20px';
    btnContainer.style.right = '20px';
    btnContainer.style.zIndex = '9999';

    // Tạo nút bấm
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = 'Tải PDF đầy đủ';
    downloadBtn.style.padding = '10px 20px';
    downloadBtn.style.background = '#1a73e8';
    downloadBtn.style.color = '#white';
    downloadBtn.style.border = 'none';
    downloadBtn.style.borderRadius = '4px';
    downloadBtn.style.cursor = 'pointer';

    // Đính kèm sự kiện kích hoạt tiến trình
    downloadBtn.addEventListener('click', startDownloadProcess);

    btnContainer.appendChild(downloadBtn);
    document.body.appendChild(btnContainer);
}

```

### Bước 2: Kích hoạt Lazy Loading (Auto-Scroll)

Google Drive chỉ nạp các trang đang hiển thị. Tool cần giả lập hành động cuộn để ép trình duyệt render toàn bộ các trang tài liệu.

* **Giải pháp:** Tìm khung chứa tài liệu (Document Scroll Container) và tăng dần thuộc tính `scrollTop` kết hợp với hàm trễ (`setTimeout`) để chờ dữ liệu tải về mạng.
* **Mẫu triển khai:**

```javascript
async function triggerLazyLoad(container) {
    const totalHeight = container.scrollHeight;
    let currentScroll = 0;
    const step = 600; // Cuộn mỗi lần 600px

    while (currentScroll < totalHeight) {
        container.scrollTo(0, currentScroll);
        currentScroll += step;
        // Chờ 600ms-800ms để Google Drive render xong trang tiếp theo
        await new Promise(resolve => setTimeout(resolve, 700));
    }
}

```

### Bước 3: Đánh chặn và Trích xuất dữ liệu Ảnh (DOM Scraping)

Sau khi toàn bộ tài liệu đã được cuộn qua, Script tiến hành quét các phần tử trang tài liệu để lấy dữ liệu ảnh.

* **Cơ chế:** Google thường bọc các trang trong cấu trúc lớp có class cố định (Ví dụ: `.kix-page` hoặc `.ndfHFb-c4SOm-wrapper`). Bên trong sẽ chứa thẻ `<img>` với thuộc tính `src` dạng `blob:[https://drive.google.com/](https://drive.google.com/)...` hoặc thẻ `<canvas>`.
* **Giải pháp chuyển đổi Blob sang Base64 trực tiếp tại cùng Origin:** Nhờ chạy cùng tab Google Drive, ta dùng lệnh `fetch()` trực tiếp link Blob này sang mảng Byte (ArrayBuffer) rồi chuyển về định dạng Base64 để lưu vào bộ nhớ tạm.
* **Mẫu triển khai:**

```javascript
async function blobUrlToBase64(blobUrl) {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); // Trả về chuỗi data:image/jpeg;base64,...
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function collectAllPages() {
    const pageElements = document.querySelectorAll('.ndfHFb-c4SOm-wrapper img'); // Selector thay đổi tùy phiên bản giao diện GD
    const imagesData = [];

    for (let img of pageElements) {
        if (img.src && img.src.startsWith('blob:')) {
            try {
                const base64Data = await blobUrlToBase64(img.src);
                imagesData.push(base64Data);
            } catch (e) {
                console.error("Lỗi trích xuất trang:", e);
            }
        }
    }
    return imagesData;
}

```

### Bước 4: Đóng gói tài liệu (PDF Compilation)

Sử dụng thư viện `jsPDF` nạp từ môi trường của Extension để ghép chuỗi các ảnh Base64 thành một tệp PDF duy nhất theo đúng thứ tự trang.

* **Mẫu triển khai:**

```javascript
// Lưu ý: Cần import thư viện jspdf.umd.min.js trong file manifest
function compilePDF(imagesArray) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4'); // Định dạng mặc định A4 đứng

    imagesArray.forEach((base64Img, index) => {
        if (index > 0) {
            pdf.addPage();
        }
        // Thêm ảnh vào trang, căn lề phủ kín trang A4 (210mm x 297mm)
        pdf.addImage(base64Img, 'JPEG', 0, 0, 210, 297);
    });

    // Kích hoạt tính năng lưu file của trình duyệt
    pdf.save('Tai_lieu_Drive_Downloaded.pdf');
}

```

---

## 3. Cấu hình Manifest (manifest.json)

Để extension vận hành chính xác và có quyền inject mã nguồn vào Google Drive, file cấu hình `manifest.json` cần được khai báo như sau:

```json
{
  "manifest_version": 3,
  "name": "Google Drive PDF Helper",
  "version": "1.0",
  "description": "Hỗ trợ sao lưu tài liệu view-only cá nhân",
  "permissions": [
    "activeTab"
  ],
  "content_scripts": [
    {
      "matches": ["https://drive.google.com/file/d/*"],
      "js": ["libs/jspdf.umd.min.js", "content.js"],
      "run_at": "document_end"
    }
  ]
}

```

---

## 4. Các điểm lưu ý và Rủi ro kỹ thuật (Edge Cases)

1. **Sự thay đổi DOM Class của Google:** Google thường xuyên cập nhật mã nguồn làm thay đổi tên các class của thẻ bao bọc trang (ví dụ từ `.kix-page` đổi thành các chuỗi ngẫu nhiên). Thuật toán quét DOM cần sử dụng các thuộc tính tổng quát hơn, ví dụ quét tất cả thẻ `img` nằm trong phân vùng có `role="document"`.
2. **Độ phân giải hình ảnh:** File ảnh `blob:` do Google sinh ra có chất lượng phụ thuộc vào tỷ lệ Zoom (phóng to/thu nhỏ) của màn hình hiện tại. Để PDF tải về có độ nét cao nhất, script nên bổ sung câu lệnh tự động ép tỷ lệ zoom của trình xem Drive lên `100%` hoặc `150%` trước khi bắt đầu cuộn trang.

---

## 5. Triển khai Console Script (Drive2PDF) — đã implement

Phiên bản thực tế: **dán script vào DevTools Console** trên Google Drive. Bookmarklet không dùng được (CSP + Trusted Types + bundle jsPDF ~400KB).

### Cấu trúc mã nguồn

```
src/drive/app.js      # scan, extract, PDF, UI (một module)
src/drive/entry.js    # mở panel sau khi dán
scripts/build-drive-console.js
drive-index.html      # Copy script (Console)
drive-console.min.js  # output build
```

### Luồng người dùng

1. `npm run build:drive && npm run serve`
2. Mở `drive-index.html` → **Copy script (Console)**
3. Mở `https://drive.google.com/file/d/...` → F12 → Console → dán → Enter
4. Cuộn tài liệu → **Quét trang** → **Tải PDF**

### Kỹ thuật trích xuất ảnh

- Quét `img[src^="blob:"]` và `canvas` trong viewer
- Trích xuất qua `canvas.drawImage()` ngay khi quét (blob URL Drive hay bị revoke)
- UI chỉ dùng `createElement` + `textContent` (Trusted Types)
- Không auto-scroll — user cuộn thủ công

### Giới hạn

- Chỉ trang đã render trên DOM
- Chất lượng phụ thuộc zoom viewer
- DOM class Google có thể thay đổi