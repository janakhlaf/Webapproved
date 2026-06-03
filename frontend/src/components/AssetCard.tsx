import { motion } from 'framer-motion';
import { Heart, Tag, User, Box, HardDrive, Cpu } from 'lucide-react';
import { Asset, formatPrice } from '@/lib/index';
import { LazyAsset3DViewer } from '@/components/LazyAsset3DViewer';
import { useFavorites } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface AssetCardProps {
  asset: Asset & {
    uploader?: string;
    sourceType?: string;
    status?: string;
  };
  onClick: (asset: Asset) => void;
}

export function AssetCard({ asset, onClick }: AssetCardProps) {
  const { isAssetFavorite, toggleAssetFavorite } = useFavorites();
  const isFavorite = isAssetFavorite(asset.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleAssetFavorite(asset.id);
  };

  const handleCardClick = () => {
    onClick(asset);
  };

  const statusLabel = asset.status || 'approved';
  const sourceLabel = asset.sourceType || 'user_upload';
  const uploaderLabel = asset.uploader || 'Unknown';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      whileHover={{ y: -8, scale: 1.025 }}
      className="group relative cursor-none h-full flex flex-col"
      onClick={handleCardClick}
    >
      {/* ─── Cyber Glow Backdrop Shadow ─── */}
      <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-purple-500/15 via-cyan-500/20 to-blue-600/15 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

      {/* ─── Premium Glassmorphic Card ─── */}
      <Card className="relative overflow-hidden rounded-2xl bg-[#080c14]/90 backdrop-blur-xl border border-cyan-500/15 hover:border-cyan-400/50 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.85)] h-full flex flex-col justify-between cursor-none">
        
        {/* Border Glint highlight */}
        <div className="absolute inset-0 z-30 pointer-events-none rounded-2xl border border-white/5" />

        {/* ─── 3D Model / Thumbnail Viewer Container ─── */}
        <div className="relative aspect-square bg-[#03050a]/90 overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#020306]/85 opacity-65 z-10 pointer-events-none" />
          
          <LazyAsset3DViewer
            modelType={asset.modelType}
            modelUrl={asset.modelUrl}
            viewMode="card"
            className="w-full h-full transform transition-transform duration-700 ease-out group-hover:scale-108 z-0"
          />

          {/* Favoriting Circle Button */}
          <motion.button
            onClick={handleFavoriteClick}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-[#080c14]/90 backdrop-blur-md border border-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.25)] transition-all duration-300 pointer-events-auto"
          >
            <Heart
              className={`w-4 h-4 transition-all duration-300 ${
                isFavorite
                  ? 'fill-cyan-400 text-cyan-400'
                  : 'text-gray-300 hover:text-cyan-400'
              }`}
            />
          </motion.button>

          {/* Telemetry Status Badges */}
          <div className="absolute top-4 left-4 z-20">
            <Badge className="bg-cyan-950/90 text-cyan-300 border border-cyan-400/35 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest">
              {statusLabel}
            </Badge>
          </div>

          <div className="absolute bottom-4 left-4 z-20">
            <Badge className="bg-[#080c14]/90 backdrop-blur-md border border-white/10 text-gray-300 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider">
              <Tag className="w-3 h-3 mr-1 text-cyan-400" />
              {asset.type}
            </Badge>
          </div>
        </div>

        {/* ─── Detail Description & Metadata Panel ─── */}
        <div className="p-5 flex-grow flex flex-col justify-between space-y-4 bg-gradient-to-b from-transparent to-[#03050a]/40 relative z-10">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white tracking-tight truncate group-hover:text-cyan-300 transition-colors duration-300">
              {asset.title}
            </h3>

            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
              {asset.description}
            </p>
          </div>

          {/* Technical Telemetry Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-[11px] font-mono text-gray-400 border-t border-white/5 pt-3.5">
            <div className="flex items-center gap-1.5 bg-[#080c14]/30 px-2 py-1 rounded-md border border-white/5">
              <User className="w-3.5 h-3.5 text-cyan-400/70" />
              <span className="truncate">{uploaderLabel}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#080c14]/30 px-2 py-1 rounded-md border border-white/5">
              <Cpu className="w-3.5 h-3.5 text-purple-400/70" />
              <span className="truncate uppercase">{sourceLabel}</span>
            </div>
          </div>

          {/* Purchase details & primary details link button */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <span className="text-xl font-black text-cyan-300 bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent font-mono">
              {formatPrice(asset.price)}
            </span>

            <Button
              size="sm"
              className="px-4 transition-all duration-300"
              onClick={handleCardClick}
            >
              Get Asset
            </Button>
          </div>

          {/* Technical Formats & Size Telemetry */}
          {(asset.fileSize || asset.format) && (
            <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 pt-1 border-t border-white/5">
              {asset.format && (
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-cyan-400/60" />
                  {asset.format}
                </span>
              )}

              {asset.fileSize && (
                <span className="flex items-center gap-1">
                  <Box className="w-3 h-3 text-purple-400/60" />
                  {asset.fileSize}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
