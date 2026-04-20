import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Upload, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FILM_CATEGORIES, ROUTE_PATHS } from '@/lib/index';
import type { Film } from '@/lib/index';
import { FilmCard } from '@/components/FilmCard';
import { FilmDetailModal } from '@/components/FilmDetailModal';
import { GRADUATION_TRAILER, FILMS_DATA } from '@/data/films';
import { useAuth } from '@/hooks/useAuth';
import { IMAGES } from '@/assets/images';

export default function Films() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const filmFileInputRef = useRef<HTMLInputElement | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [uploadFormVisible, setUploadFormVisible] = useState(false);

  const filteredFilms = FILMS_DATA.filter(film => {
    const matchesSearch = film.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         film.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || film.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUploadClick = () => {
    if (!isAuthenticated) {
      navigate(ROUTE_PATHS.SIGNIN);
    } else {
      setUploadFormVisible(true);
    }
  };

  const handleViewDetails = (film: Film) => {
    setSelectedFilm(film);
  };

  const handleFilmFileBoxClick = () => {
    filmFileInputRef.current?.click();
  };

  const handleFilmFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Selected film file:', file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.FILM_POSTER_1}
            alt="Graduation Trailer"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-block px-4 py-2 mb-6 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-primary text-sm font-medium">Graduation Project Trailer</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {GRADUATION_TRAILER.title}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              {GRADUATION_TRAILER.description}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>{GRADUATION_TRAILER.duration}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span>{GRADUATION_TRAILER.releaseYear}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span>{GRADUATION_TRAILER.director}</span>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/50 transition-all duration-300"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Trailer
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Film Marketplace</h2>
                <p className="text-muted-foreground">Explore our collection of cinematic experiences</p>
              </div>
              <Button
                onClick={handleUploadClick}
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/30"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Film
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search films..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card/50 border-border/50 backdrop-blur-sm"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[200px] bg-card/50 border-border/50 backdrop-blur-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {FILM_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {uploadFormVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 p-8 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm"
            >
              <h3 className="text-2xl font-bold mb-6">Upload Your Film</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Film Title</label>
                  <Input placeholder="Enter film title" className="bg-background/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILM_CATEGORIES.slice(1).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    placeholder="Describe your film"
                    rows={4}
                    className="w-full px-3 py-2 rounded-md bg-background/50 border border-input focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Film File</label>
                  <div
                    onClick={handleFilmFileBoxClick}
                    className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-2">MP4, MOV, AVI (max 500MB)</p>
                  </div>

                  <input
                    ref={filmFileInputRef}
                    type="file"
                    accept=".mp4,.mov,.avi,video/*"
                    onChange={handleFilmFileChange}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <Button className="bg-primary hover:bg-primary/90">Submit Film</Button>
                <Button variant="outline" onClick={() => setUploadFormVisible(false)}>Cancel</Button>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredFilms.map((film, index) => (
              <motion.div
                key={film.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
              >
                <FilmCard film={film} onViewDetails={handleViewDetails} />
              </motion.div>
            ))}
          </motion.div>

          {filteredFilms.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/20 flex items-center justify-center">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No films found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </motion.div>
          )}
        </div>
      </section>

      <FilmDetailModal
        film={selectedFilm}
        open={!!selectedFilm}
        onClose={() => setSelectedFilm(null)}
      />

    </div>
  );
}