import { Asset } from '@/lib/index';

const API_URL = 'http://127.0.0.1:8000';

export async function getAssetsFromDatabase(): Promise<Asset[]> {
  const response = await fetch(`${API_URL}/assets`);

  if (!response.ok) {
    console.error('Failed to fetch assets - response not ok');
    return [];
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return [];
  }

  // 🔥 أهم حماية عندك (حل المشكلة نهائيًا)
  const assets = Array.isArray(data?.assets)
    ? data.assets
    : Array.isArray(data)
    ? data
    : [];

  return assets.map((asset: any) => ({
  id: Number(asset.id),
  userId: Number(asset.user_id),

  title: asset.name ?? asset.title ?? 'Untitled Asset',

    description: asset.description ?? '',

    category: (asset.category ?? 'Uncategorized').trim(),

    type: asset.file_type || 'Asset',

    price: Number(asset.price) || 0,

    modelUrl:
      asset.preview_url ||
      asset.thumbnail_url ||
      '',

    modelType: 'glb',

    fileSize: asset.file_size
      ? `${asset.file_size} Bytes`
      : '0 Bytes',

    format:
      asset.file_type?.toUpperCase() || 'GLB',

    thumbnailUrl:
      asset.preview_url ||
      asset.thumbnail_url ||
      '',

    tags: [] as string[],

    uploader:
      asset.source_type === 'admin'
        ? 'Admin'
        : `User ${asset.user_id ?? ''}`,

    uploadDate:
      asset.created_at ||
      new Date().toISOString(),

    status:
      asset.status || 'approved',

    sourceType:
      asset.source_type || 'user_upload',
  }));
}