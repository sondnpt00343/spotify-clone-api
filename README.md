# Spotify Clone API

A comprehensive music streaming backend API built with ExpressJS, TypeScript, and SQLite. This API provides all the core functionality needed for a modern music streaming application including user authentication, music library management, real-time player controls, and advanced search capabilities.

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

### Authentication & User Management
```
POST /api/auth/register          # Register new user account
POST /api/auth/login            # Authenticate user and get tokens
POST /api/auth/change-password  # Change user password (authenticated)
POST /api/auth/refresh-token    # Refresh access token
GET  /api/users/me             # Get current user profile
PUT  /api/users/me             # Update current user profile
GET  /api/me/tracks/liked      # Get user's liked tracks
GET  /api/me/albums/liked      # Get user's liked albums
GET  /api/me/playlists         # Get user's created playlists
GET  /api/me/playlists/followed # Get user's followed playlists
GET  /api/me/player/recently-played # Get recently played tracks
```

### Artists Management
```
GET    /api/artists                    # Browse and search artists
GET    /api/artists/trending           # Get trending artists
GET    /api/artists/:id                # Get artist details with statistics
GET    /api/artists/:id/tracks/popular # Get artist's most popular tracks
GET    /api/artists/:id/albums         # Get artist's albums and singles
POST   /api/artists/:id/follow        # Follow an artist (authenticated)
DELETE /api/artists/:id/follow        # Unfollow an artist (authenticated)
POST   /api/artists                   # Create new artist (admin only)
PUT    /api/artists/:id               # Update artist information (admin only)
DELETE /api/artists/:id               # Delete artist (admin only)
```

### Tracks Management
```
GET    /api/tracks                  # Browse and search tracks
GET    /api/tracks/popular          # Get globally popular tracks
GET    /api/tracks/trending         # Get currently trending tracks
GET    /api/tracks/:id              # Get detailed track information
POST   /api/tracks/:id/play         # Record track play (updates history)
POST   /api/tracks/:id/like         # Like a track (authenticated)
DELETE /api/tracks/:id/like         # Remove like from track (authenticated)
POST   /api/tracks                  # Create new track (admin only)
PUT    /api/tracks/:id              # Update track information (admin only)
DELETE /api/tracks/:id              # Delete track (admin only)
```

### Playlists Management
```
GET    /api/playlists                          # Browse public playlists with search
GET    /api/playlists/:id                      # Get playlist details and metadata
GET    /api/playlists/:id/tracks               # Get all tracks in playlist with pagination
POST   /api/playlists                          # Create new playlist (authenticated)
PUT    /api/playlists/:id                      # Update playlist info (owner only)
DELETE /api/playlists/:id                      # Delete playlist (owner only)

# Track Management (Owner Only)
POST   /api/playlists/:id/tracks               # Add track to playlist
DELETE /api/playlists/:id/tracks/:trackId      # Remove track from playlist
PUT    /api/playlists/:id/tracks/:trackId/position # Reorder tracks by position

# Social Features (Authenticated Users)
POST   /api/playlists/:id/follow               # Follow public playlist
DELETE /api/playlists/:id/follow               # Unfollow playlist
```

### Albums Management
```
GET    /api/albums                  # Browse and search albums
GET    /api/albums/popular          # Get popular albums
GET    /api/albums/new-releases     # Get latest album releases
GET    /api/albums/:id              # Get album details and metadata
GET    /api/albums/:id/tracks       # Get all tracks in album
POST   /api/albums/:id/like         # Like an album (authenticated)
DELETE /api/albums/:id/like         # Remove like from album (authenticated)
POST   /api/albums                  # Create new album (admin only)
PUT    /api/albums/:id              # Update album information (admin only)
DELETE /api/albums/:id              # Delete album (admin only)
```

### Search & Discovery
```
GET /api/search                     # Universal search across all content types
GET /api/search/quick               # Fast search for autocomplete features
GET /api/search/suggestions         # Get search term suggestions
GET /api/search/trending            # Get trending search queries
GET /api/search/tracks              # Search tracks with detailed results
GET /api/search/artists             # Search artists with detailed results
GET /api/search/albums              # Search albums with detailed results
GET /api/search/playlists           # Search public playlists
```

### Player Controls & Playback
```
GET    /api/me/player                  # Get current playback state and track info
PUT    /api/me/player/play             # Start playback or resume paused track
PUT    /api/me/player/pause            # Pause current playback
POST   /api/me/player/next            # Skip to next track in queue/context
POST   /api/me/player/previous        # Go back to previous track
PUT    /api/me/player/seek             # Seek to specific position in track
PUT    /api/me/player/volume           # Set playback volume (0-100)
PUT    /api/me/player/shuffle          # Toggle shuffle mode on/off
PUT    /api/me/player/repeat           # Set repeat mode (off/context/track)
GET    /api/me/player/queue            # Get current playback queue
POST   /api/me/player/queue           # Add track to playback queue
DELETE /api/me/player/queue/:id       # Remove specific track from queue
DELETE /api/me/player/queue           # Clear entire playback queue
PUT    /api/me/player/device          # Transfer playback to different device
DELETE /api/me/player                 # Stop playback completely
```

### File Upload & Media Management
```
POST   /api/upload/avatar               # Upload user profile avatar (authenticated)
POST   /api/upload/artist/:id/image     # Upload artist profile image (admin only)
POST   /api/upload/album/:id/cover      # Upload album cover artwork (admin only)
POST   /api/upload/playlist/:id/cover   # Upload playlist cover image (owner only)
POST   /api/upload/track/:id/audio      # Upload track audio file (admin only)
POST   /api/upload/images               # Upload multiple images at once
GET    /api/upload/serve/:type/:file    # Serve and stream uploaded media files
GET    /api/upload/info/:type/:file     # Get file metadata and information
DELETE /api/upload/:type/:file          # Delete uploaded file (admin only)
```

### System Health & Administration
```
GET  /health                        # Basic API health status check
GET  /health/performance           # Detailed performance metrics
GET  /api/cache/stats              # Cache usage statistics (admin only)
POST /api/cache/clear              # Clear application cache (admin only)
GET  /api/admin/users              # Get all users (admin only)
GET  /api/admin/stats              # Get system statistics (admin only)
```

## 📖 API Details

### Playlist Follow/Unfollow APIs

#### Follow Playlist
```http
POST /api/playlists/:id/follow
Authorization: Bearer {access_token}
```

**Description**: Follow a public playlist to add it to your library  
**Authentication**: Required  
**Parameters**:
- `id` (path): Playlist UUID

**Validation Rules**:
- ✅ Playlist must exist
- ✅ Playlist must be public
- ✅ Cannot follow your own playlist
- ✅ Cannot follow if already following

**Response Success** (200):
```json
{
  "message": "Playlist followed successfully",
  "is_following": true
}
```

**Error Responses**:
- `400` - Missing playlist ID
- `401` - User not authenticated  
- `403` - Cannot follow private playlist
- `404` - Playlist not found
- `409` - Already following or trying to follow own playlist

#### Unfollow Playlist
```http
DELETE /api/playlists/:id/follow
Authorization: Bearer {access_token}
```

**Description**: Unfollow a playlist to remove it from your library  
**Authentication**: Required  
**Parameters**:
- `id` (path): Playlist UUID

**Validation Rules**:
- ✅ Must be currently following the playlist

**Response Success** (200):
```json
{
  "message": "Playlist unfollowed successfully", 
  "is_following": false
}
```

**Error Responses**:
- `400` - Missing playlist ID
- `401` - User not authenticated
- `409` - Not currently following this playlist

### Playlist Management Rules

#### Default "Liked Songs" Playlist
- ✅ **Auto-created** during user registration
- ❌ **Cannot be updated** - Name, description, or privacy settings
- ❌ **Cannot be deleted** - System playlist for user's liked tracks
- ✅ **Can add/remove tracks** - Standard track management applies

#### Playlist Name Validation
- ✅ **Unique names required** - No duplicate names within user's library
- ✅ **Auto-numbering for create** - "My Playlist #2" if "My Playlist" exists
- ❌ **No auto-numbering for update** - Returns error for duplicate names

**Update Playlist Error Responses**:
- `403` - Cannot modify "Liked Songs" playlist (`CANNOT_MODIFY_LIKED_SONGS`)
- `409` - Playlist name already exists (`DUPLICATE_PLAYLIST_NAME`)

**Delete Playlist Error Responses**:
- `403` - Cannot delete "Liked Songs" playlist (`CANNOT_DELETE_LIKED_SONGS`)

## 🗃️ Database Schema

### Core Tables
- **users** - User accounts, authentication, and profile information
- **artists** - Artist profiles with biographical information and statistics
- **albums** - Album collections with metadata and release information
- **tracks** - Individual songs with audio metadata and play statistics
- **playlists** - User-created playlists with privacy and sharing settings

### Relationship Tables
- **playlist_tracks** - Many-to-many mapping of tracks within playlists
- **user_library** - User's saved content (liked tracks, albums, etc.)
- **user_follows** - Artist following relationships and social features

### Feature Tables
- **play_history** - Complete listening history with timestamps and context
- **current_playback** - Real-time player state and active sessions
- **user_queue** - Personalized playback queue management

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript for production
npm run start        # Start production server from built files

# Database Management  
npm run migrate      # Run latest database migrations
npm run migrate:rollback # Rollback the last migration
npm run seed         # Populate database with sample data

# Code Quality & Testing
npm run lint         # Run ESLint code analysis
npm run lint:fix     # Automatically fix ESLint issues
npm test             # Run test suite
npm run test:watch   # Run tests in watch mode for development
```

### Project Structure
```
src/
├── controllers/        # API request handlers and business logic
├── middleware/        # Authentication, validation, and utility middleware
├── models/           # Database models and data access layer
├── routes/           # API route definitions and endpoint mapping
├── migrations/       # Database schema migrations
├── seeds/           # Sample data for development and testing
├── utils/           # Helper functions and utilities
├── config/         # Database and application configuration
└── app.ts          # Main application entry point
```

## ✨ Key Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Secure password hashing with bcrypt
- Rate limiting and request validation
- Role-based access control for admin operations

### 🎵 Music Library Management
- Complete CRUD operations for artists, albums, and tracks
- Advanced search with relevance scoring and autocomplete
- User library management (liked tracks, albums, followed artists)
- Playlist creation, management, and sharing

### 🎮 Real-time Player Controls
- Full playback state management
- Play/pause/seek/volume controls
- Smart shuffle and repeat modes
- Queue management with add/remove/reorder
- Context-aware playback (album, playlist, search contexts)

### 📁 File Upload & Media Handling
- Multi-format support (JPEG, PNG, GIF, WebP, MP3, WAV, FLAC)
- Secure file validation and storage
- Automatic content-type detection and serving
- Image upload for avatars, album covers, and artist photos

### 🚀 Performance & Monitoring
- Response compression and caching
- Performance monitoring and health checks
- Memory-efficient data handling
- Production-ready error handling and logging

## 🔧 Configuration

### Environment Variables
```env
NODE_ENV=development
PORT=3000
DATAAPP_URL=./database.sqlite
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
# See env.example for complete list
```

### Database Configuration
- **Development**: SQLite file (`./database.sqlite`)
- **Test**: In-memory SQLite for fast testing
- **Production**: SQLite with performance optimizations

## 🧪 Testing

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
```

## 📚 Sample Data

The database comes pre-seeded with sample data for immediate testing:
- **4 Vietnamese Artists**: Đen, Trúc Nhân, Thùy Chi, Noo Phước Thịnh
- **4 Albums** with cover images and metadata
- **8 Tracks** with realistic play counts and duration
- **3 Test User Accounts** for different testing scenarios

### Test Accounts
```
Email: admin@spotify.com | Username: admin | Role: Admin
Email: user1@spotify.com | Username: musiclover | Role: User
Email: user2@spotify.com | Username: beatdrop | Role: User
Password for all accounts: password123
```

## 🎯 API Testing

### Using Postman Collection
1. Import `Spotify_Clone_API.postman_collection.json` into Postman
2. Set the `BASE_URL` variable to `http://localhost:3000`
3. Use the Login endpoint to obtain an access token
4. The token will be automatically set for authenticated requests
5. Test all endpoints with realistic data and scenarios

### Manual Testing
All endpoints support standard HTTP methods and return JSON responses with consistent error handling and status codes.

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 16+
- **Framework**: Express.js with TypeScript
- **Database**: SQLite with Knex.js query builder
- **Authentication**: JWT with bcrypt password hashing
- **File Upload**: Multer with format validation
- **Validation**: Joi schema validation
- **Security**: Helmet, CORS, Rate limiting

### Database Design
The API uses a relational database design with 11 tables optimized for music streaming:
- **Core Tables**: users, artists, albums, tracks, playlists
- **Relationship Tables**: playlist_tracks, user_library, user_follows
- **Feature Tables**: play_history, current_playback, user_queue

### API Design Principles
- RESTful endpoints with consistent naming
- JSON request/response format
- Comprehensive error handling with meaningful messages
- Pagination support for large datasets
- Optional authentication for public endpoints
- Role-based access control for admin operations

---

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

---

**Ready for production deployment** 🚀