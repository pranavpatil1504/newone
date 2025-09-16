import React, { createContext, useContext, useEffect, useState } from "react";

// Create the orthoContext
const orthoContext = createContext();

// Create a custom hook for easy access to the map context
export const useOrthoContext = () => useContext(orthoContext);

// Create the provider component
export const OrhtoProvider = ({ children }) => {
  const [ortho, setOrtho] = useState([]);
  const [url, setUrl] = useState("");
  const [projectDate, setProjectDate] = useState("");

  return (
    <orthoContext.Provider
      value={{ ortho, setOrtho, url, setUrl, projectDate, setProjectDate }}
    >
      {children}
    </orthoContext.Provider>
  );
};
