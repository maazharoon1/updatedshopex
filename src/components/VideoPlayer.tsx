import { useEffect, useState } from "react";

interface VideoPlayerProps {
  src?: string;
  poster?: string;
  title?: string;
  className?: string;
}

export function VideoPlayer({ src, poster, title = "Project video", className = "" }: VideoPlayerProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <div
      className={`group relative aspect-video overflow-hidden bg-black shadow-2xl shadow-black/30 ${className}`}
      aria-label={title}
    >
      {src ? (
        <video
          className="h-full w-full bg-black object-contain accent-accent"
          controls
          playsInline
          preload="none"
          poster={poster}
          aria-label={title}
          onError={() => setFailed(true)}
        >
          <source src={src} onError={() => setFailed(true)} />
          Your browser does not support HTML video.
        </video>
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center font-sans text-xs uppercase tracking-[0.2em] text-white/60">
          Video coming soon
        </div>
      )}
      {failed && <p role="alert" className="absolute inset-x-0 top-0 bg-black/90 p-4 text-center text-sm text-white">Video could not load. Try the direct video link below.</p>}

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}
