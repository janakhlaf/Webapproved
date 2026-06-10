import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Film, ROUTE_PATHS } from "@/lib/index";
import { ShoppingCart, Clock, Calendar, User, Play } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface FilmDetailModalProps {
  film: Film | null;
  open: boolean;
  onClose: () => void;
}

export function FilmDetailModal({
  film,
  open,
  onClose,
}: FilmDetailModalProps) {

  const navigate = useNavigate();

 const { isAuthenticated, user } = useAuth();

  const { addToCart, cartItems } = useCart();

  const videoRef = useRef<HTMLVideoElement>(null);

  const [started, setStarted] = useState(false);
  const [showCartMessage, setShowCartMessage] = useState(false);

  useEffect(() => {

    if (!open) {

      setStarted(false);

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }

  }, [open]);

  useEffect(() => {

    setStarted(false);

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

  }, [film]);

  if (!film) return null;

  const detailImage =
    film.detailPosterUrl ||
    film.posterUrl;

  const filmCartId = `film-${film.id}`;

  const isAdded = cartItems.some(
    (item) => item.id === filmCartId
  );

const handleAddToCart = async () => {
  if (!isAuthenticated || !user?.id) {
    onClose();
    navigate(ROUTE_PATHS.SIGNIN);
    return;
  }

  if (isAdded) {
    setShowCartMessage(true);

    setTimeout(() => {
      setShowCartMessage(false);
    }, 3000);

    return;
  }

  await addToCart(
    {
      id: filmCartId,
      title: film.title,
      category: film.category,
      price: film.price || 19.99,
      image: film.posterUrl,
      itemType: "film",
    },
    Number(user.id)
  );

  setShowCartMessage(true);

  setTimeout(() => {
    setShowCartMessage(false);
  }, 3000);
};
  const handleStartVideo = async () => {

    setStarted(true);

    try {

      await videoRef.current?.play();

    } catch (error) {

      console.error(
        "Video play failed:",
        error
      );
    }
  };

  return (
    <>
   {showCartMessage &&
  createPortal(
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      className="fixed top-24 right-8 z-[999999] w-[360px] rounded-xl border border-cyan-400/40 bg-[#07111f]/95 backdrop-blur-xl px-5 py-4 shadow-[0_0_30px_rgba(34,211,238,0.35)]"
    >
      <p className="text-cyan-300 font-semibold">
        Added to Cart Successfully
      </p>

      <p className="text-sm text-gray-300">
        Film has been added to your cart.
      </p>
    </motion.div>,
    document.body
  )}

    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#080c14]/95 backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.95)] relative rounded-2xl">
        {/* HUD Corner brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-2xl pointer-events-none" />
       
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

            {film.videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  controls={started}
                  preload="metadata"
                  poster={detailImage}
                  className="w-full h-full object-cover"
                >

                  <source
                    src={film.videoUrl}
                    type="video/mp4"
                  />

                  Your browser does not support the video tag.

                </video>

                {!started && (
                  <button
                    type="button"
                    onClick={handleStartVideo}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors duration-200"
                    aria-label={`Play ${film.title}`}
                  >

                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/20 shadow-xl">

                      <Play className="w-8 h-8 text-white fill-white ml-1" />

                    </div>
                  </button>
                )}
              </>
            ) : (
              <>
                <img
                  src={detailImage}
                  alt={film.title}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              </>
            )}
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

            <h3 className="text-xl font-semibold text-foreground">
              Description
            </h3>

            <p className="text-muted-foreground leading-relaxed">
              {film.description}
            </p>

          </div>

          <div className="pt-4 space-y-3">

            <div>

              <p className="text-sm text-muted-foreground">
                Price
              </p>

              <p className="text-3xl font-bold text-primary">
                ${film.price || 19.99}
              </p>

            </div>

             <div className="flex gap-3">
               <Button
                 onClick={handleAddToCart}
                 className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_15px_rgba(0,240,255,0.25)] font-bold border-none transition-all duration-200"
               >
                 <ShoppingCart className="w-4 h-4 mr-2 fill-current" />
                 {isAdded
                   ? "Added to Cart"
                   : "Add to Cart"}
               </Button>

               <Button
                 onClick={onClose}
                 variant="outline"
                 className="px-8 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-400/10 text-cyan-300"
               >
                 Close
               </Button>
             </div>
          </div>
        </motion.div>
      </DialogContent>
   </Dialog>
  </>
);
  
}