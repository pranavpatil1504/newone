import React, { createContext, useState, useContext } from "react";

// Create the context
const UnitContext = createContext();

// Create a provider component
export const UnitProvider = ({ children }) => {
  const [selectedUnit, setSelectedUnit] = useState("meters"); // Default unit

  return (
    <UnitContext.Provider value={{ selectedUnit, setSelectedUnit }}>
      {children}
    </UnitContext.Provider>
  );
};

// Create a custom hook to use the unit context
export const useUnit = () => {
  return useContext(UnitContext);
};