import React, { useState } from "react";
import axios from "axios";
import { api } from "../config";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "../styles/Login.css"; // Your dedicated CSS file
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSpinner,
} from "react-icons/fa";
import { GiDeliveryDrone } from "react-icons/gi";
import { toast } from "react-toastify";

const Login = () => {
  // Your existing state and hooks are preserved
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { storeUser } = useUser();

  // New state for UI enhancements from the reference
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${api}login`, { email, password });

      if (response.status === 200) {
        storeUser(JSON.stringify(response.data));
        toast.success("Login Successful! Redirecting...");
        setTimeout(() => {
          navigate("/projects");
        }, 1500);
        // On success, we navigate away, so we don't need to set isLoading to false.
      }
    } catch (error) {
      // The 'error' variable is defined and only exists within this 'catch' block.
      console.log(error);
      toast.error("Wrong Credentials. Please try again.");
      setErrorMessage("Wrong Credentials. Please try again.");

      // ===================================================================
      // == THIS IS THE FIX ================================================
      // ===================================================================
      // We set isLoading to false here, inside the catch block, because an
      // error has occurred and we need to stop the spinner to let the user retry.
      setIsLoading(false);
    }
    // The 'finally' block is now removed as it was causing the error and is no longer needed.
  };
  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <div className="login-header">
          <div className="login-icon-wrapper">
            <GiDeliveryDrone className="login-icon" />
          </div>
          <h1 className="login-title">WebGIS</h1>
          <p className="login-subtitle">Sign in to access your projects</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" />
              <input
                id="email"
                type="text"
                name="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="error-message-container">
              <p className="error-message">{errorMessage}</p>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" disabled={isLoading} className="submit-btn">
            {isLoading ? (
              <>
                <FaSpinner className="loader-icon" />
                <span>Signing In...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
