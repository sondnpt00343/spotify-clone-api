import knex from 'knex';

const tracksData = [
  // Đen's tracks
  {
    id: '770e8400-e29b-41d4-a716-446655440001',
    title: 'Cho Tôi Lang Thang',
    duration: 258, // 4:18
    audio_url: 'https://sample-music.netlify.app/death_bed.mp3',
    image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=CHO+TOI+LANG+THANG',
    play_count: 27498341,
    album_id: '660e8400-e29b-41d4-a716-446655440001',
    artist_id: '550e8400-e29b-41d4-a716-446655440001',
    track_number: 1
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440002',
    title: 'Lối Nhỏ',
    duration: 252, // 4:12
    audio_url: 'https://sample-music.netlify.app/death_bed.mp3',
    image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=LOI+NHO',
    play_count: 45686866,
    album_id: '660e8400-e29b-41d4-a716-446655440001',
    artist_id: '550e8400-e29b-41d4-a716-446655440001',
    track_number: 2
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440003',
    title: 'Cho Mình Em',
    duration: 206, // 3:26
    audio_url: 'https://sample-music.netlify.app/death_bed.mp3',
    image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=CHO+MINH+EM',
    play_count: 20039024,
    album_id: '660e8400-e29b-41d4-a716-446655440001',
    artist_id: '550e8400-e29b-41d4-a716-446655440001',
    track_number: 3
  },
  // Trúc Nhân's tracks
  {
    id: '770e8400-e29b-41d4-a716-446655440004',
    title: 'Em Sẽ Là Cô Dâu',
    duration: 285,
    audio_url: 'https://sample-music.netlify.app/death_bed.mp3',
    image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=EM+SE+LA+CO+DAU',
    play_count: 15230789,
    album_id: '660e8400-e29b-41d4-a716-446655440002',
    artist_id: '550e8400-e29b-41d4-a716-446655440002',
    track_number: 1
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440005',
    title: 'Một Nhà',
    duration: 240,
    audio_url: 'https://sample-music.netlify.app/death_bed.mp3',
    image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=MOT+NHA',
    play_count: 12456789,
    album_id: '660e8400-e29b-41d4-a716-446655440002',
    artist_id: '550e8400-e29b-41d4-a716-446655440002',
    track_number: 2
  },
  // Thùy Chi's tracks
  {
    id: '770e8400-e29b-41d4-a716-446655440006',
    title: 'Anh Ơi Ở Lại',
    duration: 267,
    audio_url: 'https://sample-music.netlify.app/death_bed.mp3',
    image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=ANH+OI+O+LAI',
    play_count: 8945632,
    album_id: '660e8400-e29b-41d4-a716-446655440003',
    artist_id: '550e8400-e29b-41d4-a716-446655440003',
    track_number: 1
  },
  // Noo Phước Thịnh's tracks
  {
    id: '770e8400-e29b-41d4-a716-446655440007',
    title: 'Yêu Một Người Sao Buồn Đến Thế',
    duration: 299, // 4:59
    audio_url: 'https://sample-music.netlify.app/death_bed.mp3',
    image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=YEU+MOT+NGUOI',
    play_count: 18756123,
    album_id: '660e8400-e29b-41d4-a716-446655440004',
    artist_id: '550e8400-e29b-41d4-a716-446655440004',
    track_number: 1
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440008',
    title: 'Cause I Love You',
    duration: 225,
    audio_url: 'https://sample-music.netlify.app/death_bed.mp3',
    image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=CAUSE+I+LOVE+YOU',
    play_count: 14567890,
    album_id: '660e8400-e29b-41d4-a716-446655440004',
    artist_id: '550e8400-e29b-41d4-a716-446655440004',
    track_number: 2
  }
];

export async function seed(knex: any): Promise<void> {
  // Deletes ALL existing entries
  await knex('tracks').del();

  // Insert seed entries
  await knex('tracks').insert(tracksData);
} 