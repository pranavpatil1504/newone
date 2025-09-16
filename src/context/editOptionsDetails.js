import React, { createContext, useContext, useState } from "react";

// Create the editOptionsDetails
const editOptionsDetails = createContext();

// Create a custom hook for easy access to the map context
export const useEditOptions = () => useContext(editOptionsDetails);

// Create the provider component
export const EditOptionProvider = ({ children }) => {
  const [editOptions, setEditOptions] = useState();
  const [label, setLabel] = useState();
  return (
    <editOptionsDetails.Provider
      value={{ editOptions, setEditOptions, label, setLabel }}
    >
      {children}
    </editOptionsDetails.Provider>
  );
};
