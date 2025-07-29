import db from '../config/database';

export interface SearchResult {
  type: 'track' | 'artist' | 'album' | 'playlist';
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  additional_info?: any;
  relevance_score?: number;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  results: {
    tracks: SearchResult[];
    artists: SearchResult[];
    albums: SearchResult[];
    playlists: SearchResult[];
  };
  pagination: {
    limit: number;
    offset: number;
  };
}

export interface SearchFilters {
  type?: 'track' | 'artist' | 'album' | 'playlist' | 'all';
  limit?: number;
  offset?: number;
}

export class SearchModel {
  // Universal search across all entities
  static async search(query: string, filters: SearchFilters = {}): Promise<SearchResponse> {
    const {
      type = 'all',
      limit = 20,
      offset = 0
    } = filters;

    const searchTerm = `%${query}%`;
    const results = {
      tracks: [] as SearchResult[],
      artists: [] as SearchResult[],
      albums: [] as SearchResult[],
      playlists: [] as SearchResult[]
    };

    // Search tracks
    if (type === 'all' || type === 'track') {
      const tracks = await db('tracks')
        .select([
          'tracks.id',
          'tracks.title',
          'tracks.image_url',
          'tracks.play_count',
          'tracks.duration',
          'artists.name as artist_name',
          'artists.image_url as artist_image_url',
          'albums.title as album_title',
          'albums.cover_image_url as album_cover'
        ])
        .leftJoin('artists', 'tracks.artist_id', 'artists.id')
        .leftJoin('albums', 'tracks.album_id', 'albums.id')
        .where('tracks.title', 'like', searchTerm)
        .orWhere('artists.name', 'like', searchTerm)
        .orderBy('tracks.play_count', 'desc')
        .limit(limit)
        .offset(offset);

      results.tracks = tracks.map(track => ({
        type: 'track' as const,
        id: track.id,
        title: track.title,
        subtitle: track.artist_name,
        image_url: track.image_url || track.album_cover || track.artist_image_url,
        additional_info: {
          artist_name: track.artist_name,
          album_title: track.album_title,
          duration: track.duration,
          play_count: track.play_count
        },
        relevance_score: this.calculateRelevanceScore(query, track.title, track.artist_name)
      }));
    }

    // Search artists
    if (type === 'all' || type === 'artist') {
      const artists = await db('artists')
        .select([
          'artists.*',
          db.raw('COUNT(user_follows.id) as followers_count')
        ])
        .leftJoin('user_follows', 'artists.id', 'user_follows.artist_id')
        .where('artists.name', 'like', searchTerm)
        .groupBy('artists.id')
        .orderBy('followers_count', 'desc')
        .orderBy('artists.monthly_listeners', 'desc')
        .limit(limit)
        .offset(offset);

      results.artists = artists.map(artist => ({
        type: 'artist' as const,
        id: artist.id,
        title: artist.name,
        subtitle: `${artist.monthly_listeners.toLocaleString()} monthly listeners`,
        image_url: artist.image_url,
        additional_info: {
          bio: artist.bio,
          monthly_listeners: artist.monthly_listeners,
          is_verified: artist.is_verified,
          followers_count: parseInt(artist.followers_count) || 0
        },
        relevance_score: this.calculateRelevanceScore(query, artist.name)
      }));
    }

    // Search albums
    if (type === 'all' || type === 'album') {
      const albums = await db('albums')
        .select([
          'albums.*',
          'artists.name as artist_name',
          'artists.image_url as artist_image_url',
          db.raw('SUM(tracks.play_count) as total_plays')
        ])
        .leftJoin('artists', 'albums.artist_id', 'artists.id')
        .leftJoin('tracks', 'albums.id', 'tracks.album_id')
        .where('albums.title', 'like', searchTerm)
        .orWhere('artists.name', 'like', searchTerm)
        .groupBy('albums.id')
        .orderBy('total_plays', 'desc')
        .orderBy('albums.release_date', 'desc')
        .limit(limit)
        .offset(offset);

      results.albums = albums.map(album => ({
        type: 'album' as const,
        id: album.id,
        title: album.title,
        subtitle: `${album.artist_name} • ${new Date(album.release_date).getFullYear()}`,
        image_url: album.cover_image_url || album.artist_image_url,
        additional_info: {
          artist_name: album.artist_name,
          release_date: album.release_date,
          total_tracks: album.total_tracks,
          total_plays: parseInt(album.total_plays) || 0
        },
        relevance_score: this.calculateRelevanceScore(query, album.title, album.artist_name)
      }));
    }

    // Search playlists (only public playlists)
    if (type === 'all' || type === 'playlist') {
      const playlists = await db('playlists')
        .select([
          'playlists.*',
          'users.username as creator_username',
          'users.display_name as creator_name',
          db.raw('COUNT(playlist_tracks.id) as track_count'),
          db.raw('COUNT(user_library.id) as followers_count')
        ])
        .leftJoin('users', 'playlists.user_id', 'users.id')
        .leftJoin('playlist_tracks', 'playlists.id', 'playlist_tracks.playlist_id')
        .leftJoin('user_library', function() {
          this.on('playlists.id', '=', 'user_library.item_id')
              .andOn('user_library.item_type', '=', db.raw('?', ['playlist']));
        })
        .where('playlists.is_public', true)
        .where('playlists.name', 'like', searchTerm)
        .groupBy('playlists.id')
        .orderBy('followers_count', 'desc')
        .orderBy('playlists.updated_at', 'desc')
        .limit(limit)
        .offset(offset);

      results.playlists = playlists.map(playlist => ({
        type: 'playlist' as const,
        id: playlist.id,
        title: playlist.name,
        subtitle: `By ${playlist.creator_name || playlist.creator_username} • ${playlist.track_count || 0} songs`,
        image_url: playlist.image_url,
        additional_info: {
          description: playlist.description,
          creator_username: playlist.creator_username,
          creator_name: playlist.creator_name,
          track_count: parseInt(playlist.track_count) || 0,
          followers_count: parseInt(playlist.followers_count) || 0,
          is_public: playlist.is_public
        },
        relevance_score: this.calculateRelevanceScore(query, playlist.name, playlist.description)
      }));
    }

    // Sort by relevance if searching all types
    if (type === 'all') {
      Object.keys(results).forEach(key => {
        results[key as keyof typeof results] = results[key as keyof typeof results]
          .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
      });
    }

    const totalResults = results.tracks.length + results.artists.length + 
                        results.albums.length + results.playlists.length;

    return {
      query,
      total_results: totalResults,
      results,
      pagination: {
        limit,
        offset
      }
    };
  }

