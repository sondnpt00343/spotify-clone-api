# Hướng dẫn Import Postman Collection - Spotify Clone API

## Files đã tạo

- `Spotify_Clone_API.postman_collection.json` - Collection chứa tất cả API endpoints
- `Spotify_Clone_Local.postman_environment.json` - Environment cho Local development
- `Spotify_Clone_Production.postman_environment.json` - Environment cho Production

## Cách Import vào Postman

### 1. Import Collection

1. Mở Postman
2. Click **Import** ở góc trên bên trái
3. Chọn file `Spotify_Clone_API.postman_collection.json`
4. Click **Import**

### 2. Import Environments

1. Click **Import**
2. Chọn cả 2 files environment:
   - `Spotify_Clone_Local.postman_environment.json`
   - `Spotify_Clone_Production.postman_environment.json`
3. Click **Import**
4. Chọn environment phù hợp từ dropdown ở góc phải:
   - "Spotify Clone - Local" cho development
   - "Spotify Clone - Production" cho production

## Biến môi trường

### Local Environment

- **BASE_URL**: `http://localhost:3000`
- **access_token**: Sẽ được tự động lấy sau khi login thành công

### Production Environment

- **BASE_URL**: `https://spotify.f8team.dev`
- **access_token**: Sẽ được tự động lấy sau khi login thành công

## Cách sử dụng

### 1. Đăng ký/Đăng nhập

- Sử dụng endpoint "Register User" để tạo tài khoản
- Sử dụng endpoint "Login User" để đăng nhập
- Token sẽ tự động được lưu vào biến `access_token`

### 2. Test API

- Tất cả endpoints đã được tổ chức theo nhóm chức năng
- Các endpoints cần authentication đã được cấu hình sẵn header Authorization
- Chỉ cần thay đổi các parameter như `:artistId`, `:trackId` v.v. trong URL

### 3. Nhóm endpoints chính

- **Authentication**: Đăng ký, đăng nhập, profile
- **Artists**: Quản lý nghệ sĩ, follow/unfollow
- **Albums**: Quản lý album, like/unlike
- **Tracks**: Quản lý bài hát, like/unlike
- **Playlists**: Tạo playlist, thêm/xóa bài hát
- **Search**: Tìm kiếm universal và theo loại
- **Player**: Điều khiển phát nhạc, queue, lịch sử
- **Upload**: Upload avatar, cover, audio files
- **Library & User Data**: Thư viện cá nhân

## Lưu ý

- **Chọn đúng environment**: Local cho development, Production cho testing trên server thật
- Đảm bảo server đang chạy (Local: port 3000, Production: <https://spotify.f8team.dev>)
- Sau khi login, token sẽ tự động được sử dụng cho các request cần authentication
- Thay thế các placeholder như `:artistId`, `:trackId` bằng UUID thực tế từ database
