import React, { createContext, useContext, useState } from "react";

// Create the userContext
const userContext = createContext();

// Create a custom hook for easy access to the map context
export const useUser = () => useContext(userContext);

// Create the provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState();
  const storeUser = (data) => {
    setUser(data);
    localStorage.setItem("user", data);
  };
  const logout = () => {
    localStorage.removeItem("user");
  };

  return (
    <userContext.Provider value={{ storeUser, user, logout }}>
      {children}
    </userContext.Provider>
  );
};