  // Quick search for autocomplete (top results only)
  static async quickSearch(query: string, limit: number = 5): Promise<SearchResult[]> {
    const searchTerm = `%${query}%`;
    const allResults: SearchResult[] = [];

    // Get top tracks
    const tracks = await db('tracks')
      .select([
        'tracks.id',
        'tracks.title',
        'tracks.image_url',
        'artists.name as artist_name',
        'albums.cover_image_url as album_cover'
      ])
      .leftJoin('artists', 'tracks.artist_id', 'artists.id')
      .leftJoin('albums', 'tracks.album_id', 'albums.id')
      .where('tracks.title', 'like', searchTerm)
      .orWhere('artists.name', 'like', searchTerm)
      .orderBy('tracks.play_count', 'desc')
      .limit(Math.ceil(limit / 2));

    tracks.forEach(track => {
      allResults.push({
        type: 'track',
        id: track.id,
        title: track.title,
        subtitle: track.artist_name,
        image_url: track.image_url || track.album_cover,
        relevance_score: this.calculateRelevanceScore(query, track.title, track.artist_name)
      });
    });

    // Get top artists
    const artists = await db('artists')
      .select(['id', 'name', 'image_url'])
      .where('name', 'like', searchTerm)
      .orderBy('monthly_listeners', 'desc')
      .limit(Math.ceil(limit / 4));

    artists.forEach(artist => {
      allResults.push({
        type: 'artist',
        id: artist.id,
        title: artist.name,
        subtitle: 'Artist',
        image_url: artist.image_url,
        relevance_score: this.calculateRelevanceScore(query, artist.name)
      });
    });

    // Get top albums
    const albums = await db('albums')
      .select([
        'albums.id',
        'albums.title',
        'albums.cover_image_url',
        'artists.name as artist_name'
      ])
      .leftJoin('artists', 'albums.artist_id', 'artists.id')
      .where('albums.title', 'like', searchTerm)
      .orderBy('albums.release_date', 'desc')
      .limit(Math.ceil(limit / 4));

    albums.forEach(album => {
      allResults.push({
        type: 'album',
        id: album.id,
        title: album.title,
        subtitle: album.artist_name,
        image_url: album.cover_image_url,
        relevance_score: this.calculateRelevanceScore(query, album.title, album.artist_name)
      });
    });

    // Sort by relevance and return top results
    return allResults
      .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
      .slice(0, limit);
  }

