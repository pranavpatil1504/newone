import React from "react";
import { FaSpinner } from "react-icons/fa";
import "../styles/LoadingSpinner.css"; // We will create this CSS file next

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <FaSpinner className="loading-icon" />
        <p className="loading-text">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
