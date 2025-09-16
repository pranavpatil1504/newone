import Project from "./Pages/Project";
import Projects from "./Pages/Projects";
import Login from "./Pages/Login";
import ProjectVideosPage from "./Pages/ProjectVideosPage";
import ProjectPhotosPage from "./Pages/ProjectPhotosPage";
import ProjectPanoPage from "./Pages/ProjectPanoPage";
import { Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "./context/UserContext";
import Compare from "./Pages/Compare";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    const toastStyles = `
      .Toastify__toast-theme--dark {
        background-color: var(--bg-secondary) !important;
        border: 1px solid var(--border-primary) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        border-radius: 0.5rem !important;
      }
      .Toastify__toast-body {
        color: var(--text-primary) !important;
        font-family: inherit !important;
      }
      .Toastify__close-button {
        color: var(--text-secondary) !important;
        opacity: 0.8 !important;
      }
      .Toastify__close-button:hover {
        color: var(--text-primary) !important;
        opacity: 1 !important;
      }
      .Toastify__progress-bar-theme--dark.Toastify__progress-bar--success {
        background: var(--accent-primary) !important;
      }
      .Toastify__progress-bar-theme--dark.Toastify__progress-bar--error {
        background: var(--error) !important;
      }
    `;
    const styleElement = document.createElement("style");
    styleElement.innerHTML = toastStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    const isAuthenticated = user || localStorage.getItem("user") != null;
    if (isAuthenticated) {
      setLoggedIn(true);
      if (window.location.pathname === "/") {
        navigate("/projects");
      }
    } else {
      setLoggedIn(false);
      if (window.location.pathname !== "/") {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const isAuthenticated = user || localStorage.getItem("user") != null;

  return (
    <div className="App">
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      <Routes>
        {isAuthenticated ? (
          <>
            <Route path="/projects" element={<Projects />} />
            <Route path="/project/:id/:orthoId" element={<Project />} />
            <Route path="/project/:id/videos" element={<Project />} />
            <Route path="/project/:id/photos" element={<Project />} />
            <Route path="/project/:id/pano" element={<Project />} />
            <Route path="/compare/:id/:id1/:id2" element={<Compare />} />
            <Route path="*" element={<Projects />} />
          </>
        ) : (
          <>
            <Route path="*" element={<Login />} />
          </>
        )}
      </Routes>
    </div>
  );
}

export default App;
