"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type NewRideContextValue = {
  showNewRide: boolean;
  openNewRide: () => void;
  closeNewRide: () => void;
};

const NewRideContext = createContext<NewRideContextValue | null>(null);

export function NewRideProvider({ children }: { children: ReactNode }) {
  const [showNewRide, setShowNewRide] = useState(false);
  const value = useMemo(
    () => ({
      showNewRide,
      openNewRide: () => setShowNewRide(true),
      closeNewRide: () => setShowNewRide(false),
    }),
    [showNewRide],
  );

  return <NewRideContext.Provider value={value}>{children}</NewRideContext.Provider>;
}

export function useNewRide() {
  const ctx = useContext(NewRideContext);
  if (!ctx) {
    throw new Error("useNewRide must be used within a NewRideProvider");
  }
  return ctx;
}
