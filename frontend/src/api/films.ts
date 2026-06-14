import { Film } from '@/lib/index';

const API_URL = 'http://localhost:8000';

export async function getFilmsFromDatabase(): Promise<Film[]> {
  const res = await fetch(`${API_URL}/films`);

  if (!res.ok) {
    console.error('Failed to fetch films - response not ok');
    return [];
  }

  let data;

  try {
    data = await res.json();
  } catch (error) {
    console.error('Failed to parse films JSON:', error);
    return [];
  }

  // 🔥 حماية قوية ضد أي شكل بيانات غلط
  const films = Array.isArray(data?.films)
    ? data.films
    : Array.isArray(data)
    ? data
    : [];

  return films.map((film: any) => ({
   id: Number(film.id),
    userId: Number(film.user_id),
    title: film.title ?? '',
    description: film.description ?? '',
    category: film.category ?? '',

    // برا / الكارد
    posterUrl: film.thumbnail_basic || film.thumbnail_url || '',

    // جوا / المودال
    detailPosterUrl: film.thumbnail_url || film.thumbnail_basic || '',

    videoUrl: film.bucket_path ?? '',
    downloadUrl: film.bucket_path ?? '',

    price: Number(film.price) || 0,
    fileSize: film.file_size ?? '',
    mimeType: film.mime_type ?? '',
    sourceType: film.source_type ?? '',
    status: film.status ?? '',
    downloadable: true,
    duration: film.duration ? `${film.duration} min` : '',
    releaseYear: 2024,
    director: 'Unknown',
    tags: [] as string[],
  }));
}