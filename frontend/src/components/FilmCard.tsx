import { motion } from 'framer-motion';
import { Heart, Play } from 'lucide-react';
import { Film } from '@/lib/index';
import { useFavorites } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface FilmCardProps {
  film: Film;
  onViewDetails: (film: Film) => void;
}

export function FilmCard({ film, onViewDetails }: FilmCardProps) {
  const { isFilmFavorite, toggleFilmFavorite } = useFavorites();
  const isFavorite = isFilmFavorite(film.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFilmFavorite(film.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-xl border border-border/20 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_8px_30px_-6px_color-mix(in_srgb,var(--primary)_25%,transparent)]">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={film.posterUrl}
            alt={film.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
          
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/20 hover:border-primary/40 transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-5 h-5 transition-colors duration-200 ${
                isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary'
              }`}
            />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <Badge
              variant="secondary"
              className="bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm"
            >
              {film.category}
            </Badge>
            <h3 className="text-xl font-semibold text-foreground line-clamp-2">
              {film.title}
            </h3>
            {film.director && (
              <p className="text-sm text-muted-foreground">Directed by {film.director}</p>
            )}
          </div>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {film.description}
          </p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {film.duration && <span>{film.duration}</span>}
              {film.releaseYear && (
                <>
                  <span>•</span>
                  <span>{film.releaseYear}</span>
                </>
              )}
            </div>
          </div>

          <Button
            onClick={() => onViewDetails(film)}
            className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50 transition-all duration-200 group/btn"
            variant="outline"
          >
            <Play className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
            View Details
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}