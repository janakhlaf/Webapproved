import { useEffect, useRef, useState } from 'react';
import { Asset3DViewer } from './Asset3DViewer';

interface Props {
  modelType: string;
  modelUrl?: string;
  className?: string;
  viewMode?: 'card' | 'modal';
}

export function LazyAsset3DViewer({
  modelType,
  modelUrl,
  className = '',
  viewMode = 'card',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: '80px',
        threshold: 0.15,
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`w-full h-full ${className}`}>
      {isVisible ? (
        <Asset3DViewer
          modelType={modelType}
          modelUrl={modelUrl}
          viewMode={viewMode}
          className="w-full h-full"
        />
      ) : (
        <div
          className="w-full h-full min-h-[300px] rounded-lg overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, oklch(0.08 0.015 240) 0%, oklch(0.12 0.02 240) 100%)',
          }}
        />
      )}
    </div>
  );
}