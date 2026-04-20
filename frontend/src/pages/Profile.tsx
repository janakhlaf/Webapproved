import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  User, Settings, Film, Package, Heart, Upload,
  ShoppingBag, Edit2, Bell, Palette, Globe, Bot,
  Star, Lock, ChevronRight, BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { FilmCard } from '@/components/FilmCard';
import { AssetCard } from '@/components/AssetCard';
import { FilmDetailModal } from '@/components/FilmDetailModal';
import { AssetDetailModal } from '@/components/AssetDetailModal';
import { FILMS_DATA } from '@/data/films';
import { ASSETS_DATA } from '@/data/assets';
import type { Film as FilmType, Asset } from '@/lib/index';
import { ROUTE_PATHS } from '@/lib/index';
import { IMAGES } from '@/assets/images';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { springPresets } from '@/lib/motion';

export default function Profile() {
  const { user } = useAuth();
  const { favoriteFilms, favoriteAssets } = useFavorites();
  const [selectedFilm, setSelectedFilm] = useState<FilmType | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isFilmModalOpen, setIsFilmModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('uploaded-films');

  const savedFilmsData = FILMS_DATA.filter(film => favoriteFilms.includes(film.id));
  const savedAssetsData = ASSETS_DATA.filter(asset => favoriteAssets.includes(asset.id));

  const handleFilmClick = (film: FilmType) => {
    setSelectedFilm(film);
    setIsFilmModalOpen(true);
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsAssetModalOpen(true);
  };

  const dashboardStats = [
    {
      title: 'Total Uploads',
      value: '0',
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
    {
      title: 'Account Overview',
      value: user?.accountType || 'Creator',
      description: 'Member since 2026',
      icon: BarChart3,
      gradient: 'from-yellow-500/20 to-yellow-500/5',
      iconColor: 'text-yellow-400',
      border: 'border-yellow-500/20',
    },
  ];

  // Redirect to home if not signed in
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,217,255,0.03),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.03),transparent_50%)] pointer-events-none" />

      <div className="container mx-auto px-4 py-10 relative z-10">

        {/* ── PROFILE HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springPresets.gentle}
          className="relative rounded-3xl overflow-hidden mb-8 border border-border/20 bg-card/40 backdrop-blur-xl shadow-2xl shadow-black/20"
        >
          {/* Banner */}
          <div className="h-36 bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,217,255,0.15),transparent_70%)]" />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card/40 to-transparent" />
          </div>

          {/* Profile info */}
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-14">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-28 h-28 border-4 border-background shadow-xl ring-2 ring-primary/20">
                  <AvatarImage src={user.avatar || IMAGES.DEFAULT_AVATAR_3} alt={user.name} />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-background" />
              </div>

              {/* Name / email / bio */}
              <div className="flex-1 pt-2 space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                  <Badge className="text-xs bg-primary/10 text-primary border border-primary/20 font-medium">
                    {user.accountType || 'Creator'}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">{user.email}</p>
                <p className="text-sm text-muted-foreground/80 max-w-xl leading-relaxed">
                  Exploring the intersection of human creativity and artificial intelligence through
                  cinematic storytelling and interactive 3D experiences.
                </p>
              </div>

              {/* Edit button */}
              <Button
                variant="outline"
                className="gap-2 border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ── DASHBOARD STATS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springPresets.gentle, delay: 0.1 + index * 0.07 }}
                className={`relative rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.gradient} backdrop-blur-sm p-5 overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl bg-card/60 ${stat.iconColor}`}>
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

        {/* ── MAIN TABS ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springPresets.gentle, delay: 0.3 }}
          className="rounded-3xl border border-border/20 bg-card/40 backdrop-blur-xl overflow-hidden shadow-xl shadow-black/10"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab bar */}
            <div className="border-b border-border/20 px-6 pt-4">
              <TabsList className="h-auto bg-transparent gap-1 p-0 flex-wrap">
                {[
                  { value: 'uploaded-films', icon: Upload, label: 'Uploaded Films' },
                  { value: 'uploaded-assets', icon: Package, label: 'Uploaded Assets' },
                  { value: 'favorite-films', icon: Film, label: 'Favorite Films' },
                  { value: 'favorite-assets', icon: Heart, label: 'Favorite Assets' },
                  { value: 'settings', icon: Settings, label: 'Settings' },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-t-xl rounded-b-none data-[state=active]:bg-background/60 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-all text-sm"
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="p-6">

              {/* Uploaded Films */}
              <TabsContent value="uploaded-films" className="mt-0">
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Uploaded Films Yet</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Your uploaded films will appear here once you start sharing your work.
                  </p>
                  <Button asChild variant="outline" className="border-border/30 hover:border-primary/30 hover:bg-primary/5">
                    <Link to={ROUTE_PATHS.FILMS}>Browse Films</Link>
                  </Button>
                </div>
              </TabsContent>

              {/* Uploaded Assets */}
              <TabsContent value="uploaded-assets" className="mt-0">
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Uploaded Assets Yet</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    3D assets and models you upload will be showcased here.
                  </p>
                  <Button asChild variant="outline" className="border-border/30 hover:border-accent/30 hover:bg-accent/5">
                    <Link to={ROUTE_PATHS.ASSETS}>Browse Assets</Link>
                  </Button>
                </div>
              </TabsContent>

              {/* Favorite Films */}
              <TabsContent value="favorite-films" className="mt-0">
                {savedFilmsData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedFilmsData.map((film) => (
                      <FilmCard key={film.id} film={film} onViewDetails={handleFilmClick} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-pink-500/5 border border-pink-500/10 flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Favorite Films Yet</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      Films you heart will be saved here for easy access.
                    </p>
                    <Button asChild variant="outline" className="border-border/30 hover:border-pink-500/20">
                      <Link to={ROUTE_PATHS.FILMS}>Explore Films</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Favorite Assets */}
              <TabsContent value="favorite-assets" className="mt-0">
                {savedAssetsData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedAssetsData.map((asset) => (
                      <AssetCard key={asset.id} asset={asset} onClick={handleAssetClick} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-pink-500/5 border border-pink-500/10 flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Favorite Assets Yet</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      Save 3D assets you love and find them here instantly.
                    </p>
                    <Button asChild variant="outline" className="border-border/30 hover:border-pink-500/20">
                      <Link to={ROUTE_PATHS.ASSETS}>Explore Assets</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Settings */}
              <TabsContent value="settings" className="mt-0">
                <div className="max-w-2xl space-y-8">

                  {/* Profile Information */}
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <User className="w-4 h-4 text-primary" />
                      <h3 className="text-base font-semibold">Profile Information</h3>
                    </div>
                    <div className="rounded-2xl border border-border/20 bg-background/30 divide-y divide-border/20">
                      {[
                        { label: 'Full Name', value: user.name },
                        { label: 'Email Address', value: user.email },
                        { label: 'Account Type', value: user.accountType || 'Creator' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between px-5 py-4">
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.value}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary gap-1">
                            Edit <ChevronRight className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <div className="px-5 py-4">
                        <p className="text-sm font-medium mb-2">Bio</p>
                        <Input
                          defaultValue="Exploring the intersection of human creativity and AI."
                          className="bg-background/50 border-border/20 text-sm focus:border-primary/30"
                        />
                      </div>
                    </div>
                  </div>

                </div>
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