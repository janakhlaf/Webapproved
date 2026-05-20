import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Slider() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchSlides();
  }, []);

  async function fetchSlides() {
    const { data } = await supabase
      .from("sliders")
      .select("*")
      .eq("active", true);

    if (data && data.length > 0) {
      setSlides(data);

      // ⏳ small delay to ensure images are ready
      setTimeout(() => setReady(true), 800);
    }
  }

  useEffect(() => {
    if (!ready || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 2200); // ⚡ balanced fast speed

    return () => clearInterval(interval);
  }, [ready, slides]);

  if (!slides.length) return null;

  return (
    <div className="relative w-full aspect-[16/3.5] overflow-hidden rounded-xl bg-black group">

      {/* 🌌 cinematic glow */}
      <div className="absolute -inset-10 bg-gradient-to-r from-blue-600/20 via-transparent to-purple-600/20 blur-3xl opacity-50" />

      {/* 🧊 3D frame */}
      <div className="absolute inset-0 rounded-xl shadow-[0_50px_140px_rgba(0,0,0,0.8)] ring-1 ring-white/10" />

      {/* 🎥 slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`
            absolute inset-0 transform-gpu
            transition-all duration-500 ease-out
            ${
              i === current
                ? "opacity-100 scale-100 z-20"
                : "opacity-0 scale-110 blur-sm z-0"
            }
          `}
        >

          {s.media_type === "video" ? (
            <video
              src={s.media_url}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover scale-110"
            />
          ) : (
            <img
              src={s.media_url}
              loading="eager"
              className="w-full h-full object-cover scale-110"
            />
          )}

          {/* 🌑 cinematic overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
      ))}

      {/* ✨ light sweep */}
      <div className="absolute inset-0 before:content-[''] before:absolute before:-left-[70%] before:w-[70%] before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:skew-x-12 group-hover:before:animate-[shine_1.2s]" />

      {/* 🌑 vignette */}
      <div className="absolute inset-0 shadow-[inset_0_120px_140px_rgba(0,0,0,0.75)] pointer-events-none" />

      {/* 🎯 indicators */}
      <div className="absolute bottom-3 right-4 flex gap-1.5 z-40">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`
              transition-all duration-200 rounded-full
              ${
                i === current
                  ? "w-6 h-1 bg-white"
                  : "w-1.5 h-1.5 bg-white/30"
              }
            `}
          />
        ))}
      </div>

      {/* 🌌 micro glow */}
      <div className="absolute inset-0 bg-radial-gradient opacity-15 pointer-events-none" />
    </div>
  );
}