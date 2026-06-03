import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  User, Film, Package, Heart, Upload,
Edit2, Star, BarChart3, Camera, X, Save
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/lib/supabase';
import { FilmCard } from '@/components/FilmCard';
import { AssetCard } from '@/components/AssetCard';
import { FilmDetailModal } from '@/components/FilmDetailModal';
import { AssetDetailModal } from '@/components/AssetDetailModal';

import { getFilmsFromDatabase } from '@/api/films';
import { getAssetsFromDatabase } from '@/api/assetsApi';

import type { Film as FilmType, Asset } from '@/lib/index';
import { ROUTE_PATHS } from '@/lib/index';
import { IMAGES } from '@/assets/images';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { springPresets } from '@/lib/motion';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { favoriteFilms, favoriteAssets } = useFavorites();

  const [films, setFilms] = useState<FilmType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedFilm, setSelectedFilm] = useState<FilmType | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isFilmModalOpen, setIsFilmModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('uploaded-films');
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.name || '');
  const [editFullName, setEditFullName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [defaultAvatarUrl, setDefaultAvatarUrl] = useState(user?.avatar || '');

  useEffect(() => {
    getFilmsFromDatabase()
      .then(setFilms)
      .catch(console.error);

    getAssetsFromDatabase()
      .then(setAssets)
      .catch(console.error);
  }, []);

 useEffect(() => {
  if (!user?.id) return;

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('full_name, bio, profile_image, default_profile_image')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Failed to load profile:', error);
      return;
    }

    const loadedName = data?.full_name || user.name || '';

    setFullName(loadedName);
    setEditFullName(loadedName);
    setBio(data?.bio || '');
    setAvatarUrl(data?.profile_image || '');
    setDefaultAvatarUrl(
  data?.default_profile_image ||
  data?.profile_image ||
  user.avatar ||
  IMAGES.DEFAULT_AVATAR_3
);
  };

  loadProfile();
}, [user?.id]);




  const savedFilmsData = films.filter((film) =>
  favoriteFilms.includes(film.id)
);

const savedAssetsData = assets.filter((asset) =>
  favoriteAssets.includes(asset.id)
);

 const uploadedFilmsData = films.filter(
  (film) => film.userId === Number(user.id)
);

const uploadedAssetsData = assets.filter(
  (asset) => asset.userId === Number(user.id)
);

  const handleFilmClick = (film: FilmType) => {
    setSelectedFilm(film);
    setIsFilmModalOpen(true);
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsAssetModalOpen(true);
  };

 const getStoragePathFromPublicUrl = (url: string) => {
  const marker = '/profile-images/';
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(
    url.substring(index + marker.length)
  );
};

const handleProfileImageChange = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  if (!file || !user?.id) return;
  const previewUrl = URL.createObjectURL(file);
setAvatarUrl(previewUrl);

  setUploadingImage(true);

  const oldImagePath = avatarUrl
    ? getStoragePathFromPublicUrl(avatarUrl)
    : null;
    console.log('UPLOAD avatarUrl =', avatarUrl);
console.log('UPLOAD oldImagePath =', oldImagePath);

  if (oldImagePath) {
    console.log('avatarUrl =', avatarUrl);
console.log('oldImagePath =', oldImagePath);
    await supabase.storage.from('profile-images').remove([oldImagePath]);
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Image upload failed:', uploadError);
    setUploadingImage(false);
    return;
  }

  const { data } = supabase.storage
    .from('profile-images')
    .getPublicUrl(fileName);

  setAvatarUrl(data.publicUrl);
  setUploadingImage(false);
};

