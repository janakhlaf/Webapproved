import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Download,
  Film,
  Box,
  Sparkles,
  Library,
  Layers,
  Clock,
  Calendar,
  Search,
  ChevronDown,
  ShieldCheck,
  User,
  ExternalLink,
  Heart,
} from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import type { Film as DBFilm, Asset as DBAsset } from "@/lib/index";
import { useAuth } from "@/hooks/useAuth";
import { Asset3DViewer } from "@/components/Asset3DViewer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFilmsFromDatabase } from "@/api/films";
import { getAssetsFromDatabase } from "@/api/assetsApi";

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

// Helper component for professional tech clapperboard
function TechClapperboard() {
  return (
    <svg
      className="w-10 h-10 md:w-12 md:h-12 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 11h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8Z" />
      <path d="M4 11V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
      <path d="M9 5v6" />
      <path d="M15 5v6" />
      <path d="M12 5v6" strokeDasharray="3 3" />
      <polygon points="10 14 15 17 10 20 10 14" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

// Helper component for radar target crosshair icon
function RadarCrosshair() {
  return (
    <svg
      className="w-10 h-10 text-cyan-400/80 animate-pulse drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]"
      viewBox="0 0 100 100"
      fill="none"
    >
      <circle
        cx="50"
        cy="50"
        r="30"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6,4"
      />
      <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="3" fill="currentColor" />
      <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// Helper component for animated 3D Hologram Folder
function FolderHologram() {
  return (
    <div className="relative w-full max-w-[340px] aspect-square mx-auto lg:mx-0 flex items-center justify-center pointer-events-none select-none">
      {/* Back glow */}
      <div className="absolute w-[240px] h-[240px] rounded-full bg-cyan-500/10 blur-[80px] animate-pulse" />
      
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full drop-shadow-[0_0_30px_rgba(34,211,238,0.55)]"
      >
        <defs>
          <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#22d3ee" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#0891b2" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="beamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />
          </linearGradient>
          <filter id="hyperGlow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Holo projection beam */}
        <polygon
          points="110,290 290,290 350,100 50,100"
          fill="url(#beamGrad)"
          opacity="0.16"
        />

        {/* Outer Telemetry Circle (Dotted) */}
        <ellipse
          cx="200"
          cy="290"
          rx="130"
          ry="34"
          fill="none"
          stroke="#0891b2"
          strokeWidth="1"
          strokeDasharray="4,8"
          opacity="0.35"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 200 290"
            to="360 200 290"
            dur="40s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* Base Ring 1 */}
        <ellipse
          cx="200"
          cy="290"
          rx="110"
          ry="28"
          fill="none"
          stroke="#00f0ff"
          strokeWidth="1.2"
          strokeDasharray="40,10"
          opacity="0.5"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 200 290"
            to="0 200 290"
            dur="18s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* Base Ring 2 (Inner Solid Pulsing) */}
        <ellipse
          cx="200"
          cy="290"
          rx="80"
          ry="20"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          opacity="0.8"
          filter="url(#hyperGlow)"
        >
          <animate
            attributeName="rx"
            values="80;85;80"
            dur="4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="ry"
            values="20;22;20"
            dur="4s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* Telemetry crosshair grid lines */}
        <line x1="80" y1="290" x2="320" y2="290" stroke="#00f0ff" strokeWidth="0.5" opacity="0.25" />
        <line x1="200" y1="260" x2="200" y2="320" stroke="#00f0ff" strokeWidth="0.5" opacity="0.25" />

        {/* Floating Digital particles stream */}
        <circle cx="150" cy="240" r="1.5" fill="#22d3ee" opacity="0.8">
          <animate attributeName="cy" values="240;80" dur="3.8s" repeatCount="indefinite" />
          <animate attributeName="cx" values="150;130;150" dur="3.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0" dur="3.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="250" cy="210" r="2" fill="#22d3ee" opacity="0.6">
          <animate attributeName="cy" values="210;70" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="cx" values="250;270;250" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0" dur="2.8s" repeatCount="indefinite" />
        </circle>

        {/* Binary Floating rain */}
        <text x="135" y="170" fill="#00f0ff" fontSize="10" fontFamily="monospace" opacity="0.7">
          1
          <animate attributeName="y" values="170;50" dur="4.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0" dur="4.2s" repeatCount="indefinite" />
        </text>
        <text x="260" y="140" fill="#00f0ff" fontSize="10" fontFamily="monospace" opacity="0.5">
          0
          <animate attributeName="y" values="140;40" dur="3.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0" dur="3.5s" repeatCount="indefinite" />
        </text>
        <text x="210" y="220" fill="#00f0ff" fontSize="11" fontFamily="monospace" opacity="0.8">
          1
          <animate attributeName="y" values="220;80" dur="4.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0" dur="4.5s" repeatCount="indefinite" />
        </text>

        {/* Orbiting 3D Hologram Rings */}
        <g filter="url(#hyperGlow)">
          {/* Tilted Ring 1 */}
          <ellipse
            cx="200"
            cy="175"
            rx="75"
            ry="25"
            fill="none"
            stroke="url(#orbitGrad)"
            strokeWidth="1.5"
            transform="rotate(-25, 200, 175)"
            opacity="0.75"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-25 200 175; 335 200 175"
              dur="12s"
              repeatCount="indefinite"
            />
          </ellipse>

          {/* Tilted Ring 2 */}
          <ellipse
            cx="200"
            cy="175"
            rx="65"
            ry="20"
            fill="none"
            stroke="url(#orbitGrad)"
            strokeWidth="1"
            transform="rotate(35, 200, 175)"
            opacity="0.6"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="35 200 175; -325 200 175"
              dur="15s"
              repeatCount="indefinite"
            />
          </ellipse>
        </g>

        {/* Holographic Voxel Vault Core (Isometric Rotating 3D Cube Cluster) */}
        <g filter="url(#hyperGlow)">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-8; 0,0"
            dur="4s"
            repeatCount="indefinite"
          />
          
          {/* Central Cube (Main Core) */}
          <g transform="translate(165, 140)">
            {/* Top Face */}
            <path d="M35 0 L70 17.5 L35 35 L0 17.5 Z" fill="#ffffff" opacity="0.9" />
            {/* Left Face */}
            <path d="M0 17.5 L35 35 L35 70 L0 52.5 Z" fill="#0891b2" opacity="0.8" />
            {/* Right Face */}
            <path d="M35 35 L70 17.5 L70 52.5 L35 70 Z" fill="#0e7490" opacity="0.85" />
            
            {/* Glow Core Outlines */}
            <path d="M35 0 L70 17.5 L35 35 L0 17.5 Z M0 17.5 L35 35 L35 70 L0 52.5 Z M35 35 L70 17.5 L70 52.5 L35 70 Z" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
          </g>

          {/* Floating Voxel Blocks (representing digital modules/data chunks) */}
          {/* Voxel 1 (Floating Left) */}
          <g transform="translate(130, 130)">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="130,130; 125,120; 130,130"
              dur="3s"
              repeatCount="indefinite"
            />
            <path d="M15 0 L30 7.5 L15 15 L0 7.5 Z" fill="#22d3ee" opacity="0.85" />
            <path d="M0 7.5 L15 15 L15 30 L0 22.5 Z" fill="#0891b2" opacity="0.75" />
            <path d="M15 15 L30 7.5 L30 22.5 L15 30 Z" fill="#0e7490" opacity="0.8" />
            <path d="M15 0 L30 7.5 L15 15 L0 7.5 Z M0 7.5 L15 15 L15 30 L0 22.5 Z M15 15 L30 7.5 L30 22.5 L15 30 Z" fill="none" stroke="#22d3ee" strokeWidth="1" />
          </g>

          {/* Voxel 2 (Floating Right) */}
          <g transform="translate(235, 165)">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="235,165; 240,175; 235,165"
              dur="3.5s"
              repeatCount="indefinite"
            />
            <path d="M15 0 L30 7.5 L15 15 L0 7.5 Z" fill="#22d3ee" opacity="0.85" />
            <path d="M0 7.5 L15 15 L15 30 L0 22.5 Z" fill="#0891b2" opacity="0.75" />
            <path d="M15 15 L30 7.5 L30 22.5 L15 30 Z" fill="#0e7490" opacity="0.8" />
            <path d="M15 0 L30 7.5 L15 15 L0 7.5 Z M0 7.5 L15 15 L15 30 L0 22.5 Z M15 15 L30 7.5 L30 22.5 L15 30 Z" fill="none" stroke="#22d3ee" strokeWidth="1" />
          </g>

          {/* Voxel 3 (Floating Above) */}
          <g transform="translate(185, 95)">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="185,95; 185,85; 185,95"
              dur="2.5s"
              repeatCount="indefinite"
            />
            <path d="M15 0 L30 7.5 L15 15 L0 7.5 Z" fill="#ffffff" opacity="0.9" />
            <path d="M0 7.5 L15 15 L15 30 L0 22.5 Z" fill="#0891b2" opacity="0.75" />
            <path d="M15 15 L30 7.5 L30 22.5 L15 30 Z" fill="#0e7490" opacity="0.8" />
            <path d="M15 0 L30 7.5 L15 15 L0 7.5 Z M0 7.5 L15 15 L15 30 L0 22.5 Z M15 15 L30 7.5 L30 22.5 L15 30 Z" fill="none" stroke="#22d3ee" strokeWidth="1" />
          </g>
        </g>

        {/* Telemetry data HUD tags */}
        <g opacity="0.65" fontFamily="monospace" fontSize="8" fill="#22d3ee">
          {/* Tag Left */}
          <line x1="100" y1="150" x2="60" y2="150" stroke="#00f0ff" strokeWidth="0.8" />
          <line x1="60" y1="150" x2="50" y2="160" stroke="#00f0ff" strokeWidth="0.8" />
          <text x="40" y="145" textAnchor="middle">VAULT: SECURE</text>
          
          {/* Tag Right */}
          <line x1="300" y1="190" x2="340" y2="190" stroke="#00f0ff" strokeWidth="0.8" />
          <line x1="340" y1="190" x2="350" y2="180" stroke="#00f0ff" strokeWidth="0.8" />
          <text x="350" y="198" textAnchor="middle">CORE: ALPHA-01</text>
        </g>
      </svg>
    </div>
  );
}

// Helper component for animated Robot Mascot
function WavingRobotMascot() {
  return (
    <div className="absolute bottom-[-15px] right-[-15px] w-24 h-24 select-none pointer-events-none z-0">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]">
        {/* Head */}
        <rect x="25" y="20" width="50" height="40" rx="14" fill="#080c14" stroke="#22d3ee" strokeWidth="2" />
        
        {/* Ears */}
        <circle cx="20" cy="40" r="4" fill="#22d3ee" />
        <circle cx="80" cy="40" r="4" fill="#22d3ee" />
        <path d="M 50 20 L 50 10" stroke="#22d3ee" strokeWidth="2" />
        <circle cx="50" cy="7" r="2.5" fill="#22d3ee" />

        {/* Screen */}
        <rect x="32" y="27" width="36" height="26" rx="7" fill="#020306" stroke="#0891b2" strokeWidth="1" />
        
        {/* Eyes */}
        <rect x="39" y="34" width="7" height="4" rx="2" fill="#22d3ee" />
        <rect x="54" y="34" width="7" height="4" rx="2" fill="#22d3ee" />
        
        {/* Smile */}
        <path d="M 46 44 Q 50 48 54 44" stroke="#22d3ee" strokeWidth="1.5" fill="none" />

        {/* Body */}
        <path d="M 35 60 L 65 60 L 60 85 L 40 85 Z" fill="#080c14" stroke="#22d3ee" strokeWidth="2" />
        <circle cx="50" cy="70" r="5" fill="#0891b2" stroke="#22d3ee" strokeWidth="1" />

        {/* Left Arm (Waving) */}
        <g>
          <path d="M 25 62 Q 10 52 14 36" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" fill="none">
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 25 62; -12 25 62; 0 25 62"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </path>
          <circle cx="14" cy="36" r="3.5" fill="#22d3ee" />
        </g>

        {/* Right Arm */}
        <path d="M 75 62 Q 85 70 80 80" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="80" cy="80" r="3.5" fill="#22d3ee" />
      </svg>
    </div>
  );
}

export default function MyLibrary() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [dbFilms, setDbFilms] = useState<DBFilm[]>([]);
  const [dbAssets, setDbAssetList] = useState<DBAsset[]>([]);
  const [favoriteFilms, setFavoriteFilms] = useState<number[]>([]);
  const [favoriteAssets, setFavoriteAssets] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "film" | "asset" | "favorites">("all");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  // Download simulation states
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      navigate(ROUTE_PATHS.SIGNIN);
      return;
    }

    setLoading(true);

    Promise.all([
      fetch(`http://localhost:8000/library/${user.id}?t=${Date.now()}`).then((res) => res.json()),
      getFilmsFromDatabase().catch(() => []),
      getAssetsFromDatabase().catch(() => []),
      fetch(`http://localhost:8000/favorites/${user.id}`).then((res) => res.json()).catch(() => ({ films: [], assets: [] }))
    ])
      .then(([libData, films, assets, favData]) => {
        setLibraryItems(libData.library || []);
        setDbFilms(films || []);
        setDbAssetList(assets || []);
        setFavoriteFilms(favData.films || []);
        setFavoriteAssets(favData.assets || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load library data", error);
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

  const handleToggleFavorite = async (itemId: number, itemType: "film" | "asset") => {
    if (!user?.id) return;
    try {
      const response = await fetch("http://localhost:8000/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          item_type: itemType,
          item_id: itemId,
        }),
      });
      if (response.ok) {
        if (itemType === "film") {
          setFavoriteFilms((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
          );
        } else {
          setFavoriteAssets((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
          );
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    }
  };

  const isItemFavorited = (item: LibraryItem) => {
    if (item.item_type === "film") {
      return favoriteFilms.includes(item.item_id);
    } else {
      return favoriteAssets.includes(item.item_id);
    }
  };

  const getMockMetadata = (item: LibraryItem) => {
    const title = item.title.toLowerCase();
    if (title.includes("wall-e") || title.includes("wall")) {
      return { duration: "2:22 min", date: "May 28, 2026", genre: "Sci-Fi" };
    }
    if (title.includes("bread")) {
      return { duration: "3:40 min", date: "May 27, 2026", genre: "Comedy" };
    }
    return {
      duration: item.item_type === "film" ? "2:15 min" : "GLB format",
      date: "May 26, 2026",
      genre: item.item_type === "film" ? "Sci-Fi" : "Asset"
    };
  };

  const enrichedItems = libraryItems.map((item) => {
    const mock = getMockMetadata(item);
    if (item.item_type === "film") {
      const match = dbFilms.find((f) => f.id === item.item_id);
      return {
        ...item,
        genre: match?.category || mock.genre,
        duration: match?.duration || mock.duration,
        date: mock.date,
        preview_url: match?.posterUrl || item.preview_url,
      };
    } else {
      const match = dbAssets.find((a) => a.id === item.item_id);
      return {
        ...item,
        genre: match?.category || mock.genre,
        duration: match?.format ? `${match.format} format` : mock.duration,
        date: mock.date,
        preview_url: match?.thumbnailUrl || item.preview_url,
      };
    }
  });

  const filteredItems = enrichedItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === "all") {
      return matchesSearch;
    } else if (selectedFilter === "film") {
      return matchesSearch && item.item_type === "film";
    } else if (selectedFilter === "asset") {
      return matchesSearch && item.item_type === "asset";
    } else if (selectedFilter === "favorites") {
      return matchesSearch && isItemFavorited(item);
    }
    return false;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortOrder === "latest") {
      return b.id - a.id;
    } else {
      return a.id - b.id;
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

  const statusItems = [
    {
      icon: <Film className="w-4 h-4 text-cyan-400" />,
      label: "Films Collected",
      value: filmsCount,
    },
    {
      icon: <Box className="w-4 h-4 text-cyan-400" />,
      label: "Assets Collected",
      value: assetsCount,
    },
    {
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      label: "Total Items",
      value: libraryItems.length,
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />,
      label: "Storage Access",
      value: (
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active
        </span>
      ),
    },
    {
      icon: <User className="w-4 h-4 text-cyan-400" />,
      label: "Member Since",
      value: "May 2026",
    },
  ];

  return (
    <div className="min-h-screen bg-transparent text-foreground relative py-12 px-4 md:px-8 overflow-hidden animate-fade-in">
      {/* Ambient Backdrop Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-cyan-500/5 blur-[120px] animate-float-blob-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-purple-500/5 blur-[120px] animate-float-blob-2" />
      </div>

      <div className="container mx-auto relative z-10">
        {/* Animated Left-aligned Hero Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-8 lg:gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 text-left w-full"
          >
            {/* Safe/Vault Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20 mb-6">
              <Library className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase font-mono">
                Secure Acquired Assets
              </span>
            </div>

            {/* Title with Radar and Emoji */}
            <div className="relative inline-block mb-4">
              <div className="absolute top-[-30px] right-[-45px]">
                <RadarCrosshair />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white font-orbitron uppercase tracking-wide flex items-center gap-3">
                <span>My Library</span>
                <TechClapperboard />
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-base md:text-lg text-gray-400 max-w-xl mb-8 font-sans font-light">
              Your personal collection of AI films and 3D assets
            </p>

            {/* Horizontal Stats Cards */}
            <div className="grid grid-cols-3 gap-4 max-w-lg">
              {/* Films Card */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-cyan-500/15 bg-[#080c14]/40 backdrop-blur-md shadow-lg">
                <div className="w-10 h-10 rounded-full border border-cyan-400/20 bg-cyan-950/20 flex items-center justify-center text-cyan-400">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xl font-bold text-white font-mono leading-none">
                    {filmsCount}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">
                    Films
                  </span>
                  <span className="block text-[8px] text-cyan-400 font-mono">
                    items
                  </span>
                </div>
              </div>

              {/* Assets Card */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-cyan-500/15 bg-[#080c14]/40 backdrop-blur-md shadow-lg">
                <div className="w-10 h-10 rounded-full border border-cyan-400/20 bg-cyan-950/20 flex items-center justify-center text-cyan-400">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xl font-bold text-white font-mono leading-none">
                    {assetsCount}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">
                    Assets
                  </span>
                  <span className="block text-[8px] text-cyan-400 font-mono">
                    items
                  </span>
                </div>
              </div>

              {/* Total Items Card */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-cyan-500/15 bg-[#080c14]/40 backdrop-blur-md shadow-lg">
                <div className="w-10 h-10 rounded-full border border-cyan-400/20 bg-cyan-950/20 flex items-center justify-center text-cyan-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xl font-bold text-white font-mono leading-none">
                    {libraryItems.length}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">
                    Total
                  </span>
                  <span className="block text-[8px] text-cyan-400 font-mono">
                    items
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Glowing Folder Hologram on Right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 flex justify-center lg:justify-end"
          >
            <FolderHologram />
          </motion.div>
        </div>

        {/* Search, Filter Tabs & Sort Row */}
        {libraryItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col md:flex-row items-center gap-4 mb-10 pb-6 border-b border-white/5"
          >
            {/* Filter Tabs Capsule */}
            <div className="flex bg-[#060b16]/90 backdrop-blur-xl p-1 rounded-full border border-cyan-500/15 gap-1 shadow-md">
              {(["all", "film", "asset", "favorites"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedFilter(type)}
                  className={`px-5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-none ${
                    selectedFilter === type
                      ? "bg-cyan-500/10 border border-cyan-400/50 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                      : "text-gray-400 hover:text-white border border-transparent"
                  }`}
                >
                  {type === "all"
                    ? "All"
                    : type === "film"
                    ? "Films"
                    : type === "asset"
                    ? "Assets"
                    : "Favorites"}
                </button>
              ))}
            </div>

            {/* Search Input Bar */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/50" />
              <input
                type="text"
                placeholder="Search in your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 rounded-full bg-[#060b16]/90 border border-cyan-400/25 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all text-sm cursor-none"
              />
            </div>

            {/* Sort Order Dropdown */}
            <button
              onClick={() => setSortOrder((prev) => (prev === "latest" ? "oldest" : "latest"))}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#060b16]/90 border border-cyan-400/25 text-xs font-mono text-cyan-400 tracking-wider hover:border-cyan-400/60 transition-all cursor-none"
            >
              <span className="uppercase">{sortOrder}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* Two-Column Layout */}
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
              onClick={() => navigate(ROUTE_PATHS.FILMS)}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Cards Grid */}
            <div className="lg:col-span-8 xl:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {sortedItems.map((item) => {
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

                      {/* Media Container with 4:5 Poster Ratio */}
                      <div className="relative aspect-[4/5] overflow-hidden bg-[#03050a]/90 border-b border-white/5">
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

                        {/* Favorite Toggle Button overlay (Top-Right) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(item.item_id, item.item_type);
                          }}
                          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[#080c14]/85 border border-cyan-500/20 flex items-center justify-center text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all duration-300 shadow-md group/fav"
                        >
                          <Heart
                            className={`w-4 h-4 transition-transform duration-300 group-hover/fav:scale-110 ${
                              isItemFavorited(item) ? "fill-cyan-400 text-cyan-400" : "text-cyan-400"
                            }`}
                          />
                        </button>

                        {/* Badges overlay (Bottom-Left) */}
                        <div className="absolute bottom-4 left-4 z-20">
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
                          <p className="text-xs text-cyan-400 font-semibold font-mono">
                            {item.genre}
                          </p>
                          
                          {/* Duration & Date Info */}
                          <div className="flex items-center justify-between text-xs text-cyan-400/70 font-mono pt-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              {item.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                              {item.date}
                            </span>
                          </div>
                        </div>

                        {/* Download Telemetry Progress Bar */}
                        <div className="pt-3 border-t border-white/5">
                          {downloadingId === item.id ? (
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
                              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-extrabold shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/30 transition-all duration-300 cursor-none py-5 rounded-lg flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              <span>DOWNLOAD</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </TiltCard>
                );
              })}
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
              {/* Library Status Box */}
              <div className="bg-[#080c14]/80 backdrop-blur-md border border-cyan-500/15 rounded-2xl p-6 shadow-xl relative">
                <h3 className="text-sm font-semibold text-cyan-400 font-mono tracking-wider uppercase mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Library Status
                </h3>
                <div className="space-y-4">
                  {statusItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <div className="text-sm font-bold text-white font-mono">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explore More Box */}
              <div className="bg-[#080c14]/80 backdrop-blur-md border border-cyan-500/15 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                <WavingRobotMascot />
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white mb-2">Explore More</h3>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-[70%]">
                    Discover new AI films and 3D assets to expand your collection.
                  </p>
                </div>
                <Button
                  onClick={() => navigate(ROUTE_PATHS.FILMS)}
                  className="relative z-10 w-fit bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/25 transition-all mt-4 cursor-none"
                >
                  <span>BROWSE NOW</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}