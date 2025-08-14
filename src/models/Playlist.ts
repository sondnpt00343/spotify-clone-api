import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PlaylistWithDetails extends Playlist {
  user_username: string;
  user_display_name?: string;
  total_tracks: number;
  total_duration: number;
  followers_count: number;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  added_by_user_id: string;
  added_at: string;
  position: number;
}

export interface PlaylistTrackWithDetails extends PlaylistTrack {
  track_title: string;
  track_duration: number;
  track_audio_url: string;
  track_image_url?: string;
  track_play_count: number;
  artist_id: string;
  artist_name: string;
  artist_image_url?: string;
  album_id?: string;
  album_title?: string;
  album_cover_image_url?: string;
  added_by_username: string;
}

export interface CreatePlaylistData {
  name: string;
  description?: string;
  image_url?: string;
  is_public?: boolean;
}

export interface UpdatePlaylistData {
  name?: string;
  description?: string;
  image_url?: string;
  is_public?: boolean;
}

export class PlaylistModel {
  // Find playlist by ID
  static async findById(id: string): Promise<Playlist | null> {
    const playlist = await db('playlists').where({ id }).first();
    return playlist || null;
  }

  // Find playlist by name and user ID for duplicate checking
  static async findByNameAndUser(name: string, userId: string): Promise<Playlist | null> {
    const playlist = await db('playlists')
      .where({ name: name.trim(), user_id: userId })
      .first();
    return playlist || null;
  }

  // Get playlist with details (user info, stats)
  static async getWithDetails(id: string): Promise<PlaylistWithDetails | null> {
    const result = await db('playlists')
      .select([
        'playlists.*',
        'users.username as user_username',
        'users.display_name as user_display_name'
      ])
      .leftJoin('users', 'playlists.user_id', 'users.id')
      .where('playlists.id', id)
      .first();

    if (!result) return null;

    // Get track count and total duration
    const trackStats = await db('playlist_tracks')
      .select([
        db.raw('COUNT(*) as total_tracks'),
        db.raw('SUM(tracks.duration) as total_duration')
      ])
      .leftJoin('tracks', 'playlist_tracks.track_id', 'tracks.id')
      .where('playlist_tracks.playlist_id', id)
      .first();

    // Get followers count (from user_library)
    const followersCount = await db('user_library')
      .where({ item_type: 'playlist', item_id: id })
      .count('* as count')
      .first();

    return {
      ...result,
      total_tracks: parseInt(trackStats?.total_tracks as string) || 0,
      total_duration: parseInt(trackStats?.total_duration as string) || 0,
      followers_count: parseInt(followersCount?.count as string) || 0
    };
  }

  // Get user's playlists
  static async getUserPlaylists(userId: string, includePrivate: boolean = true): Promise<PlaylistWithDetails[]> {
    let query = db('playlists')
      .select([
        'playlists.*',
        'users.username as user_username',
        'users.display_name as user_display_name',
        db.raw('COUNT(playlist_tracks.id) as total_tracks'),
        db.raw('SUM(tracks.duration) as total_duration')
      ])
      .leftJoin('users', 'playlists.user_id', 'users.id')
      .leftJoin('playlist_tracks', 'playlists.id', 'playlist_tracks.playlist_id')
      .leftJoin('tracks', 'playlist_tracks.track_id', 'tracks.id')
      .where('playlists.user_id', userId);

    if (!includePrivate) {
      query = query.where('playlists.is_public', true);
    }

    const playlists = await query
      .groupBy('playlists.id')
      .orderBy('playlists.updated_at', 'desc');

    // Get followers count for each playlist
    const playlistIds = playlists.map(p => p.id);
    const followersData = await db('user_library')
      .select('item_id', db.raw('COUNT(*) as count'))
      .where('item_type', 'playlist')
      .whereIn('item_id', playlistIds)
      .groupBy('item_id');

    const followersMap = new Map(followersData.map(f => [f.item_id, parseInt(f.count as string)]));

    return playlists.map(playlist => ({
      ...playlist,
      total_tracks: parseInt(playlist.total_tracks as string) || 0,
      total_duration: parseInt(playlist.total_duration as string) || 0,
      followers_count: followersMap.get(playlist.id) || 0
    }));
  }

