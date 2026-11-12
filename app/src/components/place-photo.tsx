import Image from "next/image";
import { publicEnv } from "@/lib/env";
import { placePhotoUrl } from "@/lib/venue/photo-file";

type Props = {
  path: string | null;
  alt: string;
  className?: string;
  demo?: boolean;
  variant?: "night" | "live" | "terrace" | "electric";
  eager?: boolean;
};

// Fotos reales tienen prioridad. Imágenes editoriales IA solo en locales demo.
export function PlacePhoto({ path, alt, className = "", demo = false, variant = "night", eager = false }: Props) {
  const position = className.split(" ").includes("absolute") ? "" : "relative";
  if (!path && !demo) return <div aria-hidden className={`photo-placeholder ${className}`} />;
  return (
    <div className={`${position} overflow-hidden ${className}`}>
      <Image
        src={path ? placePhotoUrl(publicEnv.supabaseUrl, path) : `/images/${variant}-session.webp`}
        alt={path ? alt : ""}
        fill
        sizes="(max-width: 448px) 100vw, 448px"
        loading={eager ? "eager" : "lazy"}
        // Supabase local está en una IP privada y el optimizador no la sirve.
        unoptimized={Boolean(path)}
        className="object-cover"
      />
    </div>
  );
}
