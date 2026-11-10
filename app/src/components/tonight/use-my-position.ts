"use client";

import { useEffect, useState } from "react";
import { requestPosition } from "@/lib/geo/position";

// Ubicación solo cuando el usuario la pide (para distancias y el punto azul del mapa).
export function useMyPosition(autoLocate = false) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [denied, setDenied] = useState(false);
  const [locating, setLocating] = useState(autoLocate);
  useEffect(() => {
    if (!autoLocate) return;
    let canceled = false;
    requestPosition(navigator.geolocation).then((result) => {
      if (canceled) return;
      if (result.kind === "granted") setPosition({ lat: result.lat, lng: result.lng });
      else setDenied(true);
      setLocating(false);
    });
    return () => { canceled = true; };
  }, [autoLocate]);
  async function locate() {
    setLocating(true); setDenied(false);
    const result = await requestPosition(navigator.geolocation);
    if (result.kind === "granted") setPosition({ lat: result.lat, lng: result.lng });
    else setDenied(true);
    setLocating(false);
  }
  return { position, denied, locating, locate };
}