  // Get public playlists (browse/search)
  static async getPublicPlaylists(
    query?: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<PlaylistWithDetails[]> {
    let dbQuery = db('playlists')
      .select([
        'playlists.*',
        'users.username as user_username',
        'users.display_name as user_display_name',
        db.raw('COUNT(playlist_tracks.id) as total_tracks'),
        db.raw('SUM(tracks.duration) as total_duration')
      ])
      .leftJoin('users', 'playlists.user_id', 'users.id')
      .leftJoin('playlist_tracks', 'playlists.id', 'playlist_tracks.playlist_id')
      .leftJoin('tracks', 'playlist_tracks.track_id', 'tracks.id')
      .where('playlists.is_public', true);

    if (query) {
      dbQuery = dbQuery.where('playlists.name', 'like', `%${query}%`);
    }

    const playlists = await dbQuery
      .groupBy('playlists.id')
      .orderBy('playlists.updated_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Get followers count for each playlist
    const playlistIds = playlists.map(p => p.id);
    const followersData = await db('user_library')
      .select('item_id', db.raw('COUNT(*) as count'))
      .where('item_type', 'playlist')
      .whereIn('item_id', playlistIds)
      .groupBy('item_id');

    const followersMap = new Map(followersData.map(f => [f.item_id, parseInt(f.count as string)]));

    return playlists.map(playlist => ({
      ...playlist,
      total_tracks: parseInt(playlist.total_tracks as string) || 0,
      total_duration: parseInt(playlist.total_duration as string) || 0,
      followers_count: followersMap.get(playlist.id) || 0
    }));
  }

  // Generate unique playlist name for user
  private static async generateUniquePlaylistName(userId: string, originalName: string): Promise<string> {
    // Extract base name (remove #number suffix if exists)
    const baseNameMatch = originalName.match(/^(.+?)(?:\s#\d+)?$/);
    const baseName = baseNameMatch && baseNameMatch[1] ? baseNameMatch[1].trim() : originalName;
    
    // Get all playlists for this user that start with the base name
    const existingPlaylists = await db('playlists')
      .select('name')
      .where('user_id', userId)
      .where('name', 'like', `${baseName}%`);
    
    const existingNames = existingPlaylists.map(p => p.name);
    
    // If exact base name doesn't exist, use it
    if (!existingNames.includes(baseName)) {
      return baseName;
    }
    
    // Find the highest number used
    let highestNumber = 1;
    const numberRegex = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s#(\\d+))?$`);
    
    for (const name of existingNames) {
      const match = name.match(numberRegex);
      if (match) {
        const number = match[1] ? parseInt(match[1]) : 1; // Base name without number is considered #1
        if (number > highestNumber) {
          highestNumber = number;
        }
      }
    }
    
    // Return next available number
    return `${baseName} #${highestNumber + 1}`;
  }

  // Create new playlist
  static async create(userId: string, playlistData: CreatePlaylistData): Promise<Playlist> {
    const id = uuidv4();
    
    // Generate unique name for this user
    const uniqueName = await this.generateUniquePlaylistName(userId, playlistData.name);
    
    const newPlaylist = {
      id,
      name: uniqueName,
      description: playlistData.description || null,
      image_url: playlistData.image_url || null,
      is_public: playlistData.is_public ?? false,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db('playlists').insert(newPlaylist);
    return newPlaylist as Playlist;
  }

  // Update playlist
  static async update(id: string, userId: string, playlistData: UpdatePlaylistData): Promise<Playlist | null> {
    const updateData = {
      ...playlistData,
      updated_at: new Date().toISOString()
    };

    await db('playlists')
      .where({ id, user_id: userId })
      .update(updateData);
    
    return this.findById(id);
  }

  // Delete playlist
  static async delete(id: string, userId: string): Promise<void> {
    await db.transaction(async (trx) => {
      // Delete playlist tracks first
      await trx('playlist_tracks').where({ playlist_id: id }).del();
      
      // Delete from user library (followers)
      await trx('user_library')
        .where({ item_type: 'playlist', item_id: id })
        .del();
      
      // Delete playlist
      await trx('playlists')
        .where({ id, user_id: userId })
        .del();
    });
  }

  // Check if user owns playlist
  static async isOwner(playlistId: string, userId: string): Promise<boolean> {
    const playlist = await db('playlists')
      .where({ id: playlistId, user_id: userId })
      .first();
    return !!playlist;
  }

  // Check if user can access playlist (public or owner)
  static async canAccess(playlistId: string, userId?: string): Promise<boolean> {
    const playlist = await db('playlists')
      .where({ id: playlistId })
      .first();
    
    if (!playlist) return false;
    if (playlist.is_public) return true;
    if (userId && playlist.user_id === userId) return true;
    
    return false;
  }

  // Get playlist tracks with details
  static async getTracks(playlistId: string, limit: number = 50, offset: number = 0): Promise<PlaylistTrackWithDetails[]> {
    return db('playlist_tracks')
      .select([
        'playlist_tracks.*',
        'tracks.title as track_title',
        'tracks.duration as track_duration',
        'tracks.audio_url as track_audio_url',
        'tracks.image_url as track_image_url',
        'tracks.play_count as track_play_count',
        'tracks.artist_id',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        'tracks.album_id',
        'albums.title as album_title',
        'albums.cover_image_url as album_cover_image_url',
        'users.username as added_by_username'
      ])
      .join('tracks', 'playlist_tracks.track_id', 'tracks.id')
      .leftJoin('artists', 'tracks.artist_id', 'artists.id')
      .leftJoin('albums', 'tracks.album_id', 'albums.id')
      .leftJoin('users', 'playlist_tracks.added_by_user_id', 'users.id')
      .where('playlist_tracks.playlist_id', playlistId)
      .orderBy('playlist_tracks.position', 'asc')
      .limit(limit)
      .offset(offset);
  }

  // Add track to playlist
  static async addTrack(playlistId: string, trackId: string, addedByUserId: string): Promise<PlaylistTrack> {
    // Get current max position
    const maxPosition = await db('playlist_tracks')
      .where({ playlist_id: playlistId })
      .max('position as max_pos')
      .first();
    
    const newPosition = (maxPosition?.max_pos as number || 0) + 1;
    
    const playlistTrack = {
      id: uuidv4(),
      playlist_id: playlistId,
      track_id: trackId,
      added_by_user_id: addedByUserId,
      added_at: new Date().toISOString(),
      position: newPosition
    };

    await db.transaction(async (trx) => {
      await trx('playlist_tracks').insert(playlistTrack);
      
      // Update playlist updated_at
      await trx('playlists')
        .where({ id: playlistId })
        .update({ updated_at: new Date().toISOString() });
    });

    return playlistTrack as PlaylistTrack;
  }

  // Remove track from playlist
  static async removeTrack(playlistId: string, trackId: string, userId: string): Promise<void> {
    await db.transaction(async (trx) => {
      // Find the track to remove
      const trackToRemove = await trx('playlist_tracks')
        .where({ 
          playlist_id: playlistId, 
          track_id: trackId 
        })
        .first();

      if (!trackToRemove) return;

      // Remove the track
      await trx('playlist_tracks')
        .where({ 
          playlist_id: playlistId, 
          track_id: trackId 
        })
        .del();

      // Update positions of tracks that come after the removed track
      await trx('playlist_tracks')
        .where('playlist_id', playlistId)
        .where('position', '>', trackToRemove.position)
        .decrement('position', 1);

      // Update playlist updated_at
      await trx('playlists')
        .where({ id: playlistId })
        .update({ updated_at: new Date().toISOString() });
    });
  }

  // Reorder tracks in playlist
  static async reorderTracks(playlistId: string, trackId: string, newPosition: number, userId: string): Promise<void> {
    await db.transaction(async (trx) => {
      const currentTrack = await trx('playlist_tracks')
        .where({ playlist_id: playlistId, track_id: trackId })
        .first();

      if (!currentTrack) return;

      const oldPosition = currentTrack.position;

      if (oldPosition === newPosition) return;

      if (oldPosition < newPosition) {
        // Moving down: shift up tracks between old and new position
        await trx('playlist_tracks')
          .where('playlist_id', playlistId)
          .where('position', '>', oldPosition)
          .where('position', '<=', newPosition)
          .decrement('position', 1);
      } else {
        // Moving up: shift down tracks between new and old position  
        await trx('playlist_tracks')
          .where('playlist_id', playlistId)
          .where('position', '>=', newPosition)
          .where('position', '<', oldPosition)
          .increment('position', 1);
      }

      // Update the track's position
      await trx('playlist_tracks')
        .where({ playlist_id: playlistId, track_id: trackId })
        .update({ position: newPosition });

      // Update playlist updated_at
      await trx('playlists')
        .where({ id: playlistId })
        .update({ updated_at: new Date().toISOString() });
    });
  }

  // Check if track is in playlist
  static async hasTrack(playlistId: string, trackId: string): Promise<boolean> {
    const track = await db('playlist_tracks')
      .where({ playlist_id: playlistId, track_id: trackId })
      .first();
    return !!track;
  }

  // Follow playlist (add to user library)
  static async follow(userId: string, playlistId: string): Promise<void> {
    const followData = {
      id: uuidv4(),
      user_id: userId,
      item_type: 'playlist',
      item_id: playlistId,
      saved_at: new Date().toISOString()
    };

    await db('user_library').insert(followData);
  }

  // Unfollow playlist
  static async unfollow(userId: string, playlistId: string): Promise<void> {
    await db('user_library')
      .where({ 
        user_id: userId, 
        item_type: 'playlist', 
        item_id: playlistId 
      })
      .del();
  }

  // Check if user is following playlist
  static async isFollowing(userId: string, playlistId: string): Promise<boolean> {
    const follow = await db('user_library')
      .where({ 
        user_id: userId, 
        item_type: 'playlist', 
        item_id: playlistId 
      })
      .first();
    return !!follow;
  }

  // Get user's followed playlists
  static async getFollowedPlaylists(userId: string, limit: number = 20, offset: number = 0): Promise<PlaylistWithDetails[]> {
    const playlists = await db('user_library')
      .select([
        'playlists.*',
        'users.username as user_username',
        'users.display_name as user_display_name',
        'user_library.saved_at'
      ])
      .join('playlists', 'user_library.item_id', 'playlists.id')
      .leftJoin('users', 'playlists.user_id', 'users.id')
      .where('user_library.user_id', userId)
      .where('user_library.item_type', 'playlist')
      .orderBy('user_library.saved_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Get track stats for each playlist
    const playlistIds = playlists.map(p => p.id);
    const trackStats = await db('playlist_tracks')
      .select([
        'playlist_id',
        db.raw('COUNT(*) as total_tracks'),
        db.raw('SUM(tracks.duration) as total_duration')
      ])
      .leftJoin('tracks', 'playlist_tracks.track_id', 'tracks.id')
      .whereIn('playlist_id', playlistIds)
      .groupBy('playlist_id');

    const statsMap = new Map(trackStats.map(s => [s.playlist_id, s]));

    return playlists.map(playlist => {
      const stats = statsMap.get(playlist.id);
      return {
        ...playlist,
        total_tracks: parseInt(stats?.total_tracks as string) || 0,
        total_duration: parseInt(stats?.total_duration as string) || 0,
        followers_count: 0 // Will be calculated if needed
      };
    });
  }
} 