import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Slider() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSlides();
  }, []);

  async function fetchSlides() {
    setLoading(true);

    const { data, error } = await supabase
      .from("sliders")
      .select("*")
      .eq("active", true);

    console.log("SLIDER DATA:", data);
    console.log("SLIDER ERROR:", error);

    if (error) {
      setError(error.message);
      setSlides([]);
    } else {
      setSlides(data || []);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ width: "100%", height: "180px" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: "100%", height: "180px", color: "red" }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "180px",
        overflow: "hidden",
        background: "#000"
      }}
    >
      {slides.length === 0 ? (
        <p style={{ color: "white" }}>No slides found</p>
      ) : (
        slides.map((s) => (
          <img
            key={s.id}
            src={s.media_url}
            alt={s.title || "slide"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block"
            }}
          />
        ))
      )}
    </div>
  );
}