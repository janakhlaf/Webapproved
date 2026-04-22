// UPDATED Films.tsx (Upload button styled like Assets theme)

import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Upload, Play, Image as ImageIcon } from 'lucide-react';
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
  const posterFileInputRef = useRef<HTMLInputElement | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [uploadFormVisible, setUploadFormVisible] = useState(false);

  const [filmTitle, setFilmTitle] = useState('');
  const [filmCategory, setFilmCategory] = useState<string>('');
  const [filmDescription, setFilmDescription] = useState('');
  const [filmFile, setFilmFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [uploadedFilms, setUploadedFilms] = useState<Film[]>(() => {
    const saved = localStorage.getItem('uploaded_films');
    return saved ? JSON.parse(saved) : [];
  });

  const allFilms = useMemo(() => [...uploadedFilms, ...FILMS_DATA], [uploadedFilms]);

  const filteredFilms = allFilms.filter((film) => {
    const matchesSearch =
      film.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      film.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All Categories' || film.category === selectedCategory;

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

  const handlePosterFileBoxClick = () => {
    posterFileInputRef.current?.click();
  };

  const handleFilmFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFilmFile(file);
  };

  const handlePosterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPosterFile(file);
  };

  const resetForm = () => {
    setFilmTitle('');
    setFilmCategory('');
    setFilmDescription('');
    setFilmFile(null);
    setPosterFile(null);
    setUploadFormVisible(false);

    if (filmFileInputRef.current) filmFileInputRef.current.value = '';
    if (posterFileInputRef.current) posterFileInputRef.current.value = '';
  };

  const handleSubmitFilm = () => {
    if (!filmTitle || !filmCategory || !filmDescription || !filmFile || !posterFile) {
      alert('Please fill all fields and upload both the film file and poster image.');
      return;
    }

    const newFilm: Film = {
      id: `uploaded-${Date.now()}`,
      title: filmTitle,
      description: filmDescription,
      category: filmCategory,
      posterUrl: URL.createObjectURL(posterFile),
      videoUrl: URL.createObjectURL(filmFile),
      duration: 'New Upload',
      releaseYear: new Date().getFullYear(),
      director: 'Uploaded by User',
      tags: ['Uploaded'],
    };

    const updatedFilms = [newFilm, ...uploadedFilms];
    setUploadedFilms(updatedFilms);
    localStorage.setItem('uploaded_films', JSON.stringify(updatedFilms));

    resetForm();
    alert('Film uploaded successfully.');
  };

  return (
    <div className="min-h-screen bg-background">

      {/* HEADER */}
      <section className="py-24">
        <div className="container mx-auto px-4">

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Film Marketplace</h2>
              <p className="text-muted-foreground">Explore our collection of cinematic experiences</p>
            </div>

            {/* ✅ UPDATED BUTTON */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
  onClick={handleUploadClick}
  className="rounded-full px-5 self-start"
>
  <Upload className="w-4 h-4 mr-2" />
  Upload Film
</Button>
            </motion.div>
          </div>

          {/* SEARCH */}
          <div className="flex flex-col md:flex-row gap-4 mb-10">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
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

          {/* FILMS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFilms.map((film) => (
              <FilmCard key={film.id} film={film} onViewDetails={handleViewDetails} />
            ))}
          </div>

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
