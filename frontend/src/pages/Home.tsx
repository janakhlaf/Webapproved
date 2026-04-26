import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Box, ArrowRight } from 'lucide-react';

import { FilmCard } from '@/components/FilmCard';
import { AssetCard } from '@/components/AssetCard';
import { FilmDetailModal } from '@/components/FilmDetailModal';
import { AssetDetailModal } from '@/components/AssetDetailModal';

import { ROUTE_PATHS, Film, Asset } from '@/lib/index';
import { FILMS_DATA } from '@/data/films';
import { getAssetsFromDatabase } from '@/api/assetsApi';

import { Button } from '@/components/ui/button';
import { IMAGES } from '@/assets/images';

export default function Home() {
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    getAssetsFromDatabase()
      .then(setAssets)
      .catch(console.error);
  }, []);

  const featuredFilms = FILMS_DATA.slice(0, 3);
  const featuredAssets = assets.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Play className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Featured Films
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              Cinematic Explorations
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our collection of films exploring the intersection of
              human consciousness and artificial intelligence
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredFilms.map((film, index) => (
              <motion.div
                key={film.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <FilmCard film={film} onViewDetails={setSelectedFilm} />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link to={ROUTE_PATHS.FILMS}>
              <Button size="lg" className="group">
                Explore All Films
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={IMAGES.HERO_BG_8}
            alt=""
            className="w-full h-full object-cover opacity-5"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <Box className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">
                3D Assets
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Interactive 3D Assets
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our premium collection of 3D models, environments, and
              effects for your creative projects
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <AssetCard asset={asset} onClick={setSelectedAsset} />
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link to={ROUTE_PATHS.ASSETS}>
              <Button size="lg">
                Browse All Assets
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <FilmDetailModal
        film={selectedFilm}
        open={!!selectedFilm}
        onClose={() => setSelectedFilm(null)}
      />

      <AssetDetailModal
        asset={selectedAsset}
        open={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  );
}