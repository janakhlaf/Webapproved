import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";
import { useAuth } from "@/hooks/useAuth";
import { Asset3DViewer } from "@/components/Asset3DViewer";

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

export default function MyLibrary() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDownload = async (item: LibraryItem) => {
    const downloadUrl = getDownloadUrl(item);

    if (!downloadUrl) {
      alert("No downloadable file available for this item.");
      return;
    }

    const fullUrl = getFullStorageUrl(downloadUrl);

    try {
      const response = await fetch(fullUrl);

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const extension = getFileExtension(fullUrl);
      const fileName = `${item.title}.${extension}`;

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

  if (loading) {
    return (
      <div
        style={{
          background: "black",
          color: "white",
          minHeight: "100vh",
          padding: "40px",
        }}
      >
        Loading library...
      </div>
    );
  }

  return (
    <div
      style={{
        background: "black",
        color: "white",
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <h1 style={{ fontSize: "40px", marginBottom: "30px" }}>
        My Library 🎬
      </h1>

      {libraryItems.length === 0 ? (
        <p>No items in library.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
            gap: "20px",
          }}
        >
          {libraryItems.map((item) => {
           const modelPath =
  item.bucket_path || item.download_url || item.file_url || item.asset_url || "";
            const modelUrl = getFullStorageUrl(modelPath);

            return (
              <div
                key={item.id}
                style={{
                  background: "#111",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid #222",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "350px",
                    background: "#222",
                  }}
                >
                  {item.item_type === "asset" && modelUrl ? (
                    <Asset3DViewer
                      modelUrl={modelUrl}
                      modelType={getModelType(modelPath)}
                      viewMode="card"
                      className="w-full h-full"
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
                      style={{
                        width: "100%",
                        height: "350px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "350px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#888",
                      }}
                    >
                      No preview image
                    </div>
                  )}
                </div>

                <div style={{ padding: "15px" }}>
                  <h2 style={{ fontSize: "22px", marginBottom: "10px" }}>
                    {item.title}
                  </h2>

                  <p style={{ color: "#00e5ff", fontWeight: "bold" }}>
                    ${item.price}
                  </p>

                  <p
                    style={{
                      marginTop: "10px",
                      color: "#888",
                      textTransform: "capitalize",
                    }}
                  >
                    {item.item_type}
                  </p>

                  <button
                    onClick={() => handleDownload(item)}
                    style={{
                      marginTop: "15px",
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "none",
                      background: "#00e5ff",
                      color: "black",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}