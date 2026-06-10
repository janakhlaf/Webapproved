import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Film, Box, Sparkles, Library } from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import { useAuth } from "@/hooks/useAuth";
import { Asset3DViewer } from "@/components/Asset3DViewer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "film" | "asset">("all");

  // Download simulation states
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      navigate(ROUTE_PATHS.SIGNIN);
      return;
    }

    fetch(`http://localhost:8000/library/${user.id}?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Library data:", data.library);
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
        // Increments with random step for realistic telemetry download
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

      // Brief delay to let user see progress complete for premium interface feedback
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
    const matchesType = selectedFilter === "all" || item.item_type === selectedFilter;
    return matchesSearch && matchesType;
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

      <div className="container mx-auto relative z-10">
        {/* ─── Animated Hero Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20 mb-6">
            <Library className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400 tracking-wider uppercase font-mono">
              <CyberDecoderText text="Secure Digital Vault" delay={200} />
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-foreground via-cyan-400 to-purple-400 bg-clip-text text-transparent font-orbitron uppercase tracking-normal">
            <CyberDecoderText text="My Digital Library" speed={30} />
          </h1>

          <p className="text-base md:text-lg text-gray-400 max-w-xl mx-auto mb-8 font-sans font-light">
            Access, explore, and download your acquired high-fidelity 3D assets and immersive cinematic experiences.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto p-4 rounded-xl border border-cyan-500/15 bg-[#080c14]/40 backdrop-blur-md shadow-lg">
            <div className="text-center">
              <span className="block text-2xl font-black text-cyan-400 font-mono">
                {libraryItems.length}
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
                Total Items
              </span>
            </div>
            <div className="text-center border-x border-white/5">
              <span className="block text-2xl font-black text-purple-400 font-mono">
                {filmsCount}
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
                Films
              </span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-black text-blue-400 font-mono">
                {assetsCount}
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
                3D Assets
              </span>
            </div>
          </div>
        </motion.div>

        {/* ─── Search and Filters Telemetry ─── */}
        {libraryItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col md:flex-row gap-4 mb-10 max-w-4xl mx-auto"
          >
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search acquired vault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-5 pr-4 py-2.5 rounded-xl bg-[#060b16]/90 backdrop-blur-xl border border-cyan-400/25 shadow-[0_0_18px_rgba(0,240,255,0.09),inset_0_0_10px_rgba(0,240,255,0.025)] text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/60 transition-all cursor-none"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-[#060b16]/90 backdrop-blur-xl p-1.5 rounded-xl border border-cyan-400/25 gap-1 shadow-[0_0_18px_rgba(0,240,255,0.09)]">
              {(["all", "film", "asset"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedFilter(type);
                  }}
                  className={`px-5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-none ${
                    selectedFilter === type
                      ? "bg-cyan-500 text-black font-bold shadow-[0_0_12px_rgba(0,255,255,0.35)]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {type === "all" ? "All Vault" : type === "film" ? "Films" : "3D Assets"}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── Library Items Grid ─── */}
        {libraryItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto text-center p-10 rounded-2xl border border-cyan-500/15 bg-[#080c14]/60 backdrop-blur-md shadow-2xl mt-12"
          >
            <Library className="w-12 h-12 text-gray-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-bold text-white mb-2">Vault is Empty</h3>
            <p className="text-sm text-gray-400 mb-6">
              You haven't purchased any cinematic experiences or 3D assets yet.
            </p>
            <button
              onClick={() => {
                navigate(ROUTE_PATHS.FILMS);
              }}
              className="px-6 py-2.5 rounded-lg bg-cyan-400 text-black font-semibold shadow-lg shadow-cyan-500/20 hover:scale-105 transition duration-300 cursor-none"
            >
              Browse Marketplace
            </button>
          </motion.div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-mono text-sm">No items matching search filter found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredItems.map((item, index) => {
              const modelPath =
                item.bucket_path || item.download_url || item.file_url || item.asset_url || "";
              const modelUrl = getFullStorageUrl(modelPath);

              return (
                <TiltCard
                  key={item.id}
                  className="group relative h-full flex flex-col cursor-none"
                >
                  {/* Cyber Glow Backdrop Shadow */}
                  <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-purple-600/10 to-blue-500/15 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

                  {/* Premium Glassmorphic Card */}
                  <Card className="relative overflow-hidden rounded-2xl bg-[#080c14]/90 backdrop-blur-xl border border-cyan-500/15 group-hover:border-cyan-400/50 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.85)] h-full flex flex-col justify-between cursor-none cyber-glow-border glass-glare-card">
                    {/* Border Glint highlight */}
                    <div className="absolute inset-0 z-30 pointer-events-none rounded-2xl border border-white/5" />

                    {/* Media Container */}
                    <div className="relative aspect-square overflow-hidden bg-[#03050a]/90 border-b border-white/5">
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
                          onError={(e) => {
                            console.log("IMAGE FAILED:", item.title);
                            console.log(item.preview_url);
                            e.currentTarget.style.display = "none";
                          }}
                          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                          No preview image
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-4 left-4 z-20">
                        <Badge className="bg-cyan-950/90 text-cyan-300 border border-cyan-400/35 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5">
                          {item.item_type === "film" ? (
                            <Film className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <Box className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                          {item.item_type}
                        </Badge>
                      </div>
                    </div>

                    {/* Details / Actions Panel */}
                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4 bg-gradient-to-b from-transparent to-[#03050a]/40 relative z-10">
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-bold text-white tracking-tight line-clamp-1 group-hover:text-cyan-300 transition-colors duration-300 font-sans">
                          {item.title}
                        </h3>
                        <p className="text-xs font-mono text-cyan-400/90 font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          Acquired • ${item.price}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/5">
                        {downloadingId === item.id ? (
                          /* Simulated Telemetry Progress Bar */
                          <div className="space-y-2 py-1">
                            <div className="flex justify-between text-[10px] font-mono text-cyan-400">
                              <span>SYS.RX_DATA</span>
                              <span>{downloadProgress[item.id] || 0}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-cyan-950/50 border border-cyan-400/20 overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_8px_rgba(0,240,255,0.6)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${downloadProgress[item.id] || 0}%` }}
                                transition={{ duration: 0.1 }}
                              />
                            </div>
                            <div className="text-[9px] font-mono text-gray-500 text-center animate-pulse">
                              ESTABLISHING QUANTUM LINK...
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(item);
                            }}
                            className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/30 transition-all duration-300 cursor-none"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download File
                          </Button>
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
    </div>
  );
}