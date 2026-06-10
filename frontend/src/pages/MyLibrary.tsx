import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Download, 
  Film as FilmIcon, 
  Box, 
  Sparkles, 
  Library, 
  Heart, 
  Clock, 
  Calendar, 
  Layers, 
  Search, 
  ChevronDown, 
  Shield, 
  User, 
  Play, 
  MoreHorizontal, 
  ExternalLink 
} from "lucide-react";
import { ROUTE_PATHS, Film, Asset } from "@/lib/index";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { Asset3DViewer } from "@/components/Asset3DViewer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFilmsFromDatabase } from "@/api/films";
import { getAssetsFromDatabase } from "@/api/assetsApi";
import { FilmDetailModal } from "@/components/FilmDetailModal";
import { AssetDetailModal } from "@/components/AssetDetailModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LibraryItem {
  id: number;
  user_id: number;
  item_id: number;
  item_type: "film" | "asset";
  title: string;
  preview_url: string;
  price: number;
  download_url?: string;
  file_url?: string;
  bucket_path?: string;
  asset_url?: string;
  film_url?: string;
}

const SUPABASE_PUBLIC_STORAGE_URL =
  "https://aqfjcdjqjxuqgyyzrvpf.supabase.co/storage/v1/object/public";

// Helper component for 3D Card Hover Tilting & Glare Reflection
function TiltCard({ children, onMouseEnter, className, ...props }: any) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    // Rotate up to 6 degrees depending on position
    const rX = -(mouseY / (height / 2)) * 6;
    const rY = (mouseX / (width / 2)) * 6;

    setRotateX(rX);
    setRotateY(rY);

    // Glare coordinates
    const gx = ((e.clientX - rect.left) / width) * 100;
    const gy = ((e.clientY - rect.top) / height) * 100;
    e.currentTarget.style.setProperty('--mouse-x', `${gx}%`);
    e.currentTarget.style.setProperty('--mouse-y', `${gy}%`);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => {
        if (onMouseEnter) onMouseEnter();
      }}
      animate={{ rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{ transformStyle: "preserve-3d" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Reusable component for Matrix decoding text reveal
function CyberDecoderText({ text, speed = 40, delay = 0 }: { text: string; speed?: number; delay?: number }) {
  const [displayText, setDisplayText] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$#@%&*{}[];:";

  useEffect(() => {
    let isMounted = true;
    const runDecoder = async () => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      
      const textArray = text.split("");
      let iterations = 0;

      const interval = setInterval(() => {
        if (!isMounted) {
          clearInterval(interval);
          return;
        }

        const nextText = textArray
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iterations) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");

        setDisplayText(nextText);

        if (iterations >= text.length) {
          clearInterval(interval);
          setDisplayText(text);
        }

        iterations += 1 / 3;
      }, speed);
    };

    runDecoder();

    return () => {
      isMounted = false;
    };
  }, [text, speed, delay]);

  return <span>{displayText}</span>;
}

export default function MyLibrary() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { isFilmFavorite, isAssetFavorite, toggleFilmFavorite, toggleAssetFavorite } = useFavorites();

  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dynamic lookup arrays
  const [filmsList, setFilmsList] = useState<Film[]>([]);
  const [assetsList, setAssetsList] = useState<Asset[]>([]);

  // Filtering & Sorting states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "film" | "asset" | "favorites">("all");
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "title">("latest");

  // Detail Modal states
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Download simulation states
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      navigate(ROUTE_PATHS.SIGNIN);
      return;
    }

    // Load dynamic list for details resolution
    getFilmsFromDatabase().then(setFilmsList).catch(console.error);
    getAssetsFromDatabase().then(setAssetsList).catch(console.error);

    fetch(`http://localhost:8000/library/${user.id}?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        setLibraryItems(data.library || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load library", error);
        setLoading(false);
      });
  }, [isAuthenticated, user?.id, navigate]);

  const getDownloadUrl = (item: LibraryItem) => {
    return (
      item.download_url ||
      item.file_url ||
      item.bucket_path ||
      item.asset_url ||
      item.film_url ||
      ""
    );
  };

  const getFullStorageUrl = (url: string) => {
    if (!url) return "";

    if (url.startsWith("http")) {
      return url;
    }

    if (url.startsWith("films/")) {
      return `${SUPABASE_PUBLIC_STORAGE_URL}/films_private/${url}`;
    }

    if (
      url.endsWith(".glb") ||
      url.endsWith(".gltf") ||
      url.endsWith(".fbx") ||
      url.endsWith(".obj") ||
      url.endsWith(".stl")
    ) {
      return `${SUPABASE_PUBLIC_STORAGE_URL}/assets_previwe/${url}`;
    }

    return `${SUPABASE_PUBLIC_STORAGE_URL}/${url}`;
  };

  const getFileExtension = (url: string) => {
    const cleanUrl = url.split("?")[0];
    const parts = cleanUrl.split(".");
    return parts.length > 1 ? parts.pop() || "file" : "file";
  };

  const simulateProgress = (id: number) => {
    setDownloadProgress((prev) => ({ ...prev, [id]: 0 }));
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        const current = prev[id] ?? 0;
        if (current >= 100) {
          clearInterval(interval);
          return prev;
        }
        const step = Math.floor(Math.random() * 12) + 5;
        return { ...prev, [id]: Math.min(current + step, 100) };
      });
    }, 100);
    return interval;
  };

  const handleDownload = async (item: LibraryItem) => {
    const downloadUrl = getDownloadUrl(item);

    if (!downloadUrl) {
      alert("No downloadable file available for this item.");
      return;
    }

    const fullUrl = getFullStorageUrl(downloadUrl);
    setDownloadingId(item.id);
    const progressInterval = simulateProgress(item.id);

    try {
      const response = await fetch(fullUrl);

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const extension = getFileExtension(fullUrl);
      const fileName = `${item.title}.${extension}`;

      await new Promise((resolve) => setTimeout(resolve, 800));

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download file:", error);
      alert("Failed to download file.");
    } finally {
      clearInterval(progressInterval);
      setDownloadProgress((prev) => {
        const updated = { ...prev };
        delete updated[item.id];
        return updated;
      });
      setDownloadingId(null);
    }
  };

  const getModelType = (url: string) => {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.endsWith(".glb")) return "glb";
    if (lowerUrl.endsWith(".gltf")) return "gltf";
    if (lowerUrl.endsWith(".fbx")) return "fbx";
    if (lowerUrl.endsWith(".obj")) return "obj";
    if (lowerUrl.endsWith(".stl")) return "stl";

    return "glb";
  };

  const isImageUrl = (url: string) => {
    const lowerUrl = url.toLowerCase();

    return (
      lowerUrl.includes(".jpg") ||
      lowerUrl.includes(".jpeg") ||
      lowerUrl.includes(".png") ||
      lowerUrl.includes(".webp")
    );
  };

  // Filter items in memory
  const filteredItems = libraryItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesType = false;
    if (selectedFilter === "all") {
      matchesType = true;
    } else if (selectedFilter === "film") {
      matchesType = item.item_type === "film";
    } else if (selectedFilter === "asset") {
      matchesType = item.item_type === "asset";
    } else if (selectedFilter === "favorites") {
      matchesType = item.item_type === "film"
        ? isFilmFavorite(item.item_id)
        : isAssetFavorite(item.item_id);
    }

    return matchesSearch && matchesType;
  });

  // Sort filtered items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    } else if (sortBy === "oldest") {
      return a.id - b.id;
    } else {
      return b.id - a.id; // Latest default
    }
  });

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-transparent">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin" />
        </div>
        <p className="mt-6 text-sm font-mono text-cyan-400 tracking-widest animate-pulse uppercase">
          Accessing Digital Vault...
        </p>
      </div>
    );
  }

  const filmsCount = libraryItems.filter((i) => i.item_type === "film").length;
  const assetsCount = libraryItems.filter((i) => i.item_type === "asset").length;

  return (
    <div className="min-h-screen bg-transparent text-foreground relative py-12 px-4 md:px-8 overflow-hidden">
      {/* ─── Ambient Backdrop Glows ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-cyan-500/5 blur-[120px] animate-float-blob-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-purple-500/5 blur-[120px] animate-float-blob-2" />
      </div>

      <div className="container mx-auto relative z-10 space-y-12">
        
        {/* ─── REDESIGNED TOP HERO SECTION: TWO COLUMN LAYOUT ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center border-b border-cyan-500/10 pb-12">
          
          {/* Left Column: Title & Metrics */}
          <div className="lg:col-span-2 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20">
              <Library className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase font-mono">
                <CyberDecoderText text="Secure acquired assets" delay={200} />
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-black text-white font-orbitron tracking-tight">
                My Library 🎬
              </h1>
              <p className="text-gray-400 text-sm md:text-base font-light max-w-xl">
                Your personal collection of AI films and 3D assets
              </p>
            </div>

            {/* Metrics Widgets */}
            <div className="grid grid-cols-3 gap-4 md:gap-6 pt-4">
              {/* Metric 1: Films */}
              <div className="bg-[#060b16]/75 backdrop-blur-xl border border-cyan-500/12 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all duration-300 relative overflow-hidden group">
                <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-cyan-500/10 border border-cyan-400/20 group-hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
                  <FilmIcon className="w-5 h-5 text-cyan-400 relative z-10" />
                </div>
                <div className="space-y-0.5">
                  <span className="block text-2xl font-black text-white font-mono leading-none">
                    {filmsCount}
                  </span>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                    Films
                  </span>
                  <span className="block text-[9px] text-cyan-400/70 font-mono">
                    items
                  </span>
                </div>
              </div>

              {/* Metric 2: Assets */}
              <div className="bg-[#060b16]/75 backdrop-blur-xl border border-cyan-500/12 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all duration-300 relative overflow-hidden group">
                <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-cyan-500/10 border border-cyan-400/20 group-hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
                  <Box className="w-5 h-5 text-cyan-400 relative z-10" />
                </div>
                <div className="space-y-0.5">
                  <span className="block text-2xl font-black text-white font-mono leading-none">
                    {assetsCount}
                  </span>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                    Assets
                  </span>
                  <span className="block text-[9px] text-cyan-400/70 font-mono">
                    items
                  </span>
                </div>
              </div>

              {/* Metric 3: Total */}
              <div className="bg-[#060b16]/75 backdrop-blur-xl border border-cyan-500/12 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all duration-300 relative overflow-hidden group">
                <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-cyan-500/10 border border-cyan-400/20 group-hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
                  <Layers className="w-5 h-5 text-cyan-400 relative z-10" />
                </div>
                <div className="space-y-0.5">
                  <span className="block text-2xl font-black text-white font-mono leading-none">
                    {libraryItems.length}
                  </span>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                    Total
                  </span>
                  <span className="block text-[9px] text-cyan-400/70 font-mono">
                    items
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Holographic Folder Illustration */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center relative min-h-[200px]">
            {/* Pedestal Structure Base */}
            <div className="absolute bottom-[10%] w-48 h-4 bg-transparent border-t border-b border-cyan-500/20 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-36 h-2 border border-cyan-400/30 rounded-full animate-pulse" />
            </div>

            {/* Glowing pedestal base circle */}
            <div 
              className="absolute bottom-[5%] w-56 h-8 rounded-full pointer-events-none opacity-40 animate-pulse"
              style={{
                background: "radial-gradient(ellipse at center, rgba(34, 211, 238, 0.4) 0%, transparent 70%)"
              }}
            />

            {/* Futuristic floating container */}
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotateZ: [0, 1.5, 0]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="relative z-10 w-56 h-56 select-none flex items-center justify-center"
            >
              <img 
                src="/library_hologram.png" 
                alt="Vault Hologram" 
                className="w-full h-full object-contain filter drop-shadow-[0_0_25px_rgba(34,211,238,0.45)]"
                style={{
                  mixBlendMode: "screen",
                  maskImage: "radial-gradient(circle, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 80%)",
                  WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 80%)"
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* ─── REDESIGNED BODY SPLIT LAYOUT ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Vault Content Grid (3/4 Width) */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Search and Filters Controls telemetry panel */}
            {libraryItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#060b16]/40 p-3 rounded-2xl border border-cyan-500/10 backdrop-blur-md"
              >
                {/* Filter Tabs */}
                <div className="flex bg-[#03050a]/65 p-1 rounded-xl border border-cyan-500/10 gap-0.5 w-full md:w-auto overflow-x-auto">
                  {(["all", "film", "asset", "favorites"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedFilter(type)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all duration-200 cursor-none ${
                        selectedFilter === type
                          ? "bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {type === "all" ? "All" : type === "film" ? "Films" : type === "asset" ? "Assets" : "Favorites"}
                    </button>
                  ))}
                </div>

                {/* Search & Sort Panel */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {/* Search Input */}
                  <div className="relative flex-1 md:w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search in your library..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-[#03050a]/75 border border-cyan-500/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 transition-all cursor-none"
                    />
                  </div>

                  {/* Sort Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 border border-cyan-500/10 bg-[#03050a]/75 hover:bg-cyan-500/5 text-gray-400 hover:text-white text-[10px] font-mono uppercase tracking-wider px-3 rounded-xl gap-1.5 cursor-none">
                        <span>{sortBy}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#080c14] border border-cyan-500/15 text-white">
                      <DropdownMenuItem onClick={() => setSortBy("latest")} className="text-xs hover:bg-cyan-500/10 cursor-pointer">Latest</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("oldest")} className="text-xs hover:bg-cyan-500/10 cursor-pointer">Oldest</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("title")} className="text-xs hover:bg-cyan-500/10 cursor-pointer">Title</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            )}

            {/* Vault Grid */}
            {libraryItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto text-center p-8 rounded-2xl border border-cyan-500/15 bg-[#080c14]/40 backdrop-blur-md shadow-2xl mt-10"
              >
                <Library className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Vault is Empty</h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  You haven't acquired any cinematic experiences or 3D assets yet.
                </p>
                <button
                  onClick={() => navigate(ROUTE_PATHS.FILMS)}
                  className="px-5 py-2.5 rounded-lg bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider hover:scale-105 transition-transform duration-200 cursor-none"
                >
                  Browse Marketplace
                </button>
              </motion.div>
            ) : sortedItems.length === 0 ? (
              <div className="text-center py-16 bg-[#060b16]/10 rounded-2xl border border-dashed border-cyan-500/10">
                <p className="text-gray-500 font-mono text-xs">No matching telemetry found in vault.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedItems.map((item) => {
                  const modelPath =
                    item.bucket_path || item.download_url || item.file_url || item.asset_url || "";
                  const modelUrl = getFullStorageUrl(modelPath);

                  // Dynamic Info Resolution
                  const filmDetails = item.item_type === "film" ? filmsList.find(f => f.id === item.item_id) : null;
                  const assetDetails = item.item_type === "asset" ? assetsList.find(a => a.id === item.item_id) : null;

                  const genreSubtitle = filmDetails 
                    ? (filmDetails.category + (filmDetails.tags?.length ? `, ${filmDetails.tags[0]}` : ""))
                    : assetDetails 
                      ? assetDetails.category
                      : "Sci-Fi, Adventure";

                  const durationText = filmDetails?.duration || "2h 18m";
                  const assetType = assetDetails?.type || "3D Model";
                  
                  // Consistent simulated acquired dates
                  const acquiredDate = `May ${1 + (item.id % 28)}, 2026`;
                  const isFav = item.item_type === "film" ? isFilmFavorite(item.item_id) : isAssetFavorite(item.item_id);

                  return (
                    <TiltCard
                      key={item.id}
                      className="group relative h-full flex flex-col cursor-none"
                    >
                      {/* Cyber Glow Backdrop Shadow */}
                      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-purple-600/5 to-blue-500/15 blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

                      {/* Premium Glassmorphic Card */}
                      <Card className="relative overflow-hidden rounded-2xl bg-[#080c14]/90 backdrop-blur-xl border border-cyan-500/15 group-hover:border-cyan-400/40 transition-all duration-500 shadow-[0_15px_40px_rgba(0,0,0,0.8)] h-full flex flex-col justify-between cursor-none cyber-glow-border glass-glare-card">
                        
                        {/* Border Glint highlight */}
                        <div className="absolute inset-0 z-30 pointer-events-none rounded-2xl border border-white/5" />

                        {/* Media Container */}
                        <div className="relative aspect-video sm:aspect-square overflow-hidden bg-[#03050a]/90 border-b border-white/5">
                          <div className="absolute inset-0 bg-gradient-to-t from-[#020306] via-[#020306]/20 to-transparent z-10 pointer-events-none" />
                          <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#020306]/85 opacity-65 z-10 pointer-events-none" />

                          {item.item_type === "asset" && modelUrl ? (
                            <Asset3DViewer
                              modelUrl={modelUrl}
                              modelType={getModelType(modelPath)}
                              viewMode="card"
                              className="w-full h-full transform transition-transform duration-700 ease-out group-hover:scale-108 z-0"
                            />
                          ) : isImageUrl(item.preview_url) ? (
                            <img
                              src={item.preview_url}
                              alt={item.title}
                              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                              No preview image
                            </div>
                          )}

                          {/* Category Badge */}
                          <div className="absolute bottom-3 left-3 z-20">
                            <Badge className={`backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest border border-white/5 ${
                              item.item_type === "film"
                                ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/20"
                                : "bg-purple-950/80 text-purple-300 border-purple-500/20"
                            }`}>
                              {item.item_type}
                            </Badge>
                          </div>

                          {/* Favorite Heart Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.item_type === "film") {
                                toggleFilmFavorite(item.item_id);
                              } else {
                                toggleAssetFavorite(item.item_id);
                              }
                            }}
                            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-[#080c14]/90 backdrop-blur-md border border-white/5 hover:border-cyan-400/40 hover:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all duration-300"
                          >
                            <Heart className={`w-3.5 h-3.5 transition-colors ${
                              isFav ? "fill-cyan-400 text-cyan-400" : "text-gray-400 hover:text-cyan-300"
                            }`} />
                          </button>
                        </div>

                        {/* Details / Actions Panel */}
                        <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                          <div className="space-y-1">
                            <h3 className="text-base font-bold text-white tracking-tight line-clamp-1 group-hover:text-cyan-300 transition-colors duration-300">
                              {item.title}
                            </h3>
                            <p className="text-[11px] font-medium text-gray-500 font-sans">
                              {genreSubtitle}
                            </p>
                          </div>

                          {/* Meta properties details rows */}
                          <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 border-t border-white/5 pt-3">
                            {item.item_type === "film" ? (
                              <>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-cyan-400/80" />
                                  {durationText}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-purple-400/80" />
                                  {acquiredDate}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="flex items-center gap-1.5">
                                  <Box className="w-3.5 h-3.5 text-purple-400/80" />
                                  {assetType}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-cyan-400/80" />
                                  {acquiredDate}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Watch / Download actions panel */}
                          <div className="flex items-center gap-2 pt-1">
                            {downloadingId === item.id ? (
                              <div className="flex-1 space-y-1.5 py-1">
                                <div className="flex justify-between text-[9px] font-mono text-cyan-400">
                                  <span>SYS.RX_DATA</span>
                                  <span>{downloadProgress[item.id] || 0}%</span>
                                </div>
                                <div className="w-full h-1 rounded-full bg-cyan-950/50 border border-cyan-400/10 overflow-hidden">
                                  <motion.div
                                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_6px_rgba(0,240,255,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${downloadProgress[item.id] || 0}%` }}
                                    transition={{ duration: 0.1 }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(item);
                                  }}
                                  className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs uppercase tracking-wider h-10 transition-all duration-300 rounded-xl cursor-none shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:shadow-[0_0_20px_rgba(0,240,255,0.45)] border-none"
                                >
                                  <Download className="w-3.5 h-3.5 mr-2" />
                                  Download
                                </Button>

                                {/* Options dot dropdown */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-10 w-10 p-0 border border-white/5 bg-[#080c14]/90 hover:bg-cyan-500/10 hover:border-cyan-400/30 text-gray-400 hover:text-white rounded-xl cursor-none">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-[#080c14]/95 border border-cyan-500/15 text-white">
                                    <DropdownMenuItem onClick={() => {
                                      if (item.item_type === "film" && filmDetails) setSelectedFilm(filmDetails);
                                      if (item.item_type === "asset" && assetDetails) setSelectedAsset(assetDetails);
                                    }} className="text-xs hover:bg-cyan-500/10 cursor-pointer">
                                      View details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownload(item)} className="text-xs hover:bg-cyan-500/10 cursor-pointer">
                                      Force Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs hover:bg-cyan-500/10 cursor-pointer">
                                      License Info
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    </TiltCard>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar Widget Column (1/4 Width) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Library Status Telemetry Card */}
            <div className="bg-[#060b16]/75 backdrop-blur-xl border border-cyan-500/15 rounded-2xl p-6 text-left relative overflow-hidden group hover:border-cyan-400/40 transition-all duration-300">
              <div className="absolute top-[-50%] right-[-50%] w-60 h-60 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.02),transparent_65%)] pointer-events-none" />
              
              <h3 className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase font-orbitron mb-5 pb-2 border-b border-cyan-500/10">
                Library Status
              </h3>

              <div className="space-y-4">
                {/* Films Row */}
                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                  <span className="text-gray-400 font-sans flex items-center gap-2">
                    <FilmIcon className="w-3.5 h-3.5 text-cyan-500/60" />
                    Films Collected
                  </span>
                  <span className="text-white font-mono font-bold">{filmsCount}</span>
                </div>

                {/* Assets Row */}
                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                  <span className="text-gray-400 font-sans flex items-center gap-2">
                    <Box className="w-3.5 h-3.5 text-cyan-500/60" />
                    Assets Collected
                  </span>
                  <span className="text-white font-mono font-bold">{assetsCount}</span>
                </div>

                {/* Total Row */}
                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                  <span className="text-gray-400 font-sans flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-cyan-500/60" />
                    Total Items
                  </span>
                  <span className="text-white font-mono font-bold">{libraryItems.length}</span>
                </div>

                {/* Status Row */}
                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                  <span className="text-gray-400 font-sans flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-cyan-500/60" />
                    Storage Access
                  </span>
                  <span className="text-green-400 font-mono font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                    Active
                  </span>
                </div>

                {/* Date Row */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-sans flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-cyan-500/60" />
                    Member Since
                  </span>
                  <span className="text-white font-mono font-bold">May 2026</span>
                </div>
              </div>
            </div>

            {/* Explore More Promo Card */}
            <div className="bg-[#060b16]/75 backdrop-blur-xl border border-cyan-500/15 rounded-2xl p-6 text-left relative overflow-hidden group hover:border-cyan-400/40 transition-all duration-300">
              <div className="absolute top-[-50%] right-[-50%] w-60 h-60 rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.02),transparent_65%)] pointer-events-none" />
              
              <h3 className="text-xs font-bold text-white tracking-wide mb-3 font-orbitron">
                Explore More
              </h3>
              
              <p className="text-[11px] text-gray-400 leading-relaxed mb-6 font-sans">
                Discover new AI films and 3D assets to expand your collection.
              </p>

              <Button
                onClick={() => navigate(ROUTE_PATHS.FILMS)}
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs uppercase tracking-wider h-10 transition-all duration-300 rounded-xl cursor-none shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:shadow-[0_0_20px_rgba(0,240,255,0.45)] border-none"
              >
                Browse Now
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modals */}
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