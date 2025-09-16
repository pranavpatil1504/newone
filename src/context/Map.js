import React, { createContext, useContext, useState } from "react";

// Create the MapContext
const MapContext = createContext();

// Create a custom hook for easy access to the map context
export const useMap = () => useContext(MapContext);

// Create the provider component
export const MapProvider = ({ children }) => {
  const [map, setMap] = useState(null);
  const [source, setSource] = useState(null);

  return (
    <MapContext.Provider value={{ map, setMap, setSource, source }}>
      {children}
    </MapContext.Provider>
  );
};
