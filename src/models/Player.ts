import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';

export interface CurrentPlayback {
  id: string;
  user_id: string;
  track_id: string;
  context_type?: 'album' | 'playlist' | 'artist' | 'search';
  context_id?: string;
  is_playing: boolean;
  position_ms: number;
  volume_percent: number;
  device_name?: string;
  shuffle_state: boolean;
  repeat_state: 'off' | 'track' | 'context';
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface CurrentPlaybackWithDetails extends CurrentPlayback {
  track: {
    id: string;
    title: string;
    duration: number;
    audio_url: string;
    image_url?: string;
    artist_id: string;
    artist_name: string;
    artist_image_url?: string;
    album_id?: string;
    album_title?: string;
    album_cover_image_url?: string;
  };
  context?: {
    name: string;
    image_url?: string;
    total_tracks?: number;
  };
}

export interface QueueItem {
  id: string;
  user_id: string;
  track_id: string;
  position: number;
  added_at: string;
  added_by?: string;
  context_type?: string;
  context_id?: string;
}

export interface QueueItemWithTrack extends QueueItem {
  track: {
    id: string;
    title: string;
    duration: number;
    audio_url: string;
    image_url?: string;
    artist_name: string;
    album_title?: string;
    album_cover_image_url?: string;
  };
}

export interface PlaybackControls {
  action: 'play' | 'pause' | 'next' | 'previous' | 'seek' | 'volume' | 'shuffle' | 'repeat';
  position_ms?: number;
  volume_percent?: number;
  shuffle_state?: boolean;
  repeat_state?: 'off' | 'track' | 'context';
}

export class PlayerModel {
  // Get current playback state for user
  static async getCurrentPlayback(userId: string): Promise<CurrentPlaybackWithDetails | null> {
    const playback = await db('current_playback')
      .where({ user_id: userId })
      .first();

    if (!playback) return null;

    // Get track details
    const trackDetails = await db('tracks')
      .select([
        'tracks.*',
        'artists.name as artist_name',
        'artists.image_url as artist_image_url',
        'albums.title as album_title',
        'albums.cover_image_url as album_cover_image_url'
      ])
      .leftJoin('artists', 'tracks.artist_id', 'artists.id')
      .leftJoin('albums', 'tracks.album_id', 'albums.id')
      .where('tracks.id', playback.track_id)
      .first();

    if (!trackDetails) return null;

    // Get context details if available
    let context = undefined;
    if (playback.context_type && playback.context_id) {
      switch (playback.context_type) {
        case 'album':
          const album = await db('albums').where({ id: playback.context_id }).first();
          if (album) {
            context = {
              name: album.title,
              image_url: album.cover_image_url,
              total_tracks: album.total_tracks
            };
          }
          break;
        case 'playlist':
          const playlist = await db('playlists').where({ id: playback.context_id }).first();
          if (playlist) {
            const trackCount = await db('playlist_tracks')
              .where({ playlist_id: playback.context_id })
              .count('* as count')
              .first();
            context = {
              name: playlist.name,
              image_url: playlist.image_url,
              total_tracks: parseInt(trackCount?.count as string) || 0
            };
          }
          break;
        case 'artist':
          const artist = await db('artists').where({ id: playback.context_id }).first();
          if (artist) {
            context = {
              name: artist.name,
              image_url: artist.image_url
            };
          }
          break;
      }
    }

    return {
      ...playback,
      track: {
        id: trackDetails.id,
        title: trackDetails.title,
        duration: trackDetails.duration,
        audio_url: trackDetails.audio_url,
        image_url: trackDetails.image_url,
        artist_id: trackDetails.artist_id,
        artist_name: trackDetails.artist_name,
        artist_image_url: trackDetails.artist_image_url,
        album_id: trackDetails.album_id,
        album_title: trackDetails.album_title,
        album_cover_image_url: trackDetails.album_cover_image_url
      },
      context
    };
  }

  // Update current playback state
  static async updatePlayback(
    userId: string, 
    trackId: string, 
    options: {
      context_type?: 'album' | 'playlist' | 'artist' | 'search';
      context_id?: string;
      is_playing?: boolean;
      position_ms?: number;
      volume_percent?: number;
      device_name?: string;
      shuffle_state?: boolean;
      repeat_state?: 'off' | 'track' | 'context';
    } = {}
  ): Promise<CurrentPlayback> {
    const now = new Date().toISOString();
    
    // Check if user already has current playback
    const existing = await db('current_playback').where({ user_id: userId }).first();
    
    const playbackData = {
      user_id: userId,
      track_id: trackId,
      context_type: options.context_type || null,
      context_id: options.context_id || null,
      is_playing: options.is_playing ?? true,
      position_ms: options.position_ms || 0,
      volume_percent: options.volume_percent ?? 80,
      device_name: options.device_name || 'Web Player',
      shuffle_state: options.shuffle_state ?? false,
      repeat_state: options.repeat_state || 'off',
      timestamp: now,
      updated_at: now
    };

    if (existing) {
      // Update existing playback
      await db('current_playback')
        .where({ user_id: userId })
        .update(playbackData);
      
      return { ...existing, ...playbackData };
    } else {
      // Create new playback
      const newPlayback = {
        id: uuidv4(),
        ...playbackData,
        created_at: now
      };

      await db('current_playback').insert(newPlayback);
      return newPlayback as CurrentPlayback;
    }
  }

