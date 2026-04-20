import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Sparkles, Box, ArrowRight } from 'lucide-react';
import { Hero3D } from '@/components/Hero3D';
import { FilmCard } from '@/components/FilmCard';
import { AssetCard } from '@/components/AssetCard';
import { FilmDetailModal } from '@/components/FilmDetailModal';
import { AssetDetailModal } from '@/components/AssetDetailModal';
import { ROUTE_PATHS, Film, Asset } from '@/lib/index';
import { GRADUATION_TRAILER, FILMS_DATA } from '@/data/films';
import { ASSETS_DATA } from '@/data/assets';
import { Button } from '@/components/ui/button';
import { IMAGES } from '@/assets/images';

export default function Home() {
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const featuredFilms = FILMS_DATA.slice(0, 3);
  const featuredAssets = ASSETS_DATA.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Hero3D />

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
              <span className="text-sm font-medium text-primary">Featured Films</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              Cinematic Explorations
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our collection of films exploring the intersection of human consciousness and artificial intelligence
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
              <Button
                size="lg"
                className="group bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
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
              <span className="text-sm font-medium text-accent">3D Assets</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-accent to-primary bg-clip-text text-transparent">
              Interactive 3D Assets
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our premium collection of 3D models, environments, and effects for your creative projects
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

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link to={ROUTE_PATHS.ASSETS}>
              <Button
                size="lg"
                className="group bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20"
              >
                Browse All Assets
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={IMAGES.ABOUT_BG_1}
            alt=""
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Our Vision</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Human Mind & AI Logic
              </h2>
            </div>

            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-lg shadow-primary/5"
              >
                <h3 className="text-2xl font-semibold mb-4 text-primary">The Intersection</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our graduation project explores the profound convergence of human consciousness and artificial intelligence. Through cinematic storytelling and interactive 3D experiences, we examine how memory, emotion, creativity, and logic intertwine in the digital age.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-lg shadow-accent/5"
              >
                <h3 className="text-2xl font-semibold mb-4 text-accent">The Experience</h3>
                <p className="text-muted-foreground leading-relaxed">
                  This platform serves as a multimedia showcase of our research and creative work. From thought-provoking films that challenge our understanding of consciousness to interactive 3D assets that bring futuristic concepts to life, every element is designed to immerse you in the dialogue between human and artificial minds.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-2xl p-8 shadow-lg shadow-primary/10"
              >
                <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">The Future</h3>
                <p className="text-muted-foreground leading-relaxed">
                  As we stand at the threshold of a new era where human creativity and artificial intelligence collaborate, we invite you to explore, question, and imagine the possibilities. This is not just a project—it's a vision of what lies ahead when minds, both organic and synthetic, work in harmony.
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-center mt-12"
            >
              <Link to={ROUTE_PATHS.ABOUT}>
                <Button
                  size="lg"
                  variant="outline"
                  className="group border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                >
                  Learn More About Our Project
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
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
