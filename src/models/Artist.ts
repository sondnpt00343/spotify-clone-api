import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  image_url?: string;
  background_image_url?: string;
  monthly_listeners: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateArtistData {
  name: string;
  bio?: string;
  image_url?: string;
  background_image_url?: string;
  monthly_listeners?: number;
  is_verified?: boolean;
}

export interface UpdateArtistData {
  name?: string;
  bio?: string;
  image_url?: string;
  background_image_url?: string;
  monthly_listeners?: number;
  is_verified?: boolean;
}

export interface ArtistWithStats extends Artist {
  total_tracks: number;
  total_albums: number;
  total_followers: number;
}

export class ArtistModel {
  // Helper function to ensure proper boolean casting
  private static castArtistBooleans(artist: any): any {
    if (!artist) return artist;
    return {
      ...artist,
      is_verified: Boolean(artist.is_verified)
    };
  }

  // Helper function to cast array of artists
  private static castArtistArrayBooleans(artists: any[]): any[] {
    return artists.map(artist => this.castArtistBooleans(artist));
  }

  // Find artist by ID
  static async findById(id: string): Promise<Artist | null> {
    const artist = await db('artists').where({ id }).first();
    return artist ? this.castArtistBooleans(artist) : null;
  }

  // Find artist by name (for search)
  static async findByName(name: string): Promise<Artist | null> {
    const artist = await db('artists').where({ name }).first();
    return artist ? this.castArtistBooleans(artist) : null;
  }

  // Get all artists with pagination
  static async getAll(limit: number = 20, offset: number = 0): Promise<Artist[]> {
    const artists = await db('artists')
      .orderBy('monthly_listeners', 'desc')
      .limit(limit)
      .offset(offset);
    return this.castArtistArrayBooleans(artists);
  }

  // Search artists by name
  static async search(query: string, limit: number = 20, offset: number = 0): Promise<Artist[]> {
    const artists = await db('artists')
      .where('name', 'like', `%${query}%`)
      .orderBy('monthly_listeners', 'desc')
      .limit(limit)
      .offset(offset);
    return this.castArtistArrayBooleans(artists);
  }

  // Get artist with detailed stats
  static async getWithStats(id: string): Promise<ArtistWithStats | null> {
    const artist = await this.findById(id);
    if (!artist) return null;

    const [trackCount, albumCount, followerCount] = await Promise.all([
      db('tracks').where({ artist_id: id }).count('* as count').first(),
      db('albums').where({ artist_id: id }).count('* as count').first(),
      db('user_follows').where({ artist_id: id }).count('* as count').first()
    ]);

    return this.castArtistBooleans({
      ...artist,
      total_tracks: parseInt(trackCount?.count as string) || 0,
      total_albums: parseInt(albumCount?.count as string) || 0,
      total_followers: parseInt(followerCount?.count as string) || 0
    });
  }

  // Get artist's popular tracks
  static async getPopularTracks(artistId: string, limit: number = 10, offset: number = 0) {
    return db('tracks')
      .select([
        'tracks.*',
        'albums.title as album_title',
        'albums.cover_image_url as album_cover'
      ])
      .leftJoin('albums', 'tracks.album_id', 'albums.id')
      .where('tracks.artist_id', artistId)
      .orderBy('tracks.play_count', 'desc')
      .limit(limit)
      .offset(offset);
  }

  // Get artist's albums
  static async getAlbums(artistId: string, limit: number = 10, offset: number = 0) {
    return db('albums')
      .where({ artist_id: artistId })
      .orderBy('release_date', 'desc')
      .limit(limit)
      .offset(offset);
  }

  // Create new artist (admin only)
  static async create(artistData: CreateArtistData): Promise<Artist> {
    const id = uuidv4();
    
    const newArtist = {
      id,
      name: artistData.name,
      bio: artistData.bio || null,
      image_url: artistData.image_url || null,
      background_image_url: artistData.background_image_url || null,
      monthly_listeners: artistData.monthly_listeners || 0,
      is_verified: artistData.is_verified || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db('artists').insert(newArtist);
    return this.castArtistBooleans(newArtist) as Artist;
  }

  // Update artist (admin only)
  static async update(id: string, artistData: UpdateArtistData): Promise<Artist | null> {
    const updateData = {
      ...artistData,
      updated_at: new Date().toISOString()
    };

    await db('artists').where({ id }).update(updateData);
    return this.findById(id);
  }

  // Delete artist (admin only)
  static async delete(id: string): Promise<void> {
    await db('artists').where({ id }).del();
  }

  // Check if user is following artist
  static async isFollowing(userId: string, artistId: string): Promise<boolean> {
    const follow = await db('user_follows')
      .where({ user_id: userId, artist_id: artistId })
      .first();
    return !!follow;
  }

  // Follow artist
  static async follow(userId: string, artistId: string): Promise<void> {
    const followData = {
      id: uuidv4(),
      user_id: userId,
      artist_id: artistId,
      followed_at: new Date().toISOString()
    };

    await db('user_follows').insert(followData);
  }

  // Unfollow artist
  static async unfollow(userId: string, artistId: string): Promise<void> {
    await db('user_follows')
      .where({ user_id: userId, artist_id: artistId })
      .del();
  }

  // Get trending artists (most followers gained recently)
  static async getTrending(limit: number = 10): Promise<Artist[]> {
    const artists = await db('artists')
      .select('artists.*', db.raw('COUNT(user_follows.id) as follower_count'))
      .join('user_follows', 'artists.id', 'user_follows.artist_id')
      .where('user_follows.followed_at', '>', db.raw("datetime('now', '-30 days')"))
      .groupBy('artists.id')
      .orderBy('follower_count', 'desc')
      .limit(limit);
    return this.castArtistArrayBooleans(artists);
  }

  // Update monthly listeners (scheduled job would call this)
  static async updateMonthlyListeners(artistId: string): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db('play_history')
      .join('tracks', 'play_history.track_id', 'tracks.id')
      .where('tracks.artist_id', artistId)
      .where('play_history.played_at', '>', thirtyDaysAgo.toISOString())
      .countDistinct('play_history.user_id as unique_listeners')
      .first();

    const monthlyListeners = parseInt(result?.unique_listeners as string) || 0;

    await db('artists')
      .where({ id: artistId })
      .update({ 
        monthly_listeners: monthlyListeners,
        updated_at: new Date().toISOString()
      });
  }

  // Get user's followed artists
  static async getFollowedArtists(
    userId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<(Artist & { followed_at: string })[]> {
    const followedArtists = await db('user_follows')
      .select([
        'artists.*',
        'user_follows.followed_at'
      ])
      .join('artists', 'user_follows.artist_id', 'artists.id')
      .where('user_follows.user_id', userId)
      .orderBy('user_follows.followed_at', 'desc')
      .limit(limit)
      .offset(offset);

    return this.castArtistArrayBooleans(followedArtists);
  }
} 