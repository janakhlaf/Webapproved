import { useState, useRef } from 'react';
import { Search, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  // 🔥 الجديد
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
      asset.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' || asset.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortOrder === 'highest') {
      return b.price - a.price;
    }
    return a.price - b.price;
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

  // 🔥 الجديد
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
    <div className="min-h-screen bg-background">
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              3D Assets Marketplace
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore our collection of premium interactive 3D assets for your creative projects
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 mb-12"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search assets by name, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary"
                />
              </div>

              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value as AssetCategory)}
              >
                <SelectTrigger className="w-full lg:w-48 h-12 bg-background/50 border-border/50">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as 'highest' | 'lowest')}
              >
                <SelectTrigger className="w-full lg:w-48 h-12 bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highest">Highest Price</SelectItem>
                  <SelectItem value="lowest">Lowest Price</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleUploadClick}
                className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Asset
              </Button>
            </div>
          </motion.div>

          {uploadFormVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-12 p-8 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm"
            >
              <h3 className="text-2xl font-bold mb-6">Upload Your Asset</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Asset Name</label>
                  <Input placeholder="Enter asset name" className="bg-background/50" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_CATEGORIES
                        .filter((category) => category !== 'All')
                        .map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    placeholder="Describe your asset"
                    rows={4}
                    className="w-full px-3 py-2 rounded-md bg-background/50 border border-input focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <Input type="number" placeholder="Enter asset price" className="bg-background/50" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Asset File</label>

                  <div
                    onClick={handleAssetFileBoxClick}
                    className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      GLB, GLTF, FBX, OBJ, STL (max 500MB)
                    </p>
                  </div>

                  {/* 🔥 الجديد */}
                  <input
                    ref={assetFileInputRef}
                    type="file"
                    accept=".glb,.gltf,.fbx,.obj,.stl"
                    onChange={handleAssetFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button className="bg-primary hover:bg-primary/90">Submit Asset</Button>
                <Button variant="outline" onClick={() => setUploadFormVisible(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <AssetCard asset={asset} onClick={handleAssetClick} />
              </motion.div>
            ))}
          </motion.div>

          {filteredAssets.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24"
            >
              <p className="text-2xl text-muted-foreground">
                No assets found matching your criteria
              </p>
              <p className="text-muted-foreground mt-4">
                Try adjusting your search or filters
              </p>
            </motion.div>
          )}
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