  // Play controls (play, pause, next, previous, seek)
  static async playbackControl(userId: string, controls: PlaybackControls): Promise<CurrentPlaybackWithDetails | null> {
    const currentPlayback = await this.getCurrentPlayback(userId);
    if (!currentPlayback) {
      throw new Error('No active playback session');
    }

    const updates: any = {
      timestamp: new Date().toISOString()
    };

    switch (controls.action) {
      case 'play':
        updates.is_playing = true;
        break;
      case 'pause':
        updates.is_playing = false;
        break;
      case 'seek':
        if (controls.position_ms !== undefined) {
          updates.position_ms = Math.max(0, Math.min(controls.position_ms, currentPlayback.track.duration * 1000));
        }
        break;
      case 'volume':
        if (controls.volume_percent !== undefined) {
          updates.volume_percent = Math.max(0, Math.min(100, controls.volume_percent));
        }
        break;
      case 'shuffle':
        if (controls.shuffle_state !== undefined) {
          updates.shuffle_state = controls.shuffle_state;
        }
        break;
      case 'repeat':
        if (controls.repeat_state) {
          updates.repeat_state = controls.repeat_state;
        }
        break;
      case 'next':
        const nextTrack = await this.getNextTrack(userId);
        if (nextTrack) {
          return this.updatePlayback(userId, nextTrack.id, {
            context_type: currentPlayback.context_type,
            context_id: currentPlayback.context_id,
            is_playing: true,
            position_ms: 0,
            volume_percent: currentPlayback.volume_percent,
            shuffle_state: currentPlayback.shuffle_state,
            repeat_state: currentPlayback.repeat_state
          }).then(() => this.getCurrentPlayback(userId));
        }
        break;
      case 'previous':
        const prevTrack = await this.getPreviousTrack(userId);
        if (prevTrack) {
          return this.updatePlayback(userId, prevTrack.id, {
            context_type: currentPlayback.context_type,
            context_id: currentPlayback.context_id,
            is_playing: true,
            position_ms: 0,
            volume_percent: currentPlayback.volume_percent,
            shuffle_state: currentPlayback.shuffle_state,
            repeat_state: currentPlayback.repeat_state
          }).then(() => this.getCurrentPlayback(userId));
        }
        break;
    }

    // Update playback state
    await db('current_playback')
      .where({ user_id: userId })
      .update(updates);

    return this.getCurrentPlayback(userId);
  }

  // Get next track based on context and shuffle/repeat settings
  static async getNextTrack(userId: string): Promise<{ id: string } | null> {
    const currentPlayback = await db('current_playback').where({ user_id: userId }).first();
    if (!currentPlayback) return null;

    // Check repeat track
    if (currentPlayback.repeat_state === 'track') {
      return { id: currentPlayback.track_id };
    }

    // Check queue first
    const queueNext = await db('user_queue')
      .where({ user_id: userId })
      .orderBy('position', 'asc')
      .first();
    
    if (queueNext) {
      // Remove from queue after getting
      await db('user_queue').where({ id: queueNext.id }).del();
      return { id: queueNext.track_id };
    }

    // Get next from context
    if (currentPlayback.context_type && currentPlayback.context_id) {
      return this.getNextTrackFromContext(
        currentPlayback.track_id,
        currentPlayback.context_type,
        currentPlayback.context_id,
        currentPlayback.shuffle_state,
        currentPlayback.repeat_state === 'context'
      );
    }

    return null;
  }

  // Get previous track based on context
  static async getPreviousTrack(userId: string): Promise<{ id: string } | null> {
    const currentPlayback = await db('current_playback').where({ user_id: userId }).first();
    if (!currentPlayback) return null;

    if (currentPlayback.context_type && currentPlayback.context_id) {
      return this.getPreviousTrackFromContext(
        currentPlayback.track_id,
        currentPlayback.context_type,
        currentPlayback.context_id
      );
    }

    return null;
  }

