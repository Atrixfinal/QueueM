'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Location, LocationStatus } from '@/lib/types/location';

interface LocationContextType {
  selectedLocation: Location | null;
  locationStatus: LocationStatus | null;
  setSelectedLocation: (location: Location | null) => void;
  setLocationStatus: (status: LocationStatus | null) => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus | null>(null);

  return (
    <LocationContext.Provider
      value={{ selectedLocation, locationStatus, setSelectedLocation, setLocationStatus }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within a LocationProvider');
  return context;
}
