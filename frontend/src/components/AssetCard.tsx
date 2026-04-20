import { motion } from 'framer-motion';
import { Heart, DollarSign, Tag } from 'lucide-react';
import { Asset, formatPrice } from '@/lib/index';
import { Asset3DViewer } from '@/components/Asset3DViewer';
import { useFavorites } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface AssetCardProps {
  asset: Asset;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      whileHover={{ scale: 1.02 }}
      className="group cursor-pointer"
      onClick={handleCardClick}
    >
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-xl border-border/20 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_8px_30px_-6px_color-mix(in_srgb,var(--primary)_25%,transparent)]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative aspect-square bg-background/80 overflow-hidden">
          <Asset3DViewer modelType={asset.modelType} className="w-full h-full" />
          
          <motion.button
            onClick={handleFavoriteClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/80 backdrop-blur-md border border-border/40 hover:border-primary/60 transition-all duration-200"
          >
            <Heart
              className={`w-5 h-5 transition-all duration-200 ${
                isFavorite
                  ? 'fill-primary text-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            />
          </motion.button>

          <div className="absolute bottom-3 left-3 z-10">
            <Badge className="bg-background/90 backdrop-blur-md border-border/40 text-foreground">
              <Tag className="w-3 h-3 mr-1" />
              {asset.type}
            </Badge>
          </div>
        </div>

        <div className="relative p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
                {asset.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {asset.description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-xl font-bold text-primary">
                {formatPrice(asset.price)}
              </span>
            </div>
            
            <Button
              size="sm"
              className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 hover:border-primary/60 transition-all duration-200"
              onClick={handleCardClick}
            >
              View Details
            </Button>
          </div>

          {asset.tags && asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {asset.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs border-border/40 text-muted-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {(asset.fileSize || asset.format) && (
            <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
              {asset.format && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  {asset.format}
                </span>
              )}
              {asset.fileSize && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
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