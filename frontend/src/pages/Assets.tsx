import { useState, useRef } from 'react';
import { Search, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AssetCard } from '@/components/AssetCard';
import { AssetDetailModal } from '@/components/AssetDetailModal';
import { ASSETS_DATA } from '@/data/assets';
import { useAuth } from '@/hooks/useAuth';
import { Asset, ASSET_CATEGORIES, AssetCategory, ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Assets() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const assetFileInputRef = useRef<HTMLInputElement | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('All');
  const [sortOrder, setSortOrder] = useState<'highest' | 'lowest'>('highest');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [uploadFormVisible, setUploadFormVisible] = useState(false);

  const filteredAssets = ASSETS_DATA.filter((asset) => {
    const matchesSearch =
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === 'All' || asset.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    return sortOrder === 'highest' ? b.price - a.price : a.price - b.price;
  });

  const handleUploadClick = () => {
    if (!isAuthenticated) {
      navigate(ROUTE_PATHS.SIGNIN);
    } else {
      setUploadFormVisible(true);
    }
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleAssetFileBoxClick = () => {
    assetFileInputRef.current?.click();
  };

  const handleAssetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Selected asset file:', file);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Asset Marketplace
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Explore our collection of cinematic assets
              </p>
            </div>

            <Button
              onClick={handleUploadClick}
              className="rounded-full px-5 self-start"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Asset
            </Button>
          </div>

          {/* Search + Category */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search assets..."
                title="Search assets"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-background border-border/60"
              />
            </div>

            <Select
              value={selectedCategory}
              onValueChange={(value) =>
                setSelectedCategory(value as AssetCategory)
              }
            >
              <SelectTrigger
                title="Select category"
                className="w-full md:w-[220px] h-10 bg-background border-border/60"
              >
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'All' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Upload Form */}
        {uploadFormVisible && (
          <div className="mb-10 p-8 rounded-2xl bg-card/50 border border-border/50">
            <h3 className="text-2xl font-bold mb-6">Upload Your Asset</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Asset Name
                </label>
                <Input
                  placeholder="Enter asset name"
                  title="Asset Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <Select>
                  <SelectTrigger title="Select category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe your asset"
                  title="Asset description"
                  rows={4}
                  className="w-full px-3 py-2 rounded-md bg-background/50 border border-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Price
                </label>
                <Input
                  type="number"
                  placeholder="Enter asset price"
                  title="Asset price"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Asset File
                </label>

                <div
                  onClick={handleAssetFileBoxClick}
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer"
                >
                  <Upload className="w-12 h-12 mx-auto mb-4" />
                  <p>Click to upload</p>
                </div>

                <input
                  ref={assetFileInputRef}
                  type="file"
                  accept=".glb,.gltf,.fbx,.obj,.stl"
                  onChange={handleAssetFileChange}
                  className="hidden"
                  title="Upload asset file"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button>Submit</Button>
              <Button
                variant="outline"
                onClick={() => setUploadFormVisible(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={handleAssetClick}
            />
          ))}
        </div>
      </div>

      <AssetDetailModal
        asset={selectedAsset}
        open={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  );
}