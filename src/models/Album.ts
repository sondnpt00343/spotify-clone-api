import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';

export interface Album {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  release_date: string;
  artist_id: string;
  total_tracks: number;
  created_at: string;
  updated_at: string;
}

export interface AlbumWithDetails extends Album {
  artist_name: string;
  artist_image_url?: string;
  total_duration: number;
  play_count: number;
}

export interface CreateAlbumData {
  title: string;
  description?: string;
  cover_image_url?: string;
  release_date: string;
  artist_id: string;
}

export interface UpdateAlbumData {
  title?: string;
  description?: string;
  cover_image_url?: string;
  release_date?: string;
  artist_id?: string;
}

export class AlbumModel {
  // Find album by ID
  static async findById(id: string): Promise<Album | null> {
    const album = await db('albums').where({ id }).first();
    if (!album) return null;

    // Get total tracks count
    const trackCount = await db('tracks')
      .count('* as count')
      .where('album_id', id)
      .first();

    return {
      ...album,
      total_tracks: parseInt(trackCount?.count as string) || 0
    };
  }

  // Get album with artist details and stats
  static async getWithDetails(id: string): Promise<AlbumWithDetails | null> {
    const result = await db('albums')
      .select([
        'albums.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url'
      ])
      .leftJoin('artists', 'albums.artist_id', 'artists.id')
      .where('albums.id', id)
      .first();

    if (!result) return null;

    // Get track stats including count, total duration and play count
    const trackStats = await db('tracks')
      .select([
        db.raw('COUNT(*) as total_tracks'),
        db.raw('SUM(duration) as total_duration'),
        db.raw('SUM(play_count) as play_count')
      ])
      .where('album_id', id)
      .first();

    return {
      ...result,
      total_tracks: parseInt(trackStats?.total_tracks as string) || 0,
      total_duration: parseInt(trackStats?.total_duration as string) || 0,
      play_count: parseInt(trackStats?.play_count as string) || 0
    };
  }

  // Get all albums with pagination and optional search
  static async getAll(query?: string, limit: number = 20, offset: number = 0): Promise<AlbumWithDetails[]> {
    let dbQuery = db('albums')
      .select([
        'albums.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        db.raw('COUNT(tracks.id) as total_tracks'),
        db.raw('SUM(tracks.duration) as total_duration'),
        db.raw('SUM(tracks.play_count) as play_count')
      ])
      .leftJoin('artists', 'albums.artist_id', 'artists.id')
      .leftJoin('tracks', 'albums.id', 'tracks.album_id');

    if (query) {
      dbQuery = dbQuery.where('albums.title', 'like', `%${query}%`)
                      .orWhere('artists.name', 'like', `%${query}%`);
    }

    const albums = await dbQuery
      .groupBy('albums.id')
      .orderBy('albums.release_date', 'desc')
      .limit(limit)
      .offset(offset);

    return albums.map(album => ({
      ...album,
      total_tracks: parseInt(album.total_tracks as string) || 0,
      total_duration: parseInt(album.total_duration as string) || 0,
      play_count: parseInt(album.play_count as string) || 0
    }));
  }

  // Search albums by title or artist
  static async search(query: string, limit: number = 20, offset: number = 0): Promise<AlbumWithDetails[]> {
    return this.getAll(query, limit, offset);
  }

  // Get albums by artist
  static async getByArtist(artistId: string, limit: number = 20, offset: number = 0): Promise<AlbumWithDetails[]> {
    const albums = await db('albums')
      .select([
        'albums.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        db.raw('COUNT(tracks.id) as total_tracks'),
        db.raw('SUM(tracks.duration) as total_duration'),
        db.raw('SUM(tracks.play_count) as play_count')
      ])
      .leftJoin('artists', 'albums.artist_id', 'artists.id')
      .leftJoin('tracks', 'albums.id', 'tracks.album_id')
      .where('albums.artist_id', artistId)
      .groupBy('albums.id')
      .orderBy('albums.release_date', 'desc')
      .limit(limit)
      .offset(offset);

    return albums.map(album => ({
      ...album,
      total_tracks: parseInt(album.total_tracks as string) || 0,
      total_duration: parseInt(album.total_duration as string) || 0,
      play_count: parseInt(album.play_count as string) || 0
    }));
  }

  // Get popular albums (most played)
  static async getPopular(limit: number = 20, offset: number = 0): Promise<AlbumWithDetails[]> {
    const albums = await db('albums')
      .select([
        'albums.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        db.raw('COUNT(tracks.id) as total_tracks'),
        db.raw('SUM(tracks.duration) as total_duration'),
        db.raw('SUM(tracks.play_count) as play_count')
      ])
      .leftJoin('artists', 'albums.artist_id', 'artists.id')
      .leftJoin('tracks', 'albums.id', 'tracks.album_id')
      .groupBy('albums.id')
      .orderBy('play_count', 'desc')
      .limit(limit)
      .offset(offset);

    return albums.map(album => ({
      ...album,
      total_tracks: parseInt(album.total_tracks as string) || 0,
      total_duration: parseInt(album.total_duration as string) || 0,
      play_count: parseInt(album.play_count as string) || 0
    }));
  }

