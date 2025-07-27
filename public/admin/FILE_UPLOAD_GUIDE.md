# Hướng dẫn sử dụng tính năng File Upload cải tiến

## Tính năng mới

### 1. Preview File hiện có
- Khi chỉnh sửa một tài nguyên (artist, album, track, playlist), form sẽ tự động hiển thị preview của file hiện có
- File image sẽ hiển thị thumbnail
- File audio sẽ hiển thị audio player để nghe thử
- Có nút "Change" để thay đổi file

### 2. Upload thông minh
- **Chỉ upload khi có file mới**: Hệ thống chỉ upload file khi user thực sự chọn file mới
- **Giữ nguyên file cũ**: Nếu không chọn file mới, file cũ sẽ được giữ nguyên
- **Tiết kiệm bandwidth**: Không upload lại file đã có sẵn

### 3. Giao diện trực quan
- **File hiện có**: Hiển thị với background xám nhạt, icon màu xám
- **File mới**: Hiển thị với background xanh nhạt, icon màu xanh, có hiệu ứng shine
- **Nút Revert**: Cho phép quay lại file cũ nếu đã chọn file mới nhưng muốn huỷ

## Cách sử dụng

### Chỉnh sửa tài nguyên có file
1. Click nút "Edit" trên bất kỳ item nào (Artist, Album, Track, Playlist)
2. Form sẽ mở và tự động hiển thị preview file hiện có
3. Các trường khác cũng được điền sẵn thông tin hiện tại

### Thay đổi file
1. Click nút "Change" bên dưới preview file hiện có
2. Hoặc click vào input file để chọn file mới
3. Preview sẽ chuyển sang hiển thị file mới với màu xanh
4. Có thể click "Revert" để quay lại file cũ

### Lưu thay đổi
1. Click "Save" để lưu
2. Hệ thống sẽ:
   - Upload các file mới (nếu có)
   - Giữ nguyên URL file cũ (nếu không có file mới)
   - Cập nhật các thông tin khác

## Các loại file được hỗ trợ

### Image Files
- **Định dạng**: JPG, JPEG, PNG, GIF, WebP, BMP, SVG
- **Sử dụng cho**: Avatar, Artist Image, Album Cover, Track Image, Playlist Cover
- **Preview**: Hiển thị thumbnail có thể hover để phóng to

### Audio Files  
- **Định dạng**: MP3, WAV, FLAC, M4A, AAC, OGG
- **Sử dụng cho**: Track Audio
- **Preview**: Audio player có thể phát thử

## Tính năng kỹ thuật

### Tracking File State
- `originalFileUrls`: Lưu URL file gốc
- `hasNewFiles`: Track xem field nào có file mới

### URL Mapping
- `avatar_file` → `avatar_url`
- `image_file` → `image_url` 
- `background_file` → `background_image_url`
- `cover_file` → `cover_image_url`
- `audio_file` → `audio_url`

### Upload Logic
```javascript
// Chỉ upload khi có file mới
if (input.files && input.files[0] && this.hasNewFiles[input.name]) {
    // Upload file mới
} else if (!this.hasNewFiles[input.name] && this.originalFileUrls[input.name]) {
    // Giữ nguyên URL cũ
}
```

## Styling Classes

### CSS Classes mới
- `.existing-file-preview`: Style cho file hiện có
- `.new-file-preview`: Style cho file mới (có animation shine)
- `.file-error`: Style cho lỗi file
- `.file-success`: Style cho thành công
- `.upload-progress`: Style cho progress bar

### Animations
- `shine`: Hiệu ứng ánh sáng chạy qua file mới
- Hover effects cho buttons và previews
- Transform animations

## Browser Support
- Modern browsers với support cho:
  - FileReader API
  - FormData
  - Audio/Video elements
  - CSS animations
  - ES6 features

## Troubleshooting

### File không hiển thị preview
- Kiểm tra URL file có hợp lệ không
- Kiểm tra CORS settings cho static files
- Kiểm tra file extension mapping

### Upload không hoạt động
- Kiểm tra file size limits
- Kiểm tra authentication token
- Kiểm tra network trong DevTools

### Preview bị lỗi
- Kiểm tra file format có được support không
- Kiểm tra console errors
- Refresh và thử lại 