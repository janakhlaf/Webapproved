import { useState, useRef, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FILM_CATEGORIES, ROUTE_PATHS } from '@/lib/index';
import type { Film } from '@/lib/index';
import { FilmCard } from '@/components/FilmCard';
import { FilmDetailModal } from '@/components/FilmDetailModal';
import { useAuth } from '@/hooks/useAuth';
import { getFilmsFromDatabase } from '@/api/films';

export default function Films() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const filmFileInputRef = useRef<HTMLInputElement | null>(null);
  const posterFileInputRef = useRef<HTMLInputElement | null>(null);

  const FILM_TAGS = [
  'robot',
  'scifi',
  'postapocalyptic',
  'food',
  'comedy',
  'adventure',
  'survival',
  'superhero',
  'action',
  'racing',
  'humanoid',
  'drone',
  'ai',
  'cyberpunk',
  'cinematic',
  'animated',
  'dark',
  'emotional',
  'fantasy',
  'future',
  'space',
  'war',
  'nature',
  'city',
  'cartoon',
  'stylized',
  'realistic',
  'vehicles',
  'animals',
  'magic',
  'thriller',
  'horror',
  'mystery',
];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<string>('All Categories');
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [uploadFormVisible, setUploadFormVisible] = useState(false);

  const [filmTitle, setFilmTitle] = useState('');
  const [filmCategory, setFilmCategory] = useState<string>('');
  const [filmDescription, setFilmDescription] = useState('');
  const [filmPrice, setFilmPrice] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filmFile, setFilmFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);

  const [databaseFilms, setDatabaseFilms] = useState<Film[]>([]);
  const [uploadedFilms, setUploadedFilms] = useState<Film[]>(() => {
    const saved = localStorage.getItem('uploaded_films');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    getFilmsFromDatabase().then(setDatabaseFilms).catch(console.error);
  }, []);

  const allFilms = useMemo(
    () => [...uploadedFilms, ...databaseFilms],
    [uploadedFilms, databaseFilms]
  );

  const filteredFilms = allFilms.filter((film) => {
    const matchesSearch =
      film.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      film.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      film.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === 'All Categories' ||
      film.category === selectedCategory;

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

  const handleFilmFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    setFilmFile(file);
  };

  const handlePosterFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    setPosterFile(file);
  };

  const resetForm = () => {
    setFilmTitle('');
    setFilmCategory('');
    setFilmDescription('');
    setFilmPrice('');
    setSelectedTags([]);
    setFilmFile(null);
    setPosterFile(null);
    setUploadFormVisible(false);

    if (filmFileInputRef.current) filmFileInputRef.current.value = '';
    if (posterFileInputRef.current) posterFileInputRef.current.value = '';
  };

  const handleSubmitFilm = () => {
    if (
      !filmTitle ||
      !filmCategory ||
      !filmDescription ||
      !filmPrice ||
      selectedTags.length === 0 ||
      !filmFile ||
      !posterFile
    ) {
      alert('Please fill all fields and upload both the film file and poster image.');
      return;
    }

    console.log({
      title: filmTitle,
      description: filmDescription,
      category: filmCategory,
      price: Number(filmPrice),
      tags: selectedTags,
      filmFile,
      posterFile,
    });

    const newFilm: Film = {
      id: `uploaded-${Date.now()}`,
      title: filmTitle,
      description: filmDescription,
      category: filmCategory,
      posterUrl: URL.createObjectURL(posterFile),
      videoUrl: URL.createObjectURL(filmFile),
      price: Number(filmPrice),
      duration: 'New Upload',
      releaseYear: new Date().getFullYear(),
      director: 'Uploaded by User',
      tags: selectedTags,
    };

    const updatedFilms = [newFilm, ...uploadedFilms];
    setUploadedFilms(updatedFilms);
    localStorage.setItem('uploaded_films', JSON.stringify(updatedFilms));

    resetForm();
    alert('Film submitted successfully and is waiting for admin review.');
  };

  const FilePreview = ({ file }: { file: File }) => (
    <div className="flex flex-col items-center justify-center">
      <div className="w-16 h-20 border-2 border-muted rounded-sm bg-white relative">
        <div className="absolute top-0 right-0 w-4 h-4 bg-background border-l-2 border-b-2 border-muted rotate-45 translate-x-2 -translate-y-2" />
      </div>

      <p className="text-sm mt-2 text-foreground">{file.name}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Film Marketplace
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Explore our collection of cinematic experiences
              </p>
            </div>

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

          {/* Search + Category */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search films..."
                title="Search films"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger
                className="w-full md:w-[200px]"
                title="Filter films by category"
              >
                <SelectValue placeholder="All Categories" />
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
        </div>

        {/* Upload Form */}
        {uploadFormVisible && (
          <div className="mb-10 p-8 rounded-2xl bg-card/50 border border-border/50">
            <h3 className="text-2xl font-bold mb-6">Upload Your Film</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Film Title
                </label>
                <Input
                  placeholder="Enter film title"
                  value={filmTitle}
                  onChange={(e) => setFilmTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <Select
                  value={filmCategory}
                  onValueChange={setFilmCategory}
                >
                  <SelectTrigger title="Select category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>

                  <SelectContent>
                    {FILM_CATEGORIES.filter(
                      (category) => category !== 'All Categories'
                    ).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Textarea
                  placeholder="Describe your film"
                  value={filmDescription}
                  onChange={(e) => setFilmDescription(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Tags (Select up to 3)
                </label>

                <Select
                  onValueChange={(tag) => {
                    if (
                      !selectedTags.includes(tag) &&
                      selectedTags.length < 3
                    ) {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                >
                  <SelectTrigger title="Select tags">
                    <SelectValue placeholder="Choose tags" />
                  </SelectTrigger>

                  <SelectContent>
                    {FILM_TAGS.map((tag) => (
                      <SelectItem
                        key={tag}
                        value={tag}
                        disabled={selectedTags.includes(tag)}
                      >
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm"
                    >
                      {tag}

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedTags(
                            selectedTags.filter((t) => t !== tag)
                          )
                        }
                        className="text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {selectedTags.length >= 3 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Maximum 3 tags selected
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Price
                </label>
                <Input
                  placeholder="Enter film price"
                  value={filmPrice}
                  onChange={(e) => setFilmPrice(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Film File
                </label>

                <div
                  onClick={handleFilmFileBoxClick}
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer"
                >
                  {filmFile ? (
                    <FilePreview file={filmFile} />
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto mb-4" />
                      <p>Click to upload film file</p>
                    </>
                  )}
                </div>

                <input
                  ref={filmFileInputRef}
                  type="file"
                  accept=".mp4,.mov,.avi,.webm"
                  onChange={handleFilmFileChange}
                  className="hidden"
                  title="Upload film file"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Poster Image
                </label>

                <div
                  onClick={handlePosterFileBoxClick}
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer"
                >
                  {posterFile ? (
                    <FilePreview file={posterFile} />
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto mb-4" />
                      <p>Click to upload poster image</p>
                    </>
                  )}
                </div>

                <input
                  ref={posterFileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handlePosterFileChange}
                  className="hidden"
                  title="Upload poster image"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button type="button" onClick={handleSubmitFilm}>
                Submit
              </Button>

              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Films Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFilms.map((film) => (
            <FilmCard
              key={film.id}
              film={film}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      </div>

      <FilmDetailModal
        film={selectedFilm}
        open={!!selectedFilm}
        onClose={() => setSelectedFilm(null)}
      />
    </div>
  );
}