  // Search by category with filters
  static async searchByCategory(
    query: string, 
    category: 'track' | 'artist' | 'album' | 'playlist',
    filters: any = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResult[]> {
    const result = await this.search(query, { type: category, limit, offset });
    return result.results[category + 's' as keyof typeof result.results] || [];
  }

  // Get trending searches (most searched terms)
  static async getTrendingSearches(limit: number = 10): Promise<string[]> {
    // This would require a search_history table in production
    // For now, return some popular terms based on play counts
    const popularTracks = await db('tracks')
      .select('title')
      .orderBy('play_count', 'desc')
      .limit(limit);

    const popularArtists = await db('artists')
      .select('name')
      .orderBy('monthly_listeners', 'desc')
      .limit(limit);

    const trending = [
      ...popularTracks.map(t => t.title),
      ...popularArtists.map(a => a.name)
    ];

    return trending.slice(0, limit);
  }

  // Calculate relevance score for search results
  private static calculateRelevanceScore(query: string, title: string, subtitle?: string): number {
    const queryLower = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const subtitleLower = subtitle?.toLowerCase() || '';

    let score = 0;

    // Exact match gets highest score
    if (titleLower === queryLower) {
      score += 100;
    }
    // Title starts with query
    else if (titleLower.startsWith(queryLower)) {
      score += 80;
    }
    // Title contains query
    else if (titleLower.includes(queryLower)) {
      score += 60;
    }
    // Subtitle contains query
    else if (subtitleLower.includes(queryLower)) {
      score += 40;
    }

    // Bonus for shorter titles (more specific)
    if (title.length < 20) {
      score += 10;
    }

    // Bonus for exact word matches
    const queryWords = queryLower.split(' ');
    const titleWords = titleLower.split(' ');
    
    queryWords.forEach(queryWord => {
      if (titleWords.includes(queryWord)) {
        score += 20;
      }
    });

    return score;
  }

  // Get search suggestions based on partial input
  static async getSuggestions(partialQuery: string, limit: number = 8): Promise<string[]> {
    const searchTerm = `${partialQuery}%`;
    const suggestions: string[] = [];

    // Get track titles
    const tracks = await db('tracks')
      .select('title')
      .where('title', 'like', searchTerm)
      .orderBy('play_count', 'desc')
      .limit(Math.ceil(limit / 2));

    suggestions.push(...tracks.map(t => t.title));

    // Get artist names
    const artists = await db('artists')
      .select('name')
      .where('name', 'like', searchTerm)
      .orderBy('monthly_listeners', 'desc')
      .limit(Math.ceil(limit / 2));

    suggestions.push(...artists.map(a => a.name));

    return [...new Set(suggestions)].slice(0, limit);
  }
} 