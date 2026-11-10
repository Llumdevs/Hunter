"use client";

import { useState } from "react";
import { requestPosition } from "@/lib/geo/position";

// Ubicación solo cuando el usuario la pide (para distancias y el punto azul del mapa).
export function useMyPosition() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [denied, setDenied] = useState(false);
  async function locate() {
    const result = await requestPosition(navigator.geolocation);
    if (result.kind === "granted") setPosition({ lat: result.lat, lng: result.lng });
    else setDenied(true);
  }
  return { position, denied, locate };
}
