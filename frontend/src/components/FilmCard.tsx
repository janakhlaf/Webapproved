import { motion } from 'framer-motion';
import { Heart, Play, Clock, Calendar, Sparkles } from 'lucide-react';
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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      whileHover={{ y: -8, scale: 1.03 }}
      className="group relative h-full"
    >
      {/* ─── Cyber Glow Backdrop Shadow ─── */}
      <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-600/10 to-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

      {/* ─── Premium Glassmorphic Card ─── */}
      <Card className="relative overflow-hidden rounded-2xl bg-[#080c14]/45 backdrop-blur-xl border border-cyan-500/15 hover:border-cyan-400/50 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.85)] h-full flex flex-col cursor-none">
        
        {/* Border Glint highlight */}
        <div className="absolute inset-0 z-30 pointer-events-none rounded-2xl border border-white/5" />

        {/* ─── Poster Image Container ─── */}
        <div className="relative aspect-[16/22] overflow-hidden bg-black/90">
          <img
            src={
              film.posterUrl ||
              (film as any).poster_url ||
              (film as any).thumbnail_url ||
              "/placeholder.jpg"
            }
            alt={film.title}
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
          />

          {/* Cinematic Darkening Radial Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020306] via-[#020306]/35 to-transparent z-10" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#020306]/80 opacity-65 z-10" />

          {/* Interactive Favoriting Button */}
          <motion.button
            onClick={handleFavoriteClick}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-[#080c14]/75 backdrop-blur-md border border-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.25)] transition-all duration-300 pointer-events-auto"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-4 h-4 transition-all duration-300 ${
                isFavorite
                  ? 'fill-cyan-400 text-cyan-400'
                  : 'text-gray-300 hover:text-cyan-400'
              }`}
            />
          </motion.button>

          {/* Category Badge */}
          <div className="absolute top-4 left-4 z-20">
            <Badge
              variant="secondary"
              className="bg-cyan-950/40 text-cyan-300 border border-cyan-400/35 backdrop-blur-md px-2.5 py-1 text-xs font-mono uppercase tracking-widest"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-cyan-300 animate-pulse" />
              {film.category}
            </Badge>
          </div>

          {/* ─── Animated Hover Slide Reveal Overlay ─── */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020306] via-[#020306]/96 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-15 flex flex-col justify-end p-6 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Story Brief</span>
              <p className="text-sm text-gray-300 leading-relaxed line-clamp-5">
                {film.description}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-gray-400 pt-2 border-t border-white/5">
              {film.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400/80" />
                  {film.duration}
                </span>
              )}
              {film.releaseYear && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-400/80" />
                  {film.releaseYear}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ─── Static Detail Panel (Standard View) ─── */}
        <div className="p-5 flex-grow flex flex-col justify-between space-y-4 relative bg-gradient-to-b from-transparent to-[#03050a]/40 z-10">
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-white tracking-tight line-clamp-1 group-hover:text-cyan-300 transition-colors duration-300">
              {film.title}
            </h3>

            {film.director && (
              <p className="text-xs font-sans text-gray-400">
                Directed by <span className="text-gray-300 font-medium">{film.director}</span>
              </p>
            )}
          </div>

          <Button
            onClick={() => onViewDetails(film)}
            className="w-full transition-all duration-300"
            variant="outline"
          >
            <Play className="w-4 h-4 mr-2 text-cyan-300" />
            Watch Details
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}