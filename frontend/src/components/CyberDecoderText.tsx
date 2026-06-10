import { useEffect, useState } from "react";

export function CyberDecoderText({ text, speed = 40, delay = 0 }: { text: string; speed?: number; delay?: number }) {
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
