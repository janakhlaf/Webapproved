import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Download } from 'lucide-react';
import { Asset3DViewer } from '@/components/Asset3DViewer';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, type Asset, ROUTE_PATHS } from '@/lib/index';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface AssetDetailModalProps {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
}

export function AssetDetailModal({ asset, open, onClose }: AssetDetailModalProps) {
  const { isAssetFavorite, toggleAssetFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!asset) return null;

  const isFavorite = isAssetFavorite(asset.id);

  const handlePurchase = () => {
    if (!isAuthenticated) {
      onClose();
      navigate(ROUTE_PATHS.SIGNIN);
      return;
    }

    console.log('Purchase asset:', asset.id);
  };

  const handleDownload = () => {
    console.log('Download asset:', asset.id);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-foreground">
            {asset.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          <div className="space-y-6">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-card border border-primary/20">
              <Asset3DViewer modelType={asset.modelType} className="w-full h-full" />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => toggleAssetFavorite(asset.id)}
                variant={isFavorite ? 'default' : 'outline'}
                className="flex-1 gap-2 transition-all duration-200 hover:scale-[1.02]"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'Saved' : 'Save to Favorites'}
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                size="icon"
                className="transition-all duration-200 hover:scale-[1.02]"
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {asset.type}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1 border-primary/30">
                {asset.category}
              </Badge>
              {asset.format && (
                <Badge variant="outline" className="text-sm px-3 py-1 border-accent/30">
                  {asset.format}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Description
              </h3>
              <p className="text-foreground/90 leading-relaxed">{asset.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {asset.fileSize && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">File Size</p>
                  <p className="text-lg font-semibold text-foreground">{asset.fileSize}</p>
                </div>
              )}
              {asset.format && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Format</p>
                  <p className="text-lg font-semibold text-foreground">{asset.format}</p>
                </div>
              )}
            </div>

            {asset.tags && asset.tags.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs px-2 py-1 border-muted-foreground/20"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-4xl font-bold text-primary">{formatPrice(asset.price)}</p>
                </div>
              </div>

              <Button
                onClick={handlePurchase}
                size="lg"
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
              >
                <ShoppingCart className="h-5 w-5" />
                Purchase Asset
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-3">
                Instant download after purchase
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}