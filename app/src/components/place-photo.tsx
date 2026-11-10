import Image from "next/image";
import { publicEnv } from "@/lib/env";
import { placePhotoUrl } from "@/lib/venue/photo-file";

// Foto del local o, si aún no tiene, el degradado de marcador.
export function PlacePhoto({ path, alt, className = "" }: { path: string | null; alt: string; className?: string }) {
  if (!path) return <div aria-hidden className={`photo-placeholder ${className}`} />;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* unoptimized: Supabase local está en una IP privada y el optimizador de Next no la sirve. */}
      <Image src={placePhotoUrl(publicEnv.supabaseUrl, path)} alt={alt} fill unoptimized className="object-cover" />
    </div>
  );
}
