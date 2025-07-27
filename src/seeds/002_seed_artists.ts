import knex from 'knex';
import { v4 as uuidv4 } from 'uuid';

const artistsData = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Đen',
    bio: 'Đen (tên thật: Nguyễn Đức Cường, sinh năm 1989) là một rapper, nhạc sĩ người Việt Nam. Anh được biết đến với phong cách rap độc đáo và những ca khúc mang đậm tính nhân văn.',
    image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=DEN',
    background_image_url: 'https://via.placeholder.com/1200x400/1db954/ffffff?text=DEN+BACKGROUND',
    monthly_listeners: 1021833,
    is_verified: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Trúc Nhân',
    bio: 'Trúc Nhân là một ca sĩ, nhạc sĩ người Việt Nam. Anh được biết đến với giọng hát đặc trưng và những ca khúc ballad sâu lắng.',
    image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=TN',
    background_image_url: 'https://via.placeholder.com/1200x400/1db954/ffffff?text=TRUC+NHAN',
    monthly_listeners: 850241,
    is_verified: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Thùy Chi',
    bio: 'Thùy Chi là một ca sĩ nữ người Việt Nam với giọng hát ngọt ngào và phong cách âm nhạc đa dạng.',
    image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=TC',
    background_image_url: 'https://via.placeholder.com/1200x400/1db954/ffffff?text=THUY+CHI',
    monthly_listeners: 645789,
    is_verified: true
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Noo Phước Thịnh',
    bio: 'Noo Phước Thịnh là một ca sĩ người Việt Nam nổi tiếng với những ca khúc pop và ballad.',
    image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=NPT',
    background_image_url: 'https://via.placeholder.com/1200x400/1db954/ffffff?text=NOO+PHUOC+THINH',
    monthly_listeners: 923456,
    is_verified: true
  }
];

export async function seed(knex: any): Promise<void> {
  // Deletes ALL existing entries
  await knex('artists').del();

  // Insert seed entries
  await knex('artists').insert(artistsData);
} 