const handleRemoveProfileImage = async () => {
  if (!user?.id) return;

  const { data: profile } = await supabase
    .from('users')
    .select('default_profile_image')
    .eq('id', user.id)
    .single();

  const baseAvatar =
    profile?.default_profile_image ||
    defaultAvatarUrl ||
    user.avatar ||
    IMAGES.DEFAULT_AVATAR_3;

  const { data: files } = await supabase.storage
    .from('profile-images')
    .list('');

  const filesToRemove =
    files
      ?.filter((file: { name: string }) =>
        file.name.startsWith(`${user.id}-`)
      )
      .map((file: { name: string }) => file.name)

  console.log('filesToRemove:', filesToRemove);

  if (filesToRemove.length > 0) {
  const response = await fetch(
    'http://localhost:8000/profile-images/delete',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_names: filesToRemove,
      }),
    }
  );

  const result = await response.json();

  console.log('delete result:', result);
}

  setAvatarUrl(baseAvatar);

  updateUser({
    avatar: baseAvatar,
  });

  await supabase
    .from('users')
    .update({
      profile_image: baseAvatar,
    })
    .eq('id', user.id);
};

const handleSaveProfile = async () => {
  if (!user?.id) return;

  const { error } = await supabase
    .from('users')
    .update({
      full_name: editFullName,
      bio,
      profile_image: avatarUrl.startsWith('blob:') ? null : avatarUrl || null,
    })
    .eq('id', user.id);

  if (error) {
    console.error('Failed to update profile:', error);
    return;
  }
  setFullName(editFullName);
  updateUser({
  name: editFullName,
  avatar: avatarUrl || user.avatar || IMAGES.DEFAULT_AVATAR_3,
  bio,
});
  setIsEditing(false);
  
};

