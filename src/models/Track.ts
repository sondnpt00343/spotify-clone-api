import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';

export interface Track {
  id: string;
  title: string;
  duration: number; // in seconds
  audio_url?: string;
  image_url?: string;
  play_count: number;
  album_id?: string;
  artist_id: string;
  track_number?: number;
  created_at: string;
  updated_at: string;
}

export interface TrackWithDetails extends Track {
  artist_name: string;
  artist_image_url?: string;
  album_title?: string;
  album_cover_image_url?: string;
}

export interface CreateTrackData {
  title: string;
  duration?: number;
  audio_url?: string;
  image_url?: string;
  album_id?: string;
  artist_id: string;
  track_number?: number;
}

export interface UpdateTrackData {
  title?: string;
  duration?: number;
  audio_url?: string;
  image_url?: string;
  album_id?: string;
  artist_id?: string;
  track_number?: number;
}

export interface PlayHistoryEntry {
  track: TrackWithDetails;
  played_at: string;
  play_duration?: number;
}

export class TrackModel {
  // Find track by ID
  static async findById(id: string): Promise<Track | null> {
    const track = await db('tracks').where({ id }).first();
    return track || null;
  }

  // Get track with artist and album details
  static async getWithDetails(id: string): Promise<TrackWithDetails | null> {
    const result = await db('tracks')
      .select([
        'tracks.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        'albums.title as album_title',
        'albums.cover_image_url as album_cover_image_url'
      ])
      .leftJoin('artists', 'tracks.artist_id', 'artists.id')
      .leftJoin('albums', 'tracks.album_id', 'albums.id')
      .where('tracks.id', id)
      .first();

    return result || null;
  }

  // Get all tracks with pagination
  static async getAll(limit: number = 20, offset: number = 0): Promise<TrackWithDetails[]> {
    return db('tracks')
      .select([
        'tracks.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        'albums.title as album_title',
        'albums.cover_image_url as album_cover_image_url'
      ])
      .leftJoin('artists', 'tracks.artist_id', 'artists.id')
      .leftJoin('albums', 'tracks.album_id', 'albums.id')
      .orderBy('tracks.play_count', 'desc')
      .limit(limit)
      .offset(offset);
  }

  // Search tracks by title
  static async search(query: string, limit: number = 20, offset: number = 0): Promise<TrackWithDetails[]> {
    return db('tracks')
      .select([
        'tracks.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        'albums.title as album_title',
        'albums.cover_image_url as album_cover_image_url'
      ])
      .leftJoin('artists', 'tracks.artist_id', 'artists.id')
      .leftJoin('albums', 'tracks.album_id', 'albums.id')
      .where('tracks.title', 'like', `%${query}%`)
      .orWhere('artists.name', 'like', `%${query}%`)
      .orderBy('tracks.play_count', 'desc')
      .limit(limit)
      .offset(offset);
  }

  // Get popular tracks globally
  static async getPopular(limit: number = 20, offset: number = 0): Promise<TrackWithDetails[]> {
    return db('tracks')
      .select([
        'tracks.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        'albums.title as album_title',
        'albums.cover_image_url as album_cover_image_url'
      ])
      .leftJoin('artists', 'tracks.artist_id', 'artists.id')
      .leftJoin('albums', 'tracks.album_id', 'albums.id')
      .orderBy('tracks.play_count', 'desc')
      .limit(limit)
      .offset(offset);
  }

  // Get tracks by artist
  static async getByArtist(artistId: string, limit: number = 20, offset: number = 0): Promise<TrackWithDetails[]> {
    return db('tracks')
      .select([
        'tracks.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        'albums.title as album_title',
        'albums.cover_image_url as album_cover_image_url'
      ])
      .leftJoin('artists', 'tracks.artist_id', 'artists.id')
      .leftJoin('albums', 'tracks.album_id', 'albums.id')
      .where('tracks.artist_id', artistId)
      .orderBy('tracks.play_count', 'desc')
      .limit(limit)
      .offset(offset);
  }

  // Get tracks by album
  static async getByAlbum(albumId: string): Promise<TrackWithDetails[]> {
    return db('tracks')
      .select([
        'tracks.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        'albums.title as album_title',
        'albums.cover_image_url as album_cover_image_url'
      ])
      .leftJoin('artists', 'tracks.artist_id', 'artists.id')
      .leftJoin('albums', 'tracks.album_id', 'albums.id')
      .where('tracks.album_id', albumId)
      .orderBy('tracks.track_number', 'asc');
  }