  // Get new releases (recent albums)
  static async getNewReleases(limit: number = 20, offset: number = 0): Promise<AlbumWithDetails[]> {
    const albums = await db('albums')
      .select([
        'albums.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        db.raw('COUNT(tracks.id) as total_tracks'),
        db.raw('SUM(tracks.duration) as total_duration'),
        db.raw('SUM(tracks.play_count) as play_count')
      ])
      .leftJoin('artists', 'albums.artist_id', 'artists.id')
      .leftJoin('tracks', 'albums.id', 'tracks.album_id')
      .groupBy('albums.id')
      .orderBy('albums.release_date', 'desc')
      .limit(limit)
      .offset(offset);

    return albums.map(album => ({
      ...album,
      total_tracks: parseInt(album.total_tracks as string) || 0,
      total_duration: parseInt(album.total_duration as string) || 0,
      play_count: parseInt(album.play_count as string) || 0
    }));
  }

  // Get album tracks
  static async getTracks(albumId: string): Promise<any[]> {
    return db('tracks')
      .select([
        'tracks.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url'
      ])
      .leftJoin('artists', 'tracks.artist_id', 'artists.id')
      .where('tracks.album_id', albumId)
      .orderBy('tracks.track_number', 'asc');
  }

  // Create new album (admin only)
  static async create(albumData: CreateAlbumData): Promise<Album> {
    const id = uuidv4();
    
    const newAlbum = {
      id,
      title: albumData.title,
      description: albumData.description || null,
      cover_image_url: albumData.cover_image_url || null,
      release_date: albumData.release_date,
      artist_id: albumData.artist_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db('albums').insert(newAlbum);
    
    // Return album with computed total_tracks
    const createdAlbum = await this.findById(id);
    return createdAlbum || { ...newAlbum, total_tracks: 0 } as Album;
  }

  // Update album (admin only)
  static async update(id: string, albumData: UpdateAlbumData): Promise<Album | null> {
    const updateData = {
      ...albumData,
      updated_at: new Date().toISOString()
    };

    await db('albums').where({ id }).update(updateData);
    return this.findById(id);
  }

  // Delete album (admin only)
  static async delete(id: string): Promise<void> {
    await db.transaction(async (trx) => {
      // First, remove tracks from playlists
      await trx('playlist_tracks')
        .whereIn('track_id', 
          trx('tracks').select('id').where('album_id', id)
        )
        .del();

      // Remove tracks from user library
      await trx('user_library')
        .where('item_type', 'track')
        .whereIn('item_id', 
          trx('tracks').select('id').where('album_id', id)
        )
        .del();

      // Remove play history for album tracks
      await trx('play_history')
        .whereIn('track_id', 
          trx('tracks').select('id').where('album_id', id)
        )
        .del();

      // Delete tracks
      await trx('tracks').where({ album_id: id }).del();
      
      // Remove album from user library
      await trx('user_library')
        .where({ item_type: 'album', item_id: id })
        .del();
      
      // Delete album
      await trx('albums').where({ id }).del();
    });
  }

  // Update track count for album
  static async updateTrackCount(albumId: string): Promise<void> {
    const trackCount = await db('tracks')
      .where({ album_id: albumId })
      .count('* as count')
      .first();

    await db('albums')
      .where({ id: albumId })
      .update({ 
        total_tracks: parseInt(trackCount?.count as string) || 0,
        updated_at: new Date().toISOString()
      });
  }

  // Check if user has liked/saved album
  static async isLiked(userId: string, albumId: string): Promise<boolean> {
    const like = await db('user_library')
      .where({ 
        user_id: userId, 
        item_type: 'album', 
        item_id: albumId 
      })
      .first();
    return !!like;
  }

  // Like/save album
  static async like(userId: string, albumId: string): Promise<void> {
    const likeData = {
      id: uuidv4(),
      user_id: userId,
      item_type: 'album',
      item_id: albumId,
      saved_at: new Date().toISOString()
    };

    await db('user_library').insert(likeData);
  }

  // Unlike/unsave album
  static async unlike(userId: string, albumId: string): Promise<void> {
    await db('user_library')
      .where({ 
        user_id: userId, 
        item_type: 'album', 
        item_id: albumId 
      })
      .del();
  }

  // Get user's liked/saved albums
  static async getLikedAlbums(
    userId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<AlbumWithDetails[]> {
    const albums = await db('user_library')
      .select([
        'albums.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        'user_library.saved_at'
      ])
      .join('albums', 'user_library.item_id', 'albums.id')
      .leftJoin('artists', 'albums.artist_id', 'artists.id')
      .where('user_library.user_id', userId)
      .where('user_library.item_type', 'album')
      .orderBy('user_library.saved_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Get duration and play count for each album
    const albumIds = albums.map(a => a.id);
    const trackStats = await db('tracks')
      .select([
        'album_id',
        db.raw('SUM(duration) as total_duration'),
        db.raw('SUM(play_count) as play_count')
      ])
      .whereIn('album_id', albumIds)
      .groupBy('album_id');

    const statsMap = new Map(trackStats.map(s => [s.album_id, s]));

    return albums.map(album => {
      const stats = statsMap.get(album.id);
      return {
        ...album,
        total_duration: parseInt(stats?.total_duration as string) || 0,
        play_count: parseInt(stats?.play_count as string) || 0
      };
    });
  }

  // Get album by title and artist (for duplicate checking)
  static async findByTitleAndArtist(title: string, artistId: string): Promise<Album | null> {
    const album = await db('albums')
      .where({ title, artist_id: artistId })
      .first();
    return album || null;
  }
} 