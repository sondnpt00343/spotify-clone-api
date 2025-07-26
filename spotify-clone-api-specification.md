# PHÂN TÍCH THIẾT KẾ DATABASE VÀ API CHO SPOTIFY CLONE

## MỤC LỤC
1. [Database Schema](#1-database-schema)
2. [REST API Endpoints](#2-rest-api-endpoints)
3. [Technical Specifications](#3-technical-specifications)
4. [Error Handling](#4-error-handling)
5. [Implementation Notes](#5-implementation-notes)

---

## 1. DATABASE SCHEMA

### **Users Table**
```sql
users {
  id: UUID PRIMARY KEY
  email: VARCHAR(255) UNIQUE NOT NULL
  username: VARCHAR(50) UNIQUE NOT NULL
  display_name: VARCHAR(100)
  avatar_url: TEXT
  created_at: TIMESTAMP DEFAULT NOW()
  updated_at: TIMESTAMP DEFAULT NOW()
}
```

### **Artists Table**
```sql
artists {
  id: UUID PRIMARY KEY
  name: VARCHAR(255) NOT NULL
  bio: TEXT
  image_url: TEXT
  background_image_url: TEXT
  monthly_listeners: INTEGER DEFAULT 0
  is_verified: BOOLEAN DEFAULT FALSE
  created_at: TIMESTAMP DEFAULT NOW()
  updated_at: TIMESTAMP DEFAULT NOW()
}
```

### **Albums Table**
```sql
albums {
  id: UUID PRIMARY KEY
  title: VARCHAR(255) NOT NULL
  cover_image_url: TEXT
  release_date: DATE
  artist_id: UUID REFERENCES artists(id)
  created_at: TIMESTAMP DEFAULT NOW()
}
```

### **Tracks Table**
```sql
tracks {
  id: UUID PRIMARY KEY
  title: VARCHAR(255) NOT NULL
  duration: INTEGER NOT NULL -- seconds
  audio_url: TEXT NOT NULL
  image_url: TEXT
  play_count: BIGINT DEFAULT 0
  album_id: UUID REFERENCES albums(id)
  artist_id: UUID REFERENCES artists(id)
  track_number: INTEGER
  created_at: TIMESTAMP DEFAULT NOW()
}
```

### **Playlists Table**
```sql
playlists {
  id: UUID PRIMARY KEY
  name: VARCHAR(255) NOT NULL
  description: TEXT
  image_url: TEXT
  is_public: BOOLEAN DEFAULT TRUE
  user_id: UUID REFERENCES users(id)
  created_at: TIMESTAMP DEFAULT NOW()
  updated_at: TIMESTAMP DEFAULT NOW()
}
```

### **Playlist_Tracks Table** (Many-to-Many)
```sql
playlist_tracks {
  id: UUID PRIMARY KEY
  playlist_id: UUID REFERENCES playlists(id) ON DELETE CASCADE
  track_id: UUID REFERENCES tracks(id) ON DELETE CASCADE
  position: INTEGER NOT NULL
  added_at: TIMESTAMP DEFAULT NOW()
  UNIQUE(playlist_id, track_id)
}
```

### **User_Library Table** (User's saved content)
```sql
user_library {
  id: UUID PRIMARY KEY
  user_id: UUID REFERENCES users(id)
  item_type: ENUM('track', 'album', 'playlist', 'artist')
  item_id: UUID NOT NULL
  saved_at: TIMESTAMP DEFAULT NOW()
  UNIQUE(user_id, item_type, item_id)
}
```

### **User_Follows Table** (Following artists)
```sql
user_follows {
  id: UUID PRIMARY KEY
  user_id: UUID REFERENCES users(id)
  artist_id: UUID REFERENCES artists(id)
  followed_at: TIMESTAMP DEFAULT NOW()
  UNIQUE(user_id, artist_id)
}
```

### **Play_History Table**
```sql
play_history {
  id: UUID PRIMARY KEY
  user_id: UUID REFERENCES users(id)
  track_id: UUID REFERENCES tracks(id)
  played_at: TIMESTAMP DEFAULT NOW()
  play_duration: INTEGER -- seconds actually played
}
```

### **Current_Playback Table** (User's current player state)
```sql
current_playback {
  user_id: UUID PRIMARY KEY REFERENCES users(id)
  track_id: UUID REFERENCES tracks(id)
  position: INTEGER DEFAULT 0 -- seconds into track
  is_playing: BOOLEAN DEFAULT FALSE
  volume: INTEGER DEFAULT 70 -- 0-100
  shuffle: BOOLEAN DEFAULT FALSE
  repeat_mode: ENUM('off', 'track', 'playlist') DEFAULT 'off'
  playlist_id: UUID REFERENCES playlists(id) -- null if not from playlist
  updated_at: TIMESTAMP DEFAULT NOW()
}
```

---

## 2. REST API ENDPOINTS

### **Authentication & Users**

#### `POST /api/auth/register`
**Mô tả:** Đăng ký tài khoản mới

**Request:**
```json
{
  "email": "user@email.com",
  "username": "username",
  "password": "password",
  "display_name": "Display Name"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@email.com", 
    "username": "username",
    "display_name": "Display Name",
    "avatar_url": null
  },
  "token": "jwt_token"
}
```

#### `POST /api/auth/login`
**Mô tả:** Đăng nhập

**Request:**
```json
{
  "email": "user@email.com",
  "password": "password"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@email.com",
    "username": "username",
    "display_name": "Display Name",
    "avatar_url": "url"
  },
  "token": "jwt_token"
}
```

#### `GET /api/users/me`
**Mô tả:** Lấy thông tin user hiện tại

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@email.com",
  "username": "username", 
  "display_name": "Display Name",
  "avatar_url": "url"
}
```

### **Artists**

#### `GET /api/artists/{artistId}`
**Mô tả:** Lấy thông tin chi tiết nghệ sĩ

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Đen",
  "bio": "Artist biography",
  "image_url": "image_url",
  "background_image_url": "bg_url",
  "monthly_listeners": 1021833,
  "is_verified": true,
  "is_following": false
}
```

#### `GET /api/artists/{artistId}/tracks/popular`
**Mô tả:** Lấy danh sách bài hát phổ biến của nghệ sĩ

**Query Parameters:**
- `limit`: Số lượng tracks (default: 10, max: 50)
- `offset`: Vị trí bắt đầu (default: 0)

**Response (200):**
```json
{
  "tracks": [
    {
      "id": "uuid",
      "title": "Cho Tôi Lang Thang",
      "duration": 258,
      "image_url": "url",
      "play_count": 27498341,
      "track_number": 1,
      "artist": {
        "id": "uuid", 
        "name": "Đen"
      }
    }
  ],
  "total": 50
}
```

#### `POST /api/artists/{artistId}/follow`
**Mô tả:** Follow nghệ sĩ

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "message": "Artist followed successfully",
  "is_following": true
}
```

#### `DELETE /api/artists/{artistId}/follow`
**Mô tả:** Unfollow nghệ sĩ

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "message": "Artist unfollowed successfully", 
  "is_following": false
}
```

### **Tracks**

#### `GET /api/tracks/{trackId}`
**Mô tả:** Lấy thông tin chi tiết bài hát

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Lối Nhỏ",
  "duration": 252,
  "audio_url": "audio_url",
  "image_url": "image_url", 
  "play_count": 45686866,
  "artist": {
    "id": "uuid",
    "name": "Đen"
  },
  "album": {
    "id": "uuid",
    "title": "Album Name"
  }
}
```

#### `POST /api/tracks/{trackId}/play`
**Mô tả:** Bắt đầu phát bài hát (cập nhật play count)

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Request:**
```json
{
  "position": 0
}
```

**Response (200):**
```json
{
  "message": "Playback started",
  "play_count": 45686867
}
```

### **Search**

#### `GET /api/search`
**Mô tả:** Tìm kiếm toàn bộ

**Query Parameters:**
- `q`: Từ khóa tìm kiếm (required)
- `type`: Loại kết quả (artist,track,playlist) (default: all)
- `limit`: Số lượng kết quả mỗi loại (default: 20, max: 50)
- `offset`: Vị trí bắt đầu (default: 0)

**Example:** `GET /api/search?q=den&type=artist,track,playlist&limit=20&offset=0`

**Response (200):**
```json
{
  "artists": [
    {
      "id": "uuid",
      "name": "Đen",
      "image_url": "url",
      "is_verified": true,
      "monthly_listeners": 1021833
    }
  ],
  "tracks": [
    {
      "id": "uuid", 
      "title": "Track Name",
      "duration": 240,
      "image_url": "url",
      "artist": {"id": "uuid", "name": "Artist"}
    }
  ],
  "playlists": [
    {
      "id": "uuid",
      "name": "Playlist Name",
      "image_url": "url",
      "user": {"id": "uuid", "display_name": "User"}
    }
  ],
  "total": {
    "artists": 5,
    "tracks": 20,
    "playlists": 3
  }
}
```

### **User Library**

#### `GET /api/me/library`
**Mô tả:** Lấy thư viện cá nhân của user

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Query Parameters:**
- `type`: Loại item (artist, track, album, playlist) (optional)
- `limit`: Số lượng items (default: 20, max: 50)
- `offset`: Vị trí bắt đầu (default: 0)
- `sort`: Sắp xếp (recent, name, added) (default: recent)

**Response (200):**
```json
{
  "items": [
    {
      "item_type": "artist",
      "saved_at": "2024-01-15T10:30:00Z",
      "item": {
        "id": "uuid",
        "name": "Đen",
        "image_url": "url",
        "is_verified": true
      }
    }
  ],
  "total": 45
}
```

#### `POST /api/me/library`
**Mô tả:** Thêm item vào thư viện

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Request:**
```json
{
  "item_type": "track",
  "item_id": "uuid"
}
```

**Response (201):**
```json
{
  "message": "Added to library",
  "saved_at": "2024-01-15T10:30:00Z"
}
```

#### `DELETE /api/me/library/{itemType}/{itemId}`
**Mô tả:** Xóa item khỏi thư viện

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "message": "Removed from library"
}
```

### **Playlists**

#### `GET /api/me/playlists`
**Mô tả:** Lấy danh sách playlist của user

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "playlists": [
    {
      "id": "uuid",
      "name": "My Playlist",
      "description": "Description",
      "image_url": "url",
      "track_count": 15,
      "is_public": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/playlists`
**Mô tả:** Tạo playlist mới

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Request:**
```json
{
  "name": "New Playlist",
  "description": "Description",
  "is_public": true
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "New Playlist", 
  "description": "Description",
  "image_url": null,
  "is_public": true,
  "user_id": "uuid",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### `GET /api/playlists/{playlistId}`
**Mô tả:** Lấy chi tiết playlist và danh sách tracks

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Playlist Name",
  "description": "Description",
  "image_url": "url",
  "is_public": true,
  "user": {
    "id": "uuid",
    "display_name": "User Name"
  },
  "tracks": [
    {
      "id": "uuid",
      "title": "Track Name",
      "duration": 240,
      "image_url": "url", 
      "position": 1,
      "added_at": "2024-01-01T00:00:00Z",
      "artist": {
        "id": "uuid",
        "name": "Artist Name"
      }
    }
  ],
  "total_tracks": 10
}
```

#### `POST /api/playlists/{playlistId}/tracks`
**Mô tả:** Thêm track vào playlist

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Request:**
```json
{
  "track_id": "uuid",
  "position": 5
}
```

**Response (201):**
```json
{
  "message": "Track added to playlist",
  "position": 5
}
```

#### `DELETE /api/playlists/{playlistId}/tracks/{trackId}`
**Mô tả:** Xóa track khỏi playlist

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "message": "Track removed from playlist"
}
```

### **Liked Songs** (Special Playlist)

#### `GET /api/me/tracks/liked`
**Mô tả:** Lấy danh sách bài hát đã like

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Query Parameters:**
- `limit`: Số lượng tracks (default: 50, max: 50)
- `offset`: Vị trí bắt đầu (default: 0)

**Response (200):**
```json
{
  "tracks": [
    {
      "id": "uuid",
      "title": "Track Name",
      "duration": 240,
      "image_url": "url",
      "saved_at": "2024-01-01T00:00:00Z",
      "artist": {
        "id": "uuid", 
        "name": "Artist"
      }
    }
  ],
  "total": 125
}
```

#### `POST /api/me/tracks/{trackId}/like`
**Mô tả:** Like bài hát

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "message": "Track liked",
  "is_liked": true
}
```

#### `DELETE /api/me/tracks/{trackId}/like`
**Mô tả:** Unlike bài hát

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "message": "Track unliked",
  "is_liked": false
}
```

### **Player Control**

#### `GET /api/me/player`
**Mô tả:** Lấy trạng thái player hiện tại

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "is_playing": true,
  "position": 52000,
  "volume": 70,
  "shuffle": false,
  "repeat_mode": "off",
  "track": {
    "id": "uuid",
    "title": "Current Track",
    "duration": 240000,
    "image_url": "url",
    "artist": {
      "id": "uuid",
      "name": "Artist Name"
    }
  },
  "context": {
    "type": "playlist",
    "id": "uuid",
    "name": "Context Name"
  }
}
```

#### `PUT /api/me/player/play`
**Mô tả:** Bắt đầu/tiếp tục phát nhạc

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Request:**
```json
{
  "track_id": "uuid",
  "context_id": "uuid",
  "position": 0
}
```

**Response (200):**
```json
{
  "message": "Playback started"
}
```

#### `PUT /api/me/player/pause`
**Mô tả:** Tạm dừng phát nhạc

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "message": "Playback paused"
}
```

#### `PUT /api/me/player/seek`
**Mô tả:** Tua đến vị trí cụ thể

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Request:**
```json
{
  "position": 120000
}
```

**Response (200):**
```json
{
  "message": "Seek completed"
}
```

#### `PUT /api/me/player/volume`
**Mô tả:** Điều chỉnh âm lượng

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Request:**
```json
{
  "volume": 80
}
```

**Response (200):**
```json
{
  "message": "Volume updated"
}
```

#### `PUT /api/me/player/shuffle`
**Mô tả:** Bật/tắt shuffle

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Request:**
```json
{
  "state": true
}
```

**Response (200):**
```json
{
  "message": "Shuffle updated",
  "shuffle": true
}
```

#### `PUT /api/me/player/repeat`
**Mô tả:** Thay đổi chế độ repeat

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Request:**
```json
{
  "state": "track"
}
```

**Response (200):**
```json
{
  "message": "Repeat mode updated",
  "repeat_mode": "track"
}
```

#### `POST /api/me/player/next`
**Mô tả:** Chuyển bài tiếp theo

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "message": "Skipped to next track",
  "track": {
    "id": "uuid",
    "title": "Next Track"
  }
}
```

#### `POST /api/me/player/previous`
**Mô tả:** Chuyển bài trước đó

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Response (200):**
```json
{
  "message": "Skipped to previous track",
  "track": {
    "id": "uuid", 
    "title": "Previous Track"
  }
}
```

### **Recently Played**

#### `GET /api/me/player/recently-played`
**Mô tả:** Lấy danh sách bài hát đã phát gần đây

**Headers:** 
```
Authorization: Bearer jwt_token
```

**Query Parameters:**
- `limit`: Số lượng items (default: 20, max: 50)
- `before`: Timestamp để lấy items trước thời điểm này
- `after`: Timestamp để lấy items sau thời điểm này

**Response (200):**
```json
{
  "items": [
    {
      "track": {
        "id": "uuid",
        "title": "Track Name",
        "duration": 240,
        "image_url": "url",
        "artist": {
          "id": "uuid",
          "name": "Artist"
        }
      },
      "played_at": "2024-01-15T10:30:00Z",
      "context": {
        "type": "playlist",
        "id": "uuid"
      }
    }
  ],
  "total": 100
}
```

---

## 3. TECHNICAL SPECIFICATIONS

### **Authentication**
- **JWT Tokens:** Access token (1 hour) + Refresh token (30 days)
- **Rate Limiting:** 100 requests/minute per user
- **Security:** bcrypt cho password hashing
- **Headers:** `Authorization: Bearer {token}`

### **File Storage & Media**
- **Audio Files:** AWS S3/CloudFront CDN
- **Audio Formats:** MP3, AAC, OGG support
- **Image Sizes:** 
  - Thumbnail: 40x40, 56x56
  - Standard: 300x300
  - Large: 640x640, 1200x1200
- **Image Formats:** JPEG, PNG, WebP

### **Database Performance**

#### **Essential Indexes:**
```sql
-- Performance indexes
CREATE INDEX idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX idx_tracks_album_id ON tracks(album_id);
CREATE INDEX idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX idx_user_library_user_type ON user_library(user_id, item_type);
CREATE INDEX idx_play_history_user_played ON play_history(user_id, played_at DESC);
CREATE INDEX idx_tracks_play_count ON tracks(play_count DESC);

-- Search indexes (PostgreSQL)
CREATE INDEX idx_artists_name_gin ON artists USING gin(to_tsvector('english', name));
CREATE INDEX idx_tracks_title_gin ON tracks USING gin(to_tsvector('english', title));
CREATE INDEX idx_playlists_name_gin ON playlists USING gin(to_tsvector('english', name));

-- Composite indexes for common queries
CREATE INDEX idx_user_library_user_type_saved ON user_library(user_id, item_type, saved_at DESC);
CREATE INDEX idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);
```

### **API Response Format**

#### **Success Response:**
```json
{
  "data": {...},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "has_next": true
  }
}
```

#### **Pagination:**
- **Default limit:** 20
- **Maximum limit:** 50  
- **Offset-based pagination**
- **Include total count** trong responses

### **Caching Strategy**
- **Redis:** User sessions, popular tracks, search results
- **CDN:** Static assets (images, audio)
- **Application Cache:** Artist info, album data (5-minute TTL)

---

## 4. ERROR HANDLING

### **HTTP Status Codes**
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

### **Error Response Format**
```json
{
  "error": {
    "code": "TRACK_NOT_FOUND",
    "message": "Track not found",
    "details": "Track with id 'uuid' does not exist",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### **Common Error Codes**
```
AUTH_REQUIRED - Authentication required
INVALID_TOKEN - Invalid or expired token
USER_NOT_FOUND - User not found
ARTIST_NOT_FOUND - Artist not found
TRACK_NOT_FOUND - Track not found
PLAYLIST_NOT_FOUND - Playlist not found
PERMISSION_DENIED - Insufficient permissions
VALIDATION_ERROR - Request validation failed
DUPLICATE_ENTRY - Resource already exists
RATE_LIMIT_EXCEEDED - Too many requests
```

### **Validation Errors**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

---

## 5. IMPLEMENTATION NOTES

### **Database Migrations**
```sql
-- Sample migration for creating tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE item_type AS ENUM ('track', 'album', 'playlist', 'artist');
CREATE TYPE repeat_mode AS ENUM ('off', 'track', 'playlist');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **API Middleware Stack**
1. **CORS** - Cross-origin requests
2. **Rate Limiting** - DDoS protection  
3. **Authentication** - JWT validation
4. **Validation** - Request/response validation
5. **Logging** - Request/response logging
6. **Error Handling** - Centralized error responses

### **Real-time Features (Optional)**
- **WebSocket endpoints** cho real-time player sync
- **Server-sent events** cho notifications
- **Redis Pub/Sub** cho cross-device synchronization

### **Testing Requirements**
- **Unit Tests:** Business logic, utilities
- **Integration Tests:** API endpoints
- **E2E Tests:** Critical user flows
- **Load Tests:** Performance benchmarks

### **Environment Variables**
```env
DATAAPP_URL=postgresql://user:pass@localhost:5432/spotify_clone
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=1h
REFRESH_TOKEN_EXPIRE=30d
REDIS_URL=redis://localhost:6379
AWS_S3_BUCKET=spotify-clone-media
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```

### **API Documentation**
- **OpenAPI/Swagger** specification
- **Postman collection** cho testing
- **Authentication examples** cho mỗi endpoint
- **Rate limiting information**

---

## 6. DEPLOYMENT CONSIDERATIONS

### **Infrastructure**
- **Application Server:** Node.js/Express, Python/FastAPI, hoặc tương tự
- **Database:** PostgreSQL với read replicas
- **Cache:** Redis cluster
- **File Storage:** AWS S3 + CloudFront
- **Load Balancer:** nginx hoặc AWS ALB

### **Monitoring & Logging**
- **Application Monitoring:** New Relic, DataDog
- **Error Tracking:** Sentry
- **Logs:** ELK Stack hoặc CloudWatch
- **Metrics:** Track API response times, error rates

### **Security**
- **HTTPS only** - Force SSL/TLS
- **SQL Injection** - Parameterized queries
- **XSS Protection** - Input sanitization
- **Rate Limiting** - Per-user và global limits
- **CORS** - Proper origin configuration

---

*Specification này cung cấp foundation hoàn chỉnh để implement backend cho Spotify clone UI. Tất cả endpoints được thiết kế để support đầy đủ các features thể hiện trong giao diện người dùng.* 