import { Film } from '@/lib/index';

export async function getFilmsFromDatabase(): Promise<Film[]> {
  const res = await fetch('http://localhost:8000/films');

  if (!res.ok) {
    throw new Error('Failed to fetch films');
  }

  const data = await res.json();

  return data.films.map((film: any) => ({
    id: String(film.id),
    userId: film.user_id ? String(film.user_id) : undefined,

    title: film.title || '',
    description: film.description || '',
    category: film.category || '',

    // برا / الكارد
    posterUrl: film.thumbnail_basic || film.thumbnail_url || '',

    // جوا / المودال
    detailPosterUrl: film.thumbnail_url || film.thumbnail_basic || '',

    videoUrl: film.bucket_path || '',
    downloadUrl: film.bucket_path || '',

    price: Number(film.price || 0),
    fileSize: film.file_size || '',
    mimeType: film.mime_type || '',
    sourceType: film.source_type || '',
    status: film.status || '',
    rejectionReason: film.rejection_reason || '',

    downloadable: true,
    duration: film.duration ? `${film.duration} min` : '',
    releaseYear: 2024,
    director: 'Unknown',
    tags: [] as string[],
  }));
}