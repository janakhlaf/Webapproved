import { useEffect, useState, useRef } from 'react';
import { Search, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AssetCard } from '@/components/AssetCard';
import { AssetDetailModal } from '@/components/AssetDetailModal';
import { getAssetsFromDatabase } from '@/api/assetsApi';
import { useAuth } from '@/hooks/useAuth';
import {
  Asset,
  ASSET_CATEGORIES,
  AssetCategory,
  ROUTE_PATHS,
} from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Assets() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const assetFileInputRef = useRef<HTMLInputElement | null>(null);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<AssetCategory>('All Categories');
  const [sortOrder, setSortOrder] = useState<'highest' | 'lowest'>('highest');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [uploadFormVisible, setUploadFormVisible] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [assetName, setAssetName] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [assetPrice, setAssetPrice] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const ASSET_TAGS = [
    'realistic',
    'cartoon',
    'stylized',
    'lowpoly',
    'scifi',
    'fantasy',
    'cyberpunk',
    'medieval',
    'character',
    'humanoid',
    'monster',
    'animal',
    'boy',
    'girl',
    'robot',
    'mech',
    'machine',
    'drone',
    'vehicle',
    'car',
    'aircraft',
    'racing',
    'environment',
    'city',
    'nature',
    'forest',
    'interior',
    'architecture',
    'building',
    'urban',
    'prop',
    'weapon',
    'food',
    'furniture',
    'campfire',
    'animated',
    'rigged',
    'game-ready',
  ];

  useEffect(() => {
    getAssetsFromDatabase().then(setAssets).catch(console.error);
  }, []);

  const filteredAssets = assets
    .filter((asset) => {
      const matchesSearch =
        asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === 'All Categories' ||
        asset.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      return sortOrder === 'highest' ? b.price - a.price : a.price - b.price;
    });

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAssets = filteredAssets.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortOrder]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

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

  const handleAssetFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      setSelectedFile(file);
    }
  };

 const handleAssetSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const isInvalid =
    !assetName ||
    !assetDescription ||
    !uploadCategory ||
    !assetPrice ||
    selectedTags.length !== 3 ||
    !selectedFile;

  if (isInvalid) {
    setSubmitError(true);
    setSuccessMessage('');
    return;
  }

  setSubmitError(false);

  const formData = new FormData();
  formData.append('title', assetName);
  formData.append('description', assetDescription);
  formData.append('category', uploadCategory);
  formData.append('price', assetPrice);
  formData.append('tags', JSON.stringify(selectedTags));
  formData.append('file', selectedFile);
  if (!user?.id) {
  navigate(ROUTE_PATHS.SIGNIN);
  return;
}

formData.append('auth_user_id', user.id);

  try {
    const response = await fetch('http://localhost:8000/assets/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    setShowSuccessModal(true);
  } catch (error) {
    console.error(error);
    alert('Something went wrong. Please try again.');
  }
};
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
                    {category}
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
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className={
                    submitError && !assetName
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }
                />

                {submitError && !assetName && (
                  <p className="text-red-500 text-xs mt-1">
                    Please enter asset name.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>

                <Select
                  value={uploadCategory}
                  onValueChange={setUploadCategory}
                >
                  <SelectTrigger
                    title="Select category"
                    className={
                      submitError && !uploadCategory ? 'border-red-500' : ''
                    }
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>

                  <SelectContent>
                    {ASSET_CATEGORIES.filter(
                      (c) => c !== 'All Categories'
                    ).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {submitError && !uploadCategory && (
                  <p className="text-red-500 text-xs mt-1">
                    Please select category.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>

                <Textarea
                  placeholder="Describe your asset"
                  value={assetDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setAssetDescription(e.target.value)
                  }
                  className={
                    submitError && !assetDescription
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }
                />

                {submitError && !assetDescription && (
                  <p className="text-red-500 text-xs mt-1">
                    Please enter description.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Tags (Select up to 3)
                </label>

                <Select
                  onValueChange={(tag) => {
                    if (
                      !selectedTags.includes(tag) &&
                      selectedTags.length < 3
                    ) {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                >
                  <SelectTrigger
                    title="Select tags"
                    className={
                      submitError && selectedTags.length === 0
                        ? 'border-red-500'
                        : ''
                    }
                  >
                    <SelectValue placeholder="Choose tags" />
                  </SelectTrigger>

                  <SelectContent>
                    {ASSET_TAGS.map((tag) => (
                      <SelectItem
                        key={tag}
                        value={tag}
                        disabled={selectedTags.includes(tag)}
                      >
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm"
                    >
                      {tag}

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedTags(
                            selectedTags.filter((t) => t !== tag)
                          )
                        }
                        className="text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {selectedTags.length >= 3 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Maximum 3 tags selected
                  </p>
                )}

               {submitError && selectedTags.length !== 3 && (
                <p className="text-red-500 text-xs mt-1">
                  Please select exactly 3 tags.
                </p>
              )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Price
                </label>

                <Input
                  placeholder="Enter asset price"
                  value={assetPrice}
                  onChange={(e) => setAssetPrice(e.target.value)}
                  className={
                    submitError && !assetPrice
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }
                />

                {submitError && !assetPrice && (
                  <p className="text-red-500 text-xs mt-1">
                    Please enter price.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Asset File
                </label>

                <div
                  onClick={handleAssetFileBoxClick}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                    submitError && !selectedFile ? 'border-red-500' : ''
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-20 border-2 border-muted rounded-sm bg-white relative">
                        <div className="absolute top-0 right-0 w-4 h-4 bg-background border-l-2 border-b-2 border-muted rotate-45 translate-x-2 -translate-y-2" />
                      </div>

                      <p className="text-sm mt-2 text-foreground">
                        {selectedFile.name}
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto mb-4" />
                      <p>Click to upload</p>
                    </>
                  )}
                </div>

                {submitError && !selectedFile && (
                  <p className="text-red-500 text-xs mt-2">
                    Please upload asset file.
                  </p>
                )}

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
              <Button type="button" onClick={handleAssetSubmit}>
                Submit
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setUploadFormVisible(false);
                  setSubmitError(false);
                  setSuccessMessage('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={handleAssetClick}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-12">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="border-primary/40 text-primary hover:bg-primary/10"
            >
              ←
            </Button>

            {Array.from({ length: totalPages }).map((_, index) => (
              <Button
                key={index}
                size="sm"
                variant={currentPage === index + 1 ? 'default' : 'outline'}
                onClick={() => setCurrentPage(index + 1)}
                className={
                  currentPage === index + 1
                    ? 'bg-primary text-primary-foreground'
                    : 'border-primary/40 text-primary hover:bg-primary/10'
                }
              >
                {index + 1}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="border-primary/40 text-primary hover:bg-primary/10"
            >
              →
            </Button>
          </div>
        )}
        {showSuccessModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div className="w-full max-w-md rounded-2xl border border-primary/40 bg-background p-6 text-center shadow-xl">
      <h3 className="text-xl font-bold mb-3">Asset Submitted</h3>

      <p className="text-sm text-muted-foreground mb-6">
        Your asset was submitted successfully and is waiting for admin review.
      </p>

      <Button
        type="button"
        onClick={() => {
          setShowSuccessModal(false);

          setAssetName('');
          setAssetDescription('');
          setAssetPrice('');
          setUploadCategory('');
          setSelectedTags([]);
          setSelectedFile(null);
          setSubmitError(false);
          setUploadFormVisible(false);
        }}
      >
        OK
      </Button>
    </div>
  </div>
)}
      </div>

      <AssetDetailModal
        asset={selectedAsset}
        open={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  );
}