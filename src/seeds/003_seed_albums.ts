import knex from 'knex';

const albumsData = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    title: 'Đen & Friends',
    cover_image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=DEN+FRIENDS',
    release_date: '2019-12-15',
    artist_id: '550e8400-e29b-41d4-a716-446655440001' // Đen
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    title: 'Cảm Xúc',
    cover_image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=CAM+XUC',
    release_date: '2020-06-20',
    artist_id: '550e8400-e29b-41d4-a716-446655440002' // Trúc Nhân
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    title: 'Yêu Thương',
    cover_image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=YEU+THUONG',
    release_date: '2021-03-10',
    artist_id: '550e8400-e29b-41d4-a716-446655440003' // Thùy Chi
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440004',
    title: 'Noo Songs',
    cover_image_url: 'https://via.placeholder.com/300x300/1db954/ffffff?text=NOO+SONGS',
    release_date: '2021-08-15',
    artist_id: '550e8400-e29b-41d4-a716-446655440004' // Noo Phước Thịnh
  }
];

export async function seed(knex: any): Promise<void> {
  // Deletes ALL existing entries
  await knex('albums').del();

  // Insert seed entries
  await knex('albums').insert(albumsData);
} 