  // Get next track from specific context (album, playlist, etc.)
  private static async getNextTrackFromContext(
    currentTrackId: string,
    contextType: string,
    contextId: string,
    shuffle: boolean,
    repeat: boolean
  ): Promise<{ id: string } | null> {
    let tracks: any[] = [];

    if (contextType === 'album') {
      tracks = await db('tracks')
        .where({ album_id: contextId })
        .orderBy('track_number', 'asc');
    } else if (contextType === 'playlist') {
      tracks = await db('playlist_tracks')
        .select('track_id as id', 'position')
        .where({ playlist_id: contextId })
        .orderBy('position', 'asc');
    }

    if (tracks.length === 0) return null;

    if (shuffle) {
      // Get random track (excluding current)
      const availableTracks = tracks.filter(t => t.id !== currentTrackId);
      if (availableTracks.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * availableTracks.length);
      return { id: availableTracks[randomIndex].id };
    } else {
      // Get next track in sequence
      const currentIndex = tracks.findIndex(t => t.id === currentTrackId);
      if (currentIndex === -1) return null;
      
      const nextIndex = currentIndex + 1;
      if (nextIndex < tracks.length) {
        return { id: tracks[nextIndex].id };
      } else if (repeat) {
        // Repeat context - go to first track
        return { id: tracks[0].id };
      }
    }

    return null;
  }

  // Get previous track from context
  private static async getPreviousTrackFromContext(
    currentTrackId: string,
    contextType: string,
    contextId: string
  ): Promise<{ id: string } | null> {
    let tracks: any[] = [];

    if (contextType === 'album') {
      tracks = await db('tracks')
        .where({ album_id: contextId })
        .orderBy('track_number', 'asc');
    } else if (contextType === 'playlist') {
      tracks = await db('playlist_tracks')
        .select('track_id as id', 'position')
        .where({ playlist_id: contextId })
        .orderBy('position', 'asc');
    }

    if (tracks.length === 0) return null;

    const currentIndex = tracks.findIndex(t => t.id === currentTrackId);
    if (currentIndex === -1) return null;
    
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      return { id: tracks[prevIndex].id };
    }

    return null;
  }

  // Add track to user's queue
  static async addToQueue(userId: string, trackId: string, context?: { type: string; id: string }): Promise<QueueItem> {
    // Get current queue position
    const maxPosition = await db('user_queue')
      .where({ user_id: userId })
      .max('position as max_pos')
      .first();

    const queueItem = {
      id: uuidv4(),
      user_id: userId,
      track_id: trackId,
      position: (maxPosition?.max_pos as number || 0) + 1,
      added_at: new Date().toISOString(),
      context_type: context?.type || null,
      context_id: context?.id || null
    };

    await db('user_queue').insert(queueItem);
    return queueItem as QueueItem;
  }

  // Get user's queue
  static async getQueue(userId: string, limit: number = 20): Promise<QueueItemWithTrack[]> {
    return db('user_queue')
      .select([
        'user_queue.*',
        'tracks.title',
        'tracks.duration',
        'tracks.audio_url',
        'tracks.image_url',
        'artists.name as artist_name',
        'albums.title as album_title',
        'albums.cover_image_url as album_cover_image_url'
      ])
      .join('tracks', 'user_queue.track_id', 'tracks.id')
      .leftJoin('artists', 'tracks.artist_id', 'artists.id')
      .leftJoin('albums', 'tracks.album_id', 'albums.id')
      .where('user_queue.user_id', userId)
      .orderBy('user_queue.position', 'asc')
      .limit(limit)
      .then(results => 
        results.map(row => ({
          id: row.id,
          user_id: row.user_id,
          track_id: row.track_id,
          position: row.position,
          added_at: row.added_at,
          context_type: row.context_type,
          context_id: row.context_id,
          track: {
            id: row.track_id,
            title: row.title,
            duration: row.duration,
            audio_url: row.audio_url,
            image_url: row.image_url,
            artist_name: row.artist_name,
            album_title: row.album_title,
            album_cover_image_url: row.album_cover_image_url
          }
        }))
      );
  }

  // Clear user's queue
  static async clearQueue(userId: string): Promise<void> {
    await db('user_queue').where({ user_id: userId }).del();
  }

  // Remove specific item from queue
  static async removeFromQueue(userId: string, queueItemId: string): Promise<void> {
    await db('user_queue')
      .where({ id: queueItemId, user_id: userId })
      .del();
  }

  // Transfer playback to different device (placeholder for future)
  static async transferPlayback(userId: string, deviceName: string): Promise<CurrentPlayback | null> {
    await db('current_playback')
      .where({ user_id: userId })
      .update({ 
        device_name: deviceName,
        updated_at: new Date().toISOString()
      });

    return db('current_playback').where({ user_id: userId }).first();
  }

  // Stop playback and clear state
  static async stopPlayback(userId: string): Promise<void> {
    await db('current_playback').where({ user_id: userId }).del();
  }
} 