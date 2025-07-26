import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Spotify Clone API',
    version: '1.0.0',
    description: 'A comprehensive music streaming API with authentication, search, player controls, and file uploads',
    contact: {
      name: 'API Support',
      email: 'support@spotify-clone.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://api.spotify-clone.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from login endpoint'
      }
    },
    schemas: {
      // User schemas
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          display_name: { type: 'string' },
          avatar_url: { type: 'string', format: 'uri' },
          bio: { type: 'string' },
          date_of_birth: { type: 'string', format: 'date' },
          country: { type: 'string' },
          is_verified: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      
      // Artist schemas
      Artist: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          bio: { type: 'string' },
          image_url: { type: 'string', format: 'uri' },
          monthly_listeners: { type: 'integer' },
          is_verified: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      
      // Track schemas
      Track: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          duration: { type: 'integer', description: 'Duration in seconds' },
          track_number: { type: 'integer' },
          audio_url: { type: 'string', format: 'uri' },
          image_url: { type: 'string', format: 'uri' },
          play_count: { type: 'integer' },
          artist_id: { type: 'string', format: 'uuid' },
          album_id: { type: 'string', format: 'uuid' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      
      // Album schemas
      Album: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          cover_image_url: { type: 'string', format: 'uri' },
          release_date: { type: 'string', format: 'date' },
          total_tracks: { type: 'integer' },
          artist_id: { type: 'string', format: 'uuid' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      
      // Playlist schemas
      Playlist: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          cover_image_url: { type: 'string', format: 'uri' },
          is_public: { type: 'boolean' },
          user_id: { type: 'string', format: 'uuid' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      
      // Search result schemas
      SearchResult: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['track', 'artist', 'album', 'playlist'] },
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          subtitle: { type: 'string' },
          image_url: { type: 'string', format: 'uri' },
          additional_info: { type: 'object' },
          relevance_score: { type: 'number' }
        }
      },
      
      // Player schemas
      CurrentPlayback: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          track_id: { type: 'string', format: 'uuid' },
          context_type: { type: 'string', enum: ['album', 'playlist', 'artist', 'search'] },
          context_id: { type: 'string', format: 'uuid' },
          is_playing: { type: 'boolean' },
          position_ms: { type: 'integer' },
          volume_percent: { type: 'integer', minimum: 0, maximum: 100 },
          device_name: { type: 'string' },
          shuffle_state: { type: 'boolean' },
          repeat_state: { type: 'string', enum: ['off', 'track', 'context'] },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      
      // Error schemas
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            }
          }
        }
      },
      
      // Success response schemas
      SuccessResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          data: { type: 'object' }
        }
      },
      
      // Pagination schema
      Pagination: {
        type: 'object',
        properties: {
          limit: { type: 'integer' },
          offset: { type: 'integer' },
          total: { type: 'integer' },
          has_next: { type: 'boolean' },
          has_prev: { type: 'boolean' }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      ValidationError: {
        description: 'Invalid input data',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      RateLimitError: {
        description: 'Too many requests',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and profile management'
    },
    {
      name: 'Artists',
      description: 'Artist management and discovery'
    },
    {
      name: 'Tracks',
      description: 'Track management and playback'
    },
    {
      name: 'Albums',
      description: 'Album management and browsing'
    },
    {
      name: 'Playlists',
      description: 'Playlist creation and management'
    },
    {
      name: 'Search',
      description: 'Universal search across all content'
    },
    {
      name: 'Player',
      description: 'Playback controls and queue management'
    },
    {
      name: 'Upload',
      description: 'File upload and media management'
    }
  ]
};

const options: swaggerJSDoc.Options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts', // paths to files containing OpenAPI definitions
    './src/controllers/*.ts',
    './src/models/*.ts'
  ]
};

const specs = swaggerJSDoc(options);

// Custom CSS for Swagger UI
const customCss = `
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info .title { color: #1db954; }
  .swagger-ui .scheme-container { display: none; }
  .swagger-ui .btn.authorize { 
    background-color: #1db954; 
    border-color: #1db954; 
  }
  .swagger-ui .btn.authorize:hover { 
    background-color: #1ed760; 
    border-color: #1ed760; 
  }
`;

const swaggerOptions = {
  customCss,
  customSiteTitle: 'Spotify Clone API Documentation',
  customfavIcon: '/favicon.ico'
};

export { specs, swaggerUi, swaggerOptions };

export default {
  specs,
  swaggerUi,
  swaggerOptions
}; 