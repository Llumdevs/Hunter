"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEMO_STORAGE_KEY, initialDemoState, readDemoState, type DemoState } from "@/lib/demo/state";

const DemoContext = createContext<{ state: DemoState; ready: boolean; update: (change: (state: DemoState) => DemoState) => void; reset: () => void; storageFailed: boolean } | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(initialDemoState);
  const [ready, setReady] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  useEffect(() => {
    // Leer después de hidratar: el servidor nunca lee datos de otro navegador.
    Promise.resolve().then(() => {
      try { setState(readDemoState(localStorage.getItem(DEMO_STORAGE_KEY))); }
      catch { setStorageFailed(true); }
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state)); }
    catch { Promise.resolve().then(() => setStorageFailed(true)); }
  }, [state, ready]);
  function update(change: (state: DemoState) => DemoState) {
    setState(change);
  }
  return <DemoContext.Provider value={{ state, ready, update, reset: () => update(initialDemoState), storageFailed }}>{children}</DemoContext.Provider>;
}
export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoProvider required");
  return value;
}
