import { useEffect, useState } from "react";

interface LibraryItem {
  id: number;
  user_id: number;
  item_id: number;
  item_type: string;
  title: string;
  preview_url: string;
  price: number;
}

export default function Library() {

  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    fetch("http://127.0.0.1:9000/library/1")
      .then((res) => res.json())
      .then((data) => {

        setLibraryItems(data.library || []);
        setLoading(false);

      })
      .catch((error) => {

        console.error(
          "Failed to load library",
          error
        );

        setLoading(false);

      });

  }, []);

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

      <h1
        style={{
          fontSize: "40px",
          marginBottom: "30px",
        }}
      >
        My Library 🎬
      </h1>

      {libraryItems.length === 0 ? (

        <p>No items in library.</p>

      ) : (

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill,minmax(250px,1fr))",

            gap: "20px",
          }}
        >

          {libraryItems.map((item) => (

            <div
              key={item.id}
              style={{
                background: "#111",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid #222",
              }}
            >

              <img
                src={item.preview_url}
                alt={item.title}
                style={{
                  width: "100%",
                  height: "350px",
                  objectFit: "cover",
                }}
              />

              <div
                style={{
                  padding: "15px",
                }}
              >

                <h2
                  style={{
                    fontSize: "22px",
                    marginBottom: "10px",
                  }}
                >
                  {item.title}
                </h2>

                <p
                  style={{
                    color: "#00e5ff",
                    fontWeight: "bold",
                  }}
                >
                  ${item.price}
                </p>

                <p
                  style={{
                    marginTop: "10px",
                    color: "#888",
                  }}
                >
                  {item.item_type}
                </p>

              </div>
            </div>

          ))}
        </div>
      )}
    </div>
  );
}