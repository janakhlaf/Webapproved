import { Asset } from '@/lib/index';

export async function getAssetsFromDatabase(): Promise<Asset[]> {
  const res = await fetch('http://localhost:8000/assets');

  if (!res.ok) {
    throw new Error('Failed to fetch assets');
  }

  const data = await res.json();

  return data.assets.map((asset: any) => ({
    id: String(asset.id),
    title: asset.title,
    description: asset.description,
    category: asset.category,
    type: asset.file_type || 'Asset',
    price: Number(asset.price),

    modelUrl: asset.preview_url,
    modelType: 'glb',

    fileSize: asset.file_size ? `${asset.file_size} MB` : '',
    format: asset.file_type?.toUpperCase() || 'GLB',
    thumbnailUrl: asset.preview_url,
    tags: [] as string[],
  }));
}