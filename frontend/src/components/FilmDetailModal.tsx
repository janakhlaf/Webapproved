import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Film, ROUTE_PATHS } from "@/lib/index";
import { Download, Clock, Calendar, User } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface FilmDetailModalProps {
  film: Film | null;
  open: boolean;
  onClose: () => void;
}

export function FilmDetailModal({ film, open, onClose }: FilmDetailModalProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (!film) return null;

  const handleDownload = () => {
    if (!isAuthenticated) {
      onClose();
      navigate(ROUTE_PATHS.SIGNIN);
      return;
    }

    console.log("Download film:", film.id);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-foreground">
            {film.title}
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="relative aspect-video rounded-xl overflow-hidden bg-muted/20 border border-border/30">
            <img
              src={film.posterUrl}
              alt={film.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="secondary"
              className="px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
            >
              {film.category}
            </Badge>

            {film.duration && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{film.duration}</span>
              </div>
            )}

            {film.releaseYear && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{film.releaseYear}</span>
              </div>
            )}

            {film.director && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{film.director}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-foreground">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {film.description}
            </p>
          </div>

          {film.tags && film.tags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {film.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="px-3 py-1 text-xs bg-muted/30 border-border/50 hover:bg-muted/50"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleDownload}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Film
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="px-8 border-border/50 hover:bg-muted/50"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}