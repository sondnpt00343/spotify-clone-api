# Spotify Clone API

Backend API cho Spotify Clone sử dụng ExpressJS, TypeScript và SQLite.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- npm hoặc yarn

### Installation

1. **Clone repository và install dependencies:**
```bash
npm install
```

2. **Setup environment variables:**
Copy `env.example` thành `.env` và cập nhật values:
```bash
cp env.example .env
```

3. **Chạy migrations để tạo database:**
```bash
npm run migrate
```

4. **Seed sample data:**
```bash
npm run seed
```

5. **Start development server:**
```bash
npm run dev
```

Server sẽ chạy tại: http://localhost:3000

## 📊 API Endpoints

### Health Check
```
GET /health
```

### Authentication ✅
```
POST /api/auth/register      # User registration
POST /api/auth/login         # User login
GET /api/users/me           # Get user profile
PUT /api/users/me           # Update user profile
POST /api/auth/change-password # Change password
POST /api/auth/refresh-token   # Refresh JWT token
```

### Artists ✅
```
GET /api/artists                    # Browse/search artists
GET /api/artists/trending           # Get trending artists
GET /api/artists/:id                # Get artist details với stats
GET /api/artists/:id/tracks/popular # Artist's popular tracks
GET /api/artists/:id/albums         # Artist's albums
POST /api/artists/:id/follow        # Follow artist
DELETE /api/artists/:id/follow      # Unfollow artist
POST /api/artists                   # Create artist (admin)
PUT /api/artists/:id                # Update artist (admin)
DELETE /api/artists/:id             # Delete artist (admin)
```

### Tracks ✅
```
GET /api/tracks                     # Browse/search tracks
GET /api/tracks/popular             # Popular tracks globally
GET /api/tracks/trending            # Trending tracks
GET /api/tracks/:id                 # Get track details
POST /api/tracks/:id/play           # Play track (record history)
POST /api/tracks/:id/like           # Like track
DELETE /api/tracks/:id/like         # Unlike track
GET /api/me/tracks/liked            # User's liked tracks
GET /api/me/player/recently-played  # Recently played tracks
POST /api/tracks                    # Create track (admin)
PUT /api/tracks/:id                 # Update track (admin)
DELETE /api/tracks/:id              # Delete track (admin)
```

### Playlists ✅
```
GET /api/playlists                  # Browse/search public playlists
GET /api/playlists/:id              # Get playlist details
GET /api/playlists/:id/tracks       # Get playlist tracks
POST /api/playlists                 # Create playlist
PUT /api/playlists/:id              # Update playlist (owner only)
DELETE /api/playlists/:id           # Delete playlist (owner only)
POST /api/playlists/:id/tracks      # Add track to playlist
DELETE /api/playlists/:id/tracks/:trackId # Remove track from playlist
PUT /api/playlists/:id/tracks/:trackId/position # Reorder track
POST /api/playlists/:id/follow      # Follow playlist
DELETE /api/playlists/:id/follow    # Unfollow playlist
GET /api/me/playlists               # User's own playlists
GET /api/me/playlists/followed      # User's followed playlists
```

### Albums ✅
```
GET /api/albums                     # Browse/search albums
GET /api/albums/popular             # Popular albums
GET /api/albums/new-releases        # New releases
GET /api/albums/:id                 # Get album details
GET /api/albums/:id/tracks          # Get album tracks
POST /api/albums/:id/like           # Like album
DELETE /api/albums/:id/like         # Unlike album
GET /api/me/albums/liked            # User's liked albums
POST /api/albums                    # Create album (admin)
PUT /api/albums/:id                 # Update album (admin)  
DELETE /api/albums/:id              # Delete album (admin)
```

### Search ✅
```
GET /api/search                     # Universal search across all entities
GET /api/search/quick               # Quick search for autocomplete
GET /api/search/suggestions         # Search suggestions
GET /api/search/trending            # Trending searches
GET /api/search/tracks              # Search tracks only
GET /api/search/artists             # Search artists only
GET /api/search/albums              # Search albums only
GET /api/search/playlists           # Search playlists only
```

### Player Controls ✅
```
GET /api/me/player                  # Get current playback state
PUT /api/me/player/play             # Start/resume playback
PUT /api/me/player/pause            # Pause playback
POST /api/me/player/next            # Skip to next track
POST /api/me/player/previous        # Skip to previous track
PUT /api/me/player/seek             # Seek to position
PUT /api/me/player/volume           # Set volume
PUT /api/me/player/shuffle          # Toggle shuffle mode
PUT /api/me/player/repeat           # Set repeat mode
GET /api/me/player/queue            # Get user's queue
POST /api/me/player/queue           # Add track to queue
DELETE /api/me/player/queue/:id     # Remove track from queue
DELETE /api/me/player/queue         # Clear entire queue
PUT /api/me/player/device           # Transfer playback to device
DELETE /api/me/player               # Stop playback
```

### File Upload ✅
```
POST /api/upload/avatar             # Upload user avatar
POST /api/upload/artist/:id/image   # Upload artist image (admin)
POST /api/upload/album/:id/cover    # Upload album cover (admin) 
POST /api/upload/playlist/:id/cover # Upload playlist cover (owner)
POST /api/upload/track/:id/audio    # Upload track audio (admin)
POST /api/upload/images             # Upload multiple images
GET /api/upload/serve/:type/:file   # Serve uploaded files
GET /api/upload/info/:type/:file    # Get file information
DELETE /api/upload/:type/:file      # Delete uploaded file (admin)
```

### Performance & Monitoring ✅
```
GET /health/performance             # Performance health check
GET /api/cache/stats                # Cache statistics (admin)
POST /api/cache/clear               # Clear cache (admin)
```

[Full API documentation in `spotify-clone-api-specification.md`]

## 🗃️ Database Schema

### Core Tables
- **users** - User authentication & profiles
- **artists** - Verified artists với bio & stats
- **albums** - Artist albums collection  
- **tracks** - Individual songs với metadata
- **playlists** - User-created playlists
- **playlist_tracks** - Many-to-many tracks in playlists

### Features Tables
- **user_library** - Saved content tracking
- **user_follows** - Artist following system
- **play_history** - Listening history
- **current_playback** - Real-time player state
- **user_queue** - User's play queue management

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server với hot reload
npm run build        # Build production version
npm run start        # Start production server

# Database
npm run migrate      # Run latest migrations
npm run migrate:rollback # Rollback last migration
npm run seed         # Run seed files

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm test             # Run tests
npm run test:watch   # Watch mode testing
```

### Project Structure
```
src/
├── controllers/          # API controllers
├── middleware/          # Custom middleware
├── models/             # Database models (coming soon)
├── routes/             # Route definitions (coming soon)
├── migrations/         # Database migrations ✅
├── seeds/              # Seed data ✅
├── utils/              # Utility functions
├── types/              # TypeScript types
├── config/             # Configuration files ✅
└── app.ts              # Main app file ✅
```

## 📋 Implementation Plan

### ✅ Phase 1: Project Setup & Database Foundation (COMPLETED)
- [x] TypeScript + Express setup
- [x] Database migrations (10 tables)
- [x] Seed data (artists, albums, tracks)
- [x] Basic middleware (CORS, error handling, rate limiting)

### ✅ Phase 2: Authentication & User Management (COMPLETED)
- [x] JWT authentication system
- [x] User registration/login endpoints
- [x] Password hashing & validation
- [x] Auth middleware protection
- [x] Input validation với Joi
- [x] Rate limiting cho auth endpoints

### ✅ Phase 3: Core Entities (Artists, Albums, Tracks) (COMPLETED)
- [x] Artist models & controllers với full CRUD
- [x] Track models & controllers với play counting
- [x] Search functionality cho artists/tracks
- [x] Follow/unfollow artists
- [x] Like/unlike tracks
- [x] Recently played tracking
- [x] Popular & trending algorithms

### ✅ Phase 4: Playlists & User Library (COMPLETED)
- [x] Playlist CRUD operations với ownership & privacy
- [x] Add/remove/reorder tracks in playlists
- [x] Album models & controllers với full CRUD
- [x] Follow/unfollow playlists functionality
- [x] Like/unlike albums functionality
- [x] User library management cho tracks, albums, playlists
- [x] Search functionality cho playlists & albums
- [x] Advanced track positioning in playlists

### ✅ Phase 5: Player Controls & Search (COMPLETED)
- [x] Universal search engine across all entities
- [x] Real-time player state management
- [x] Complete playback controls (play/pause/seek/volume)
- [x] Smart shuffle & repeat modes
- [x] Queue management system
- [x] Context-aware track navigation
- [x] Advanced search với relevance scoring
- [x] Autocomplete & search suggestions

### ✅ Phase 6: Advanced Features & Optimization (COMPLETED)
- [x] File upload & media handling (images, audio)
- [x] Performance optimization (caching, compression)
- [x] Response time monitoring
- [x] Request size limiting & validation
- [x] Memory-efficient caching system
- [x] API documentation framework (Swagger ready)
- [x] Production-ready middleware stack
- [x] Advanced error handling & logging

## 🔧 Configuration

### Environment Variables
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=./database.sqlite
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
# See env.example for complete list
```

### Database Configuration
- **Development**: SQLite file (`./database.sqlite`)
- **Test**: In-memory SQLite
- **Production**: SQLite với optimizations

## 🧪 Testing

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
```

## 📚 Sample Data

Database được seed với:
- **4 nghệ sĩ Việt Nam**: Đen, Trúc Nhân, Thùy Chi, Noo Phước Thịnh
- **4 albums** với cover images
- **8 tracks** với play counts thật
- **3 test users** (password: `password123`)

### Test Accounts
```
Email: admin@spotify.com | Username: admin
Email: user1@spotify.com | Username: musiclover  
Email: user2@spotify.com | Username: beatdrop
```

## 🔗 API Documentation

Xem file `spotify-clone-api-specification.md` để có documentation đầy đủ về:
- Database schema chi tiết
- API endpoints với request/response examples  
- Authentication flows
- Error handling
- Technical specifications

## 🚀 Next Steps

1. ~~**Phase 2**: Implement authentication system~~ ✅
2. ~~**Phase 3**: Artist và track endpoints~~ ✅
3. ~~**Phase 4**: Playlist management~~ ✅
4. ~~**Phase 5**: Player controls & search~~ ✅
5. ~~**Phase 6**: Advanced features & optimization~~ ✅

---

**Status**: 🎉 ALL PHASES COMPLETED - Production-ready Spotify Clone API!

## 🧪 Testing APIs

### Phase 2 (Authentication)
Use `test-auth.http` để test authentication endpoints.

### Phase 3 (Artists & Tracks) 
Use `test-phase3.http` để test artist/track endpoints với:
- Browse/search artists and tracks
- Artist follow/unfollow functionality
- Track like/unlike và play recording
- Popular & trending algorithms
- Recently played history

### Phase 4 (Playlists & Albums)
Use `test-phase4.http` để test playlist/album endpoints với:
- Create/manage playlists với privacy controls
- Add/remove/reorder tracks in playlists
- Follow/unfollow playlists
- Album browsing, search và like/unlike
- User library management integration
- Complete CRUD operations for playlists & albums

### Phase 5 (Search & Player Controls)
Use `test-phase5.http` để test search/player endpoints với:
- Universal search across all entities (tracks, artists, albums, playlists)
- Real-time autocomplete và search suggestions
- Advanced search với relevance scoring
- Complete player controls (play/pause/seek/volume/shuffle/repeat)
- Smart queue management system
- Context-aware playback (album, playlist, search contexts)
- Device transfer và playback state management

### Phase 6 (File Upload & Advanced Features)
Use `test-phase6.http` để test upload/performance endpoints với:
- File upload validation và security (images, audio)
- Multi-format support (JPEG, PNG, GIF, WebP, MP3, WAV, FLAC)
- Automatic file serving với proper content-types
- Performance monitoring và cache management
- Response compression và optimization
- Rate limiting cho upload operations
- Advanced error handling for file operations 