const handleCancelEdit = () => {
  setEditFullName(fullName);
  setIsEditing(false);
};

  if (!user) {
    return null;
  }
  const displayedAvatar =
  avatarUrl || user.avatar || IMAGES.DEFAULT_AVATAR_3;

  const dashboardStats = [
    {
      title: 'Total Uploads',
      value: `${uploadedFilmsData.length + uploadedAssetsData.length}`,
      description: 'Films & assets uploaded',
      icon: Upload,
      gradient: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary',
      border: 'border-primary/20',
    },
    {
      title: 'Saved Items',
      value: `${favoriteFilms.length + favoriteAssets.length}`,
      description: 'Films & assets saved',
      icon: Heart,
      gradient: 'from-pink-500/20 to-pink-500/5',
      iconColor: 'text-pink-400',
      border: 'border-pink-500/20',
    },
    
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,217,255,0.03),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.03),transparent_50%)] pointer-events-none" />

      <div className="container mx-auto px-4 py-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springPresets.gentle}
          className="relative rounded-3xl overflow-hidden mb-8 border border-border/20 bg-[#060b16]/95 backdrop-blur-xl shadow-2xl shadow-black/20"
        >
          <div className="h-36 bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,217,255,0.15),transparent_70%)]" />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#060b16]/95 to-transparent" />
          </div>

          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-14">
              <div className="relative">
                <Avatar className="w-28 h-28 border-4 border-background shadow-xl ring-2 ring-primary/20">
                  <AvatarImage
                    src={displayedAvatar}
                  />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {isEditing && (
                  <div className="mt-3 flex flex-col gap-1">
                    <label className="cursor-pointer text-xs text-primary flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      {uploadingImage ? 'Uploading...' : 'Change Photo'}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleRemoveProfileImage}
                      className="text-xs text-red-400 hover:text-red-300 text-left"
                    >
                      Remove Photo
                    </button>
                  </div>
                )}

                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-background" />
              </div>

              <div className="flex-1 pt-2 space-y-2">
                <div className="flex flex-col items-start gap-3">
                  {isEditing ? (
                                <input
                                    type="text"
                                    value={editFullName}
                                    onChange={(e) => setEditFullName(e.target.value)}
                                    className="relative z-[9999] w-full max-w-md h-12 rounded-lg border border-primary/40 bg-background px-4 text-xl font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                                  />
                              ) : (
                                <h1 className="text-2xl font-bold text-foreground">
                                  {fullName}
                                </h1>
                              )}

                  <Badge className="text-xs bg-primary/10 text-primary border border-primary/20 font-medium">
                    {user.accountType || 'Creator'}
                  </Badge>
                </div>

                <p className="text-muted-foreground text-sm">{user.email}</p>

                {isEditing ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full max-w-xl min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Write something about yourself..."
                  />
                ) : (
                  <p className="text-sm text-muted-foreground/80 max-w-xl leading-relaxed">
                    {bio || 'Exploring the intersection of human creativity and artificial intelligence through cinematic storytelling and interactive 3D experiences.'}
                  </p>
                )}
              </div>

              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    className="gap-2 border-border/30"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>

                  <Button onClick={handleSaveProfile} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                </div>
              ) : (
                <Button
                 onClick={() => {
                      setEditFullName(fullName);
                      setIsEditing(true);
                    }}
                  variant="outline"
                  className="gap-2 border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springPresets.gentle, delay: 0.1 + index * 0.07 }}
                className={`relative rounded-2xl border ${stat.border} bg-[#060b16]/95 bg-gradient-to-br ${stat.gradient} backdrop-blur-sm p-5 overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl bg-[#060b16]/90 ${stat.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground mb-0.5">{stat.value}</div>
                <div className="text-xs font-medium text-foreground/70 mb-0.5">{stat.title}</div>
                <div className="text-xs text-muted-foreground">{stat.description}</div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springPresets.gentle, delay: 0.3 }}
          className="rounded-3xl border border-border/20 bg-[#060b16]/95 backdrop-blur-xl overflow-hidden shadow-xl shadow-black/10"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border/20 px-6 pt-4">
              <TabsList className="h-auto bg-transparent gap-1 p-0 flex-wrap">
                {[
                  { value: 'uploaded-films', icon: Upload, label: 'Uploaded Films' },
                  { value: 'uploaded-assets', icon: Package, label: 'Uploaded Assets' },
                  { value: 'favorite-films', icon: Film, label: 'Favorite Films' },
                  { value: 'favorite-assets', icon: Heart, label: 'Favorite Assets' },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-t-xl rounded-b-none data-[state=active]:bg-[#060b16]/95 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-all text-sm"
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="uploaded-films" className="mt-0">
                {uploadedFilmsData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {uploadedFilmsData.map((film) => (
                      <FilmCard key={film.id} film={film} onViewDetails={handleFilmClick} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Upload}
                    title="No Uploaded Films Yet"
                    description="Your uploaded films will appear here once you start sharing your work."
                    link={ROUTE_PATHS.FILMS}
                    button="Browse Films"
                  />
                )}
              </TabsContent>

              <TabsContent value="uploaded-assets" className="mt-0">
                  {uploadedAssetsData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {uploadedAssetsData.map((asset) => (
                        <AssetCard key={asset.id} asset={asset} onClick={handleAssetClick} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Package}
                      title="No Uploaded Assets Yet"
                      description="3D assets and models you upload will be showcased here."
                      link={ROUTE_PATHS.ASSETS}
                      button="Browse Assets"
                    />
                  )}
                </TabsContent>

              <TabsContent value="favorite-films" className="mt-0">
                {savedFilmsData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedFilmsData.map((film) => (
                      <FilmCard key={film.id} film={film} onViewDetails={handleFilmClick} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Heart}
                    title="No Favorite Films Yet"
                    description="Films you heart will be saved here for easy access."
                    link={ROUTE_PATHS.FILMS}
                    button="Explore Films"
                  />
                )}
              </TabsContent>

              <TabsContent value="favorite-assets" className="mt-0">
                {savedAssetsData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedAssetsData.map((asset) => (
                      <AssetCard key={asset.id} asset={asset} onClick={handleAssetClick} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Star}
                    title="No Favorite Assets Yet"
                    description="Save 3D assets you love and find them here instantly."
                    link={ROUTE_PATHS.ASSETS}
                    button="Explore Assets"
                  />
                )}
              </TabsContent>

            </div>
          </Tabs>
        </motion.div>
      </div>

      <FilmDetailModal
        film={selectedFilm}
        open={isFilmModalOpen}
        onClose={() => setIsFilmModalOpen(false)}
      />

      <AssetDetailModal
        asset={selectedAsset}
        open={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
      />
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  link,
  button,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  link: string;
  button: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm mb-6">{description}</p>
      <Button asChild variant="outline" className="border-border/30 hover:border-primary/30 hover:bg-primary/5">
        <Link to={link}>{button}</Link>
      </Button>
    </div>
  );
}
