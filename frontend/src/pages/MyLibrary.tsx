import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Download, Library } from "lucide-react";

type LibraryItem = {
  id: string;
  title: string;
  category?: string;
  image?: string;
  itemType: "film" | "asset";
  videoUrl?: string;
  downloadUrl?: string;
};

export default function MyLibrary() {
  const purchasedItems: LibraryItem[] = useMemo(() => {
    const saved = localStorage.getItem("purchased_items");
    return saved ? JSON.parse(saved) : [];
  }, []);

  const films = purchasedItems.filter((item) => item.itemType === "film");
  const assets = purchasedItems.filter((item) => item.itemType === "asset");

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Library className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">My Library</h1>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Purchased Films</h2>

            {films.length === 0 ? (
              <p className="text-muted-foreground">No purchased films yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {films.map((film) => (
                  <Card
                    key={film.id}
                    className="overflow-hidden bg-card/60 border border-border/40"
                  >
                    {film.image && (
                      <img
                        src={film.image}
                        alt={film.title}
                        className="w-full h-56 object-cover"
                      />
                    )}

                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">{film.title}</h3>
                        {film.category && (
                          <Badge variant="secondary">{film.category}</Badge>
                        )}
                      </div>

                      {film.videoUrl ? (
                        <div className="flex gap-2">
                          <Button asChild className="flex-1">
                            <a
                              href={film.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Play
                            </a>
                          </Button>

                          <Button asChild variant="outline" className="flex-1">
                            <a href={film.videoUrl} download={film.title}>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          This film is currently unavailable.
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Purchased Assets</h2>

            {assets.length === 0 ? (
              <p className="text-muted-foreground">No purchased assets yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.map((asset) => (
                  <Card
                    key={asset.id}
                    className="overflow-hidden bg-card/60 border border-border/40"
                  >
                    {asset.image && (
                      <img
                        src={asset.image}
                        alt={asset.title}
                        className="w-full h-56 object-cover"
                      />
                    )}

                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">{asset.title}</h3>
                        {asset.category && (
                          <Badge variant="secondary">{asset.category}</Badge>
                        )}
                      </div>

                      {asset.downloadUrl ? (
                        <Button asChild variant="outline" className="w-full">
                          <a href={asset.downloadUrl} download={asset.title}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          This asset is currently unavailable.
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}