  // Create new track (admin only)
  static async create(trackData: CreateTrackData): Promise<Track> {
    const id = uuidv4();
    
    const newTrack = {
      id,
      title: trackData.title,
      duration: trackData.duration || 0, // Default to 0 if not provided, will be updated when audio uploaded
      audio_url: trackData.audio_url || null,
      image_url: trackData.image_url || null,
      play_count: 0,
      album_id: trackData.album_id || null,
      artist_id: trackData.artist_id,
      track_number: trackData.track_number || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db('tracks').insert(newTrack);
    return newTrack as Track;
  }

  // Update track (admin only)
  static async update(id: string, trackData: UpdateTrackData): Promise<Track | null> {
    const updateData = {
      ...trackData,
      updated_at: new Date().toISOString()
    };

    await db('tracks').where({ id }).update(updateData);
    return this.findById(id);
  }

  // Delete track (admin only)
  static async delete(id: string): Promise<void> {
    await db('tracks').where({ id }).del();
  }

  // Increment play count
  static async incrementPlayCount(trackId: string): Promise<void> {
    await db('tracks')
      .where({ id: trackId })
      .increment('play_count', 1);
  }

  // Record play in history
  static async recordPlay(userId: string, trackId: string, playDuration?: number): Promise<boolean> {
    // Get track info to determine duration
    const track = await this.findById(trackId);
    if (!track) return false;

    // Check for recent play to prevent spam (within 5 minutes)
    const hasRecentPlay = await this.checkRecentPlay(userId, trackId, 5);
    if (hasRecentPlay) {
      // Still record in history but don't count as new play
      const playRecord = {
        id: uuidv4(),
        user_id: userId,
        track_id: trackId,
        played_at: new Date().toISOString(),
        play_duration: playDuration || null
      };
      await db('play_history').insert(playRecord);
      return false;
    }

    // Calculate threshold: at least 30 seconds OR 50% of track duration
    const minDuration = Math.min(30, track.duration * 0.5);
    const shouldCount = playDuration ? playDuration >= minDuration : false;

    const playRecord = {
      id: uuidv4(),
      user_id: userId,
      track_id: trackId,
      played_at: new Date().toISOString(),
      play_duration: playDuration || null
    };

    // Always save to history, but only increment count when conditions are met
    if (shouldCount) {
      await Promise.all([
        db('play_history').insert(playRecord),
        this.incrementPlayCount(trackId)
      ]);
    } else {
      await db('play_history').insert(playRecord);
    }

    return shouldCount;
  }

  // Check for recent play to prevent spam
  static async checkRecentPlay(userId: string, trackId: string, windowMinutes: number = 5): Promise<boolean> {
    const recentTime = new Date();
    recentTime.setMinutes(recentTime.getMinutes() - windowMinutes);

    const recentPlay = await db('play_history')
      .where({
        user_id: userId,
        track_id: trackId
      })
      .where('played_at', '>', recentTime.toISOString())
      .first();

    return !!recentPlay; // true if there's a recent play
  }

  // Get user's recently played tracks
  static async getRecentlyPlayed(
    userId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<PlayHistoryEntry[]> {
    const results = await db('play_history')
      .select([
        'play_history.*',
        'tracks.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        'albums.title as album_title',
        'albums.cover_image_url as album_cover_image_url'
      ])
      .join('tracks', 'play_history.track_id', 'tracks.id')
      .leftJoin('artists', 'tracks.artist_id', 'artists.id')
      .leftJoin('albums', 'tracks.album_id', 'albums.id')
      .where('play_history.user_id', userId)
      .orderBy('play_history.played_at', 'desc')
      .limit(limit)
      .offset(offset);

    return results.map(row => ({
      track: {
        id: row.track_id,
        title: row.title,
        duration: row.duration,
        audio_url: row.audio_url,
        image_url: row.image_url,
        play_count: row.play_count,
        album_id: row.album_id,
        artist_id: row.artist_id,
        track_number: row.track_number,
        created_at: row.created_at,
        updated_at: row.updated_at,
        artist_name: row.artist_name,
        artist_image_url: row.artist_image_url,
        album_title: row.album_title,
        album_cover_image_url: row.album_cover_image_url
      },
      played_at: row.played_at,
      play_duration: row.play_duration
    }));
  }

  // Check if user has liked a track
  static async isLiked(userId: string, trackId: string): Promise<boolean> {
    const like = await db('user_library')
      .where({ 
        user_id: userId, 
        item_type: 'track', 
        item_id: trackId 
      })
      .first();
    return !!like;
  }

  // Like a track
  static async like(userId: string, trackId: string): Promise<void> {
    const likeData = {
      id: uuidv4(),
      user_id: userId,
      item_type: 'track',
      item_id: trackId,
      saved_at: new Date().toISOString()
    };

    await db('user_library').insert(likeData);
  }

  // Unlike a track
  static async unlike(userId: string, trackId: string): Promise<void> {
    await db('user_library')
      .where({ 
        user_id: userId, 
        item_type: 'track', 
        item_id: trackId 
      })
      .del();
  }

  // Get user's liked tracks
  static async getLikedTracks(
    userId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<TrackWithDetails[]> {
    return db('user_library')
      .select([
        'tracks.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        'albums.title as album_title',
        'albums.cover_image_url as album_cover_image_url',
        'user_library.saved_at'
      ])
      .join('tracks', 'user_library.item_id', 'tracks.id')
      .leftJoin('artists', 'tracks.artist_id', 'artists.id')
      .leftJoin('albums', 'tracks.album_id', 'albums.id')
      .where('user_library.user_id', userId)
      .where('user_library.item_type', 'track')
      .orderBy('user_library.saved_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  // Get trending tracks (most played recently)
  static async getTrending(limit: number = 20): Promise<TrackWithDetails[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return db('tracks')
      .select([
        'tracks.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        'albums.title as album_title',
        'albums.cover_image_url as album_cover_image_url',
        db.raw('COUNT(play_history.id) as recent_plays')
      ])
      .leftJoin('artists', 'tracks.artist_id', 'artists.id')
      .leftJoin('albums', 'tracks.album_id', 'albums.id')
      .leftJoin('play_history', function() {
        this.on('tracks.id', '=', 'play_history.track_id')
            .andOn('play_history.played_at', '>', db.raw('?', [sevenDaysAgo.toISOString()]));
      })
      .groupBy('tracks.id')
      .orderBy('recent_plays', 'desc')
      .limit(limit);